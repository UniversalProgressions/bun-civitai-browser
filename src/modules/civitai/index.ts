import { type } from "arktype";
import { Elysia } from "elysia";
import {
  creatorsResponseSchema,
  creatorsRequestOptionsSchema,
} from "../../civitai-api/v1/models/creators";
import {
  modelSchema,
  modelsRequestOptionsSchema,
  modelsResponseSchema,
} from "../../civitai-api/v1/models/models";
import {
  modelByIdSchema,
} from "../../civitai-api/v1/models/model-id";
import {
  modelVersionEndpointDataSchema,
} from "../../civitai-api/v1/models/model-version";
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

export default new Elysia({ prefix: `/civitai_api` })
  .error({ CivitaiApiError, CivitaiValidationError })
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
