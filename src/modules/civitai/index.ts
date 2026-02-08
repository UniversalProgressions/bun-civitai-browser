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
import type {
  ModelsResponse,
  ModelById,
  CreatorsResponse,
  CreatorsRequestOptions,
  ModelVersionEndpointData,
  Model,
} from "../../civitai-api/v1/models";
import { modelId2Model } from "../../civitai-api/v1/utils";
import { createCivitaiClient } from "../../civitai-api/v1";
import type { CivitaiError } from "../../civitai-api/v1/client/errors";
import {
  isValidationError,
  isNetworkError,
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
  apiKey: process.env.CIVITAI_API_KEY, // Read API key from environment variable
  timeout: 30000, // Reduced to 30 seconds timeout to avoid long waits
  validateResponses: false, // Do not validate responses (recommended to enable in production)
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
  } else {
    // Handle other error types (BAD_REQUEST, UNAUTHORIZED, NOT_FOUND)
    throw new CivitaiApiError(
      error.message,
      "status" in error ? error.status : 500,
      error,
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
        return status("Internal Server Error", {
          code: error.status,
          message: error.message,
          details: error.details,
        });
      case "CivitaiValidationError":
        return status("Conflict", {
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
      // GET /v1/creators - List creators
      .get(
        "/creators",
        async ({ query }) => {
          const result = await client.creators.list(query);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          query: creatorsRequestOptionsSchema,
          response: creatorsResponseSchema,
        },
      )
      // GET /v1/models - List models
      .get(
        "/models",
        async ({ query }) => {
          const result = await client.models.list(query);
          if (result.isOk()) {
            return result.value;
          } else {
            handleCivitaiError(result.error);
          }
        },
        {
          query: modelsRequestOptionsSchema,
          response: modelsResponseSchema,
        },
      )
      // GET /v1/models/next-page - Get next page of models using nextPage URL
      .get(
        "/models/next-page",
        async ({ query }) => {
          const { nextPage } = query;
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
          query: type({ nextPage: "string" }),
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
            const result = await client.modelVersions.resolveFileDownloadUrl(
              file.downloadUrl,
              settings.civitai_api_token,
            );

            if (result.isOk()) {
              // Use resolved real download url to create gopeed download task
              modelFileDownloadTasks.push({
                req: { url: result.value },
                opts: {
                  name: mvlayout.getFileName(file.id),
                  path: mvlayout.getFileDirPath(),
                },
              });
            } else {
              // Handle errors from resolveFileDownloadUrl
              const error = result.error;
              if (error.type === "UNAUTHORIZED") {
                throw new CivitaiApiError(
                  `Unauthorized to access model file download url: ${file.downloadUrl},\nmay you have to purchase the model on civitai.`,
                  401,
                  error,
                );
              } else {
                throw new CivitaiApiError(
                  `Failed to resolve model file download url: ${file.downloadUrl},\nplease try again later.`,
                  "status" in error ? error.status : 500,
                  error,
                );
              }
            }
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
              if (
                await Bun.file(join(mediaDir, filenameResult.value)).exists()
              ) {
                continue;
              }
              mediaTaskIds.push(
                await gopeed.createTask({
                  req: { url: media.url },
                  opts: { path: mediaDir },
                }),
              );
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
