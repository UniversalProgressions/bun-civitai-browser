import { KyResponse } from "ky";
import { ArkErrors, type } from "arktype";
import { Elysia, t } from "elysia";
import {
  model,
  models_request_opts,
  models_response,
  ModelsResponse
} from "../models/models_endpoint";
import { modelVersion_model_version, type ModelVersion_ModelVersion } from "../models/modelVersion_endpoint";
import { modelId_model, type ModelId_ModelId } from "../models/modelId_endpoint";
import { modelId2Model, obj2UrlSearchParams } from "../service/sharedUtils";
import { getRequester } from "../service/utils";
import { ModelLayout } from "../service/fileLayout";
import { getSettings } from "#modules/settings/service";
import { checkModelOnDisk } from "#modules/civitai/service/localModels";
export class DataValidationErrorResponse extends Error {
  constructor(
    public message: string,
    public resData: string,
    public arkSummary: string,
    public kyRes: KyResponse
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
    throw new DataValidationErrorResponse(
      `Failed to validate civitai responsed data.`,
      JSON.stringify(json),
      data.summary,
      kyRes
    );
  } else {
    return data;
  }
}

const civitaiApiMirror = new Elysia({ prefix: "/api/v1" })
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
  .post(`/modelById`, async ({ body }) => {
    const requester = getRequester();
    const res = await requester.get(`https://civitai.com/api/v1/models/${body.modelId}`)
    return await apiResponseProcess<ModelId_ModelId>(modelId_model, res);
  }, { body: type({ modelId: "number" }), response: modelId_model })
  .post(
    `/modelVersionById/`,
    async ({ body }) => {
      const requester = getRequester();
      const res = await requester.get(
        `https://civitai.com/api/v1/model-versions/${body.modelVersionId}`
      );
      return await apiResponseProcess<ModelVersion_ModelVersion>(modelVersion_model_version, res);
    },
    {
      body: type({ modelVersionId: "number" }),
      response: modelVersion_model_version,
    }
  )
  .get(`/modelVersionByHash/:hash`, async ({ params }) => {
    const requester = getRequester();
    const res = await requester.get(
      `https://civitai.com/api/v1/model-versions/by-hash/${params.hash}`
    );
    return await apiResponseProcess<ModelVersion_ModelVersion>(modelVersion_model_version, res);
  }, {
    response: modelVersion_model_version,
  })
  .post(`/loadModelInfoById`,
    async ({ body }) => {
      const requester = getRequester();
      const res = await requester.get(`https://civitai.com/api/v1/models/${body.modelId}`)
      const mi = await apiResponseProcess<ModelId_ModelId>(modelId_model, res);
      const modelData = modelId2Model(mi);
      const existedModelversions = await checkModelOnDisk(modelData);
      return {
        model: modelData,
        existedModelversions: existedModelversions
      };
    },
    {
      body: type({ modelId: "number" }),
      response: type({ model: model, existedModelversions: type({ "versionId": "number", "filesOnDisk": type("number[]") }).array() })
    }
  )
  .post(`/loadModelInfoByVersionId`, async ({ body }) => {
    const requester = getRequester();
    const mvRes = await requester.get(
      `https://civitai.com/api/v1/model-versions/${body.modelVersionId}`
    );
    const mv = await apiResponseProcess<ModelVersion_ModelVersion>(modelVersion_model_version, mvRes);
    const miRes = await requester.get(`https://civitai.com/api/v1/models/${mv.modelId}`)
    const mi = await apiResponseProcess<ModelId_ModelId>(modelId_model, miRes);
    const modelData = modelId2Model(mi);
    const existedModelversions = await checkModelOnDisk(modelData);
    return {
      model: modelData,
      existedModelversions: existedModelversions
    };
  }, {
    body: type({ modelVersionId: "number" }),
    response: type({ model: model, existedModelversions: type({ "versionId": "number", "filesOnDisk": type("number[]") }).array() })
  });
export default civitaiApiMirror;
