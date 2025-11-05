import ky, { KyResponse } from "ky";
import { type } from "arktype";
import { Elysia } from "elysia";
import {
  models_request_opts,
  models_response,
} from "../models/models_endpoint";
import { getSettings } from "../../settings/service";
import { obj2UrlSearchParams } from "../service/utils";
import localModelRouter from "./local";
import dbRouter from "./db";

export function getRequester() {
  const settingsInfo = getSettings();
  return ky.extend({
    // pass proxy info to Bun's fetch('xxx',{proxy:'http://...'}) by ignoring the ky's type error
    // @ts-ignore
    proxy: settingsInfo.httpProxy,
    headers: { Authorization: `Bearer ${settingsInfo.civitaiToken}` },
    timeout: 18000,
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

async function modelsResProcess(kyRes: KyResponse) {
  if (!kyRes.ok) {
    // network error handle
    // there are some situations that unknowable error happens
    throw new ApiCommunicationError(
      `civitai api error: ${kyRes.status} ${kyRes.statusText}`,
      kyRes
    );
  }
  const json = await kyRes.json();
  const data = models_response(json);
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
  .get(
    "/models",
    async ({ query }) => {
      const requester = getRequester();
      const res = await requester.get("https://civitai.com/api/v1/models", {
        searchParams: obj2UrlSearchParams(query),
      });
      const result = await modelsResProcess(res);
      return result;
    },
    {
      query: models_request_opts,
      response: models_response,
    }
  )
  .get(
    "/models/nextPage",
    async ({ query }) => {
      const requester = getRequester();
      const res = await requester.get(query.nextPage);
      const result = await modelsResProcess(res);
      return result;
    },
    {
      query: type({ nextPage: "string" }),
      response: models_response,
    }
  );

export default new Elysia({ prefix: "/civitai" })
  .use(localModelRouter)
  .use(civitaiApiMirror)
  .use(dbRouter);
