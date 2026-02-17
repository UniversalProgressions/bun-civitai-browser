import { type } from "arktype";
import { Elysia, t } from "elysia";
import {
  creatorsResponseSchema,
  creatorsRequestOptionsSchema,
} from "../../civitai-api/v1/models/creators";
import {
  modelSchema,
  modelsRequestOptionsSchema,
  modelsResponseSchema,
} from "../../civitai-api/v1/models/models";
import { modelByIdSchema } from "../../civitai-api/v1/models/model-id";
import { modelVersionEndpointDataSchema } from "../../civitai-api/v1/models/model-version";
import { createCivitaiClient } from "../../civitai-api/v1";
import type { CivitaiError } from "../../civitai-api/v1/client/errors";
import {
  isValidationError,
  isNetworkError,
  isBadRequestError,
  isUnauthorizedError,
  isNotFoundError,
} from "../../civitai-api/v1/client/errors";
import { getSettings } from "../settings/service";
import { Client } from "@gopeed/rest";
import { join } from "node:path";
import { CreateTaskWithRequest } from "@gopeed/types";
import { ModelLayout, getMediaDir } from "../local-models/service/file-layout";
import { upsertOneModelVersion } from "../db/crud/modelVersion";
import { extractFilenameFromUrl } from "../../civitai-api/v1/utils";
import { writeJsonFile } from "write-json-file";

export const client = createCivitaiClient({
  apiKey: getSettings().civitai_api_token, // Read API key from environment variable
  timeout: 30000, // Reduced to 30 seconds timeout to avoid long waits
  validateResponses: true, // Do not validate responses (recommended to enable in production)
});

export class CivitaiApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public details?: any,
  ) {
    super(message);
    this.name = "CivitaiApiError";
  }
}

export class CivitaiValidationError extends Error {
  constructor(
    public message: string,
    public arkSummary: string,
    public validationDetails: any,
  ) {
    super(message);
    this.name = "CivitaiValidationError";
  }
}

// Gopeed related error classes
export class ExternalServiceError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class GopeedHostNotSpecifiedError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = "GopeedHostNotSpecifiedError";
  }
}

// Helper function to convert CivitaiError to appropriate error class
function handleCivitaiError(error: CivitaiError): never {
  if (isValidationError(error)) {
    throw new CivitaiValidationError(
      error.message,
      error.details?.summary || "Validation failed",
      error.details,
    );
  } else if (isNetworkError(error)) {
    throw new CivitaiApiError(error.message, error.status, error.originalError);
  } else if (isBadRequestError(error)) {
    // For BadRequestError, extract the actual error details
    throw new CivitaiApiError(
      error.message,
      error.status,
      error.details, // Pass the actual details, not the entire error object
    );
  } else if (isUnauthorizedError(error)) {
    throw new CivitaiApiError(error.message, error.status, error.details);
  } else if (isNotFoundError(error)) {
    throw new CivitaiApiError(error.message, error.status, error.details);
  } else {
    // Handle unknown error types - this should never happen with the current error types
    // but we handle it defensively
    const errorAsAny = error as any;
    throw new CivitaiApiError(
      errorAsAny.message || "Unknown Civitai API error",
      "status" in errorAsAny ? errorAsAny.status : 500,
      errorAsAny,
    );
  }
}

// Gopeed client helper function
function getGopeedClient() {
  const settings = getSettings();
  if (!settings.gopeed_api_host) {
    throw new GopeedHostNotSpecifiedError(
      `Please specify gopeed API address to use model downloading feature.`,
    );
  }
  const client = new Client({
    host: settings.gopeed_api_host,
    token: settings.gopeed_api_token || "",
  });
  return client;
}

export default new Elysia({ prefix: `/civitai_api` })
  .error({
    CivitaiApiError,
    CivitaiValidationError,
    ExternalServiceError,
    GopeedHostNotSpecifiedError,
  })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "CivitaiApiError":
        return status(error.status || 500, {
          code: error.status,
          message: error.message,
          details: error.details,
        });
      case "CivitaiValidationError":
        return status(409, {
          message: error.message,
          arkSummary: error.arkSummary,
          validationDetails: error.validationDetails,
        });
      case "ExternalServiceError":
        return status(500, error.message);
      case "GopeedHostNotSpecifiedError":
        return status(400, error.message);
    }
  })
  .use(
    new Elysia({ prefix: "/v1" })
      // POST /v1/creators - List creators
      // Using POST instead of GET to handle complex JSON query objects more conveniently
      .post(
        "/creators",
        async ({ body }) => {
          const result = await client.creators.list(body);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          body: creatorsRequestOptionsSchema,
          response: creatorsResponseSchema,
        },
      )
      // POST /v1/models - List models
      // Using POST instead of GET to handle complex JSON query objects more conveniently
      .post(
        "/models",
        async ({ body }) => {
          const result = await client.models.list(body);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          body: modelsRequestOptionsSchema,
          response: modelsResponseSchema,
        },
      )
      // GET /v1/models/next-page - Get next page of models using nextPage URL
      .post(
        "/models/next-page",
        async ({ body }) => {
          const { nextPage } = body;
          if (!nextPage || typeof nextPage !== "string") {
            throw new CivitaiApiError(
              "nextPage parameter is required and must be a string",
              400,
            );
          }

          const result = await client.models.nextPage(nextPage);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          body: type({ nextPage: "string" }),
          response: modelsResponseSchema,
        },
      )
      // GET /v1/models/:id - Get model by ID
      .get(
        "/models/:id",
        async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new CivitaiApiError("Invalid model ID", 400);
          }

          const result = await client.models.getById(id);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          params: type({ id: "string" }),
          response: modelByIdSchema,
        },
      )
      // GET /v1/models/:id/model - Get model (converted format)
      .get(
        "/models/:id/model",
        async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new CivitaiApiError("Invalid model ID", 400);
          }

          const result = await client.models.getModel(id);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          params: type({ id: "string" }),
          response: modelSchema,
        },
      )
      // GET /v1/model-versions/:id - Get model version by ID
      .get(
        "/model-versions/:id",
        async ({ params }) => {
          const id = parseInt(params.id);
          if (isNaN(id)) {
            throw new CivitaiApiError("Invalid model version ID", 400);
          }

          const result = await client.modelVersions.getById(id);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          params: type({ id: "string" }),
          response: modelVersionEndpointDataSchema,
        },
      )
      // GET /v1/model-versions/by-hash/:hash - Get model version by hash
      .get(
        "/model-versions/by-hash/:hash",
        async ({ params }) => {
          const result = await client.modelVersions.getByHash(params.hash);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          params: type({ hash: "string" }),
          response: modelVersionEndpointDataSchema,
        },
      )
      // POST /v1/download/model-version - Download model version files
      .post(
        "/download/model-version",
        async ({ body }) => {
          const { modelVersionId, model } = body;
          const settings = getSettings();

          // Check gopeed server status
          const gopeed = getGopeedClient();

          // Resolve model file download tasks
          const modelFileDownloadTasks: Array<CreateTaskWithRequest> = [];
          const milayout = new ModelLayout(settings.basePath, model);
          const mvlayout = milayout.getModelVersionLayout(modelVersionId);

          // Find the model version from the model's versions array
          const modelVersionData = model.modelVersions.find(
            (mv) => mv.id === modelVersionId,
          );

          if (!modelVersionData) {
            throw new CivitaiApiError(
              `Model version ${modelVersionId} not found in model ${model.id}`,
              404,
            );
          }

          // Get the full model version details from the API
          const versionResult =
            await client.modelVersions.getById(modelVersionId);
          if (versionResult.isErr()) {
            handleCivitaiError(versionResult.error);
          }

          const modelVersion = versionResult.value;

          for (let index = 0; index < modelVersion.files.length; index++) {
            const file = modelVersion.files[index];
            // Directly use file.downloadUrl with Authorization header
            modelFileDownloadTasks.push({
              req: {
                url: file.downloadUrl,
                extra: {
                  header: {
                    Authorization: `Bearer ${settings.civitai_api_token}`,
                  },
                },
                labels: {
                  CivitAI: `Model File`,
                },
              },
              opts: {
                name: mvlayout.getFileName(file.id),
                path: mvlayout.getFileDirPath(),
              },
            });
          }

          // Download Start
          // 1. save json data
          await writeJsonFile(milayout.getApiInfoJsonPath(), model);
          await writeJsonFile(mvlayout.getApiInfoJsonPath(), modelVersion);

          // 2. download model files
          const modelfileTasksId: Array<string> = [];

          for (let index = 0; index < modelFileDownloadTasks.length; index++) {
            const task = modelFileDownloadTasks[index];
            if (
              await Bun.file(join(task.opts!.path!, task.opts!.name!)).exists()
            ) {
              continue;
            }
            const taskId = await gopeed.createTask(task);
            modelfileTasksId.push(taskId);
          }

          // 3. download media files
          const mediaTaskIds: string[] = [];
          const mediaDir = getMediaDir(
            settings.basePath,
            model.type,
            model.id,
            modelVersionId,
          );
          for (let index = 0; index < modelVersion.images.length; index++) {
            const media = modelVersion.images[index];
            const filenameResult = extractFilenameFromUrl(media.url);
            if (filenameResult.isOk()) {
              const filename = filenameResult.value;
              const filePath = join(mediaDir, filename);

              // Skip if file already exists
              if (await Bun.file(filePath).exists()) {
                continue;
              }

              // Create media download task with Authorization header
              const task = await gopeed.createTask({
                req: {
                  url: media.url,
                  extra: {
                    header: {
                      Authorization: `Bearer ${settings.civitai_api_token}`,
                    },
                  },
                  labels: {
                    CivitAI: `Media`,
                  },
                },
                opts: {
                  name: filename,
                  path: mediaDir,
                },
              });
              mediaTaskIds.push(task);
            } else {
              // Log error but continue with other media files
              console.error(
                `Failed to extract filename from URL: ${media.url}`,
                filenameResult.error,
              );
            }
          }

          // 4. upsert model info to db
          // @ts-ignore 'video' and 'image' isn't assignable to string
          const records = await upsertOneModelVersion(model, modelVersion);

          // 5. return tasks info
          return {
            modelfileTasksId: modelfileTasksId,
            mediaTaskIds: mediaTaskIds,
          };
        },
        {
          body: type({ modelVersionId: "number", model: modelSchema }),
          response: t.Object({
            modelfileTasksId: t.Array(t.String()),
            mediaTaskIds: t.Array(t.String()),
          }),
        },
      )
      // GET /v1/model-versions/by-id/:id - Get model version by model ID
      .post(
        "/download/get-info/by-id",
        async ({ body }) => {
          const model = await client.models.getModel(body.id);
          if (model.isOk()) {
            return model.value;
          } else {
            handleCivitaiError(model.error);
          }
        },
        {
          body: type({ id: "number" }),
          response: modelSchema,
        },
      )
      // GET /v1/model-versions/by-version-id/:id - Get model version by model version ID
      .post(
        "/download/get-info/by-version-id",
        async ({ body }) => {
          const mv = await client.modelVersions.getById(body.id);
          if (mv.isErr()) {
            handleCivitaiError(mv.error);
          }
          const model = await client.models.getModel(mv.value.modelId);
          if (model.isErr()) {
            handleCivitaiError(model.error);
          }
          return model.value;
        },
        {
          body: type({ id: "number" }),
          response: modelSchema,
        },
      )
      // GET /v1/tags - List tags
      .get(
        "/tags",
        async ({ query }) => {
          const result = await client.tags.list(query);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          query: type({
            "limit?": "number",
            "page?": "number",
            "query?": "string",
          }),
          response: type({
            items: type({
              name: "string",
              modelCount: "number",
              link: "string",
            }).array(),
            metadata: type({
              totalItems: "number",
              currentPage: "number",
              pageSize: "number",
              totalPages: "number",
              "nextPage?": "string",
              "prevPage?": "string",
            }),
          }),
        },
      ),
  );
