import { KyResponse } from "ky";
import { ArkErrors, type } from "arktype";
import { Elysia } from "elysia";
import {
  modelSchema,
  modelsRequestOptionsSchema,
  modelsResponseSchema,
  modelVersionSchema,
  modelByIdSchema,
} from "../../civitai-api/v1/models";
import type { ModelsResponse, ModelById } from "../../civitai-api/v1/models";
import { modelId2Model, obj2UrlSearchParams } from "../../civitai-api/v1/utils";
import { createCivitaiClient } from "../../civitai-api/v1";
import { checkModelOnDisk } from "#modules/civitai-deprecated/service/localModels.js";

export const client = createCivitaiClient({
  apiKey: process.env.CIVITAI_API_KEY, // Read API key from environment variable
  timeout: 30000, // Reduced to 30 seconds timeout to avoid long waits
  validateResponses: false, // Do not validate responses (recommended to enable in production)
});

export class DataValidationErrorResponse extends Error {
  constructor(
    public message: string,
    public resData: string,
    public arkSummary: string,
    public kyRes: KyResponse,
  ) {
    super(message);
    this.name = "DataValidationErrorResponse";
    this.resData = resData;
    this.arkSummary = arkSummary;
    this.kyRes = kyRes;
  }
}

export class ApiCommunicationError extends Error {
  constructor(
    public message: string,
    public kyResponse: KyResponse,
  ) {
    super(message);
    this.name = "ApiCommunicationError";
    this.kyResponse = kyResponse;
  }
}

export default new Elysia({ prefix: `/civitai_api` })
  .error({ ApiCommunicationError, DataValidationErrorResponse })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "ApiCommunicationError":
        return status("Internal Server Error", {
          code: error.kyResponse.status,
          message: error.kyResponse.text(),
        });
      case "DataValidationErrorResponse":
        return status("Conflict", {
          code: error.kyRes.status,
          message: error.message,
          resData: error.resData,
          arkSummary: error.arkSummary,
        });
    }
  })
  .use(new Elysia({ prefix: "/v1" }));
