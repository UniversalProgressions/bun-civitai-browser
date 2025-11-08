import ky, { KyResponse } from "ky";
import { ArkErrors, type } from "arktype";
import { Elysia } from "elysia";
import {
  models_request_opts,
  models_response,
  model,
  type Model,
  ModelsResponse
} from "../models/models_endpoint";
import { modelId_model, type ModelId_ModelId, modelId_model_version, type ModelId_ModelVersion } from "../models/modelId_endpoint";
import { getSettings } from "../../settings/service";
import { obj2UrlSearchParams } from "../service/utils";

export function getRequester() {
  const settingsInfo = getSettings();
  return ky.extend({
    // pass proxy info to Bun's fetch('xxx',{proxy:'http://...'}) by ignoring the ky's type error
    // @ts-ignore
    proxy: settingsInfo.httpProxy,
    headers: { Authorization: `Bearer ${settingsInfo.civitaiToken}` },
    timeout: 120000,
  });
}

export class ApiInvokeErrorResponse extends Error {
  constructor(
    public message: string,
    public resData: string,
    public arkSummary: string,
    public kyRes: KyResponse
  ) {
    super(message);
    this.name = "ApiInvokeErrorResponse";
    this.resData = resData;
    this.arkSummary = arkSummary;
    this.kyRes = kyRes;
  }
}

export class ApiCommunicationError extends Error {
  constructor(
    public message: string,
    public kyResponse: KyResponse
  ) {
    super(message);
    this.name = "ApiCommunicationError";
    this.kyResponse = kyResponse;
  }
}

async function apiResponseProcess<T>(arkValidator: (data: unknown) => T | ArkErrors, kyRes: KyResponse): Promise<T> {
  if (!kyRes.ok) {
    // network error handle
    // there are some situations that unknowable error happens
    throw new ApiCommunicationError(
      `civitai api error: ${kyRes.status} ${kyRes.statusText}`,
      kyRes
    );
  }
  const json = await kyRes.json();
  const data = arkValidator(json);
  if (data instanceof type.errors) {
    // parse error (caused by wrong request logic) handle
    throw new ApiInvokeErrorResponse(
      `civitai api invoke error.`,
      JSON.stringify(json),
      data.summary,
      kyRes
    );
  }
  return data;
}

const civitaiApiMirror = new Elysia({ prefix: "/api/v1" })
  .error({ ApiCommunicationError, ApiInvokeErrorResponse })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "ApiCommunicationError":
        return status(error.kyResponse.status, {
          code: error.kyResponse.status,
          message: error.kyResponse.text(),
        });
      case "ApiInvokeErrorResponse":
        return status(error.kyRes.status, {
          code: error.kyRes.status,
          message: error.message,
          resData: error.resData,
          arkSummary: error.arkSummary,
        });
    }
  })
  .post(
    "/models",
    async ({ body }) => {
      const requester = getRequester();
      const res = await requester.get("https://civitai.com/api/v1/models", {
        searchParams: obj2UrlSearchParams(body),
      });
      return await apiResponseProcess<ModelsResponse>(models_response, res);

    },
    {
      body: models_request_opts,
      response: models_response,
    }
  )
  .get(
    "/models/nextPage",
    async ({ query }) => {
      const requester = getRequester();
      const res = await requester.get(query.nextPage);
      return await apiResponseProcess<ModelsResponse>(models_response, res);
    },
    {
      query: type({ nextPage: "string" }),
      response: models_response,
    }
  )
  .get(`/models/:modelId`, async ({ params }) => {
    const requester = getRequester();
    const res = await requester.get(`https://civitai.com/api/v1/models/${params.modelId}}`)
    return await apiResponseProcess<ModelId_ModelId>(modelId_model, res);
  }, { response: modelId_model })
  .get(
    `model-versions/:modelVersionId`,
    async ({ params }) => {
      const requester = getRequester();
      const res = await requester.get(
        `https://civitai.com/api/v1/model-versions/${params.modelVersionId}`
      );
      return await apiResponseProcess<ModelId_ModelVersion>(modelId_model_version, res);
    },
    {
      response: modelId_model_version,
    }
  )
  .get(`/model-versions/by-hash/:hash`, async ({ params }) => {
    const requester = getRequester();
    const res = await requester.get(
      `https://civitai.com/api/v1/model-versions/by-hash/${params.hash}`
    );
    return await apiResponseProcess<ModelId_ModelVersion>(modelId_model_version, res);
  }, {
    response: modelId_model_version,
  });
export default civitaiApiMirror;
