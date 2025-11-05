import Elysia, { file, t } from "elysia";
import { type } from "arktype";
import { join } from "node:path";
import { getSettings } from "../../settings/service";
import { getMediaDir } from "../service/fileLayout";
import { scanModelsAndSyncToDb } from "../service/crud/modelVersion";
import {
  cursorPaginationQuery,
  cursorPaginationNext,
  simplePagination,
} from "../service/crud/modelId";
import {
  models_request_opts,
  model,
  type Model,
  model_version,
  type ModelVersion,
} from "../models/models_endpoint";
import { type ModelTypes, model_types } from "../models/baseModels/misc";
import { Model as TypeBox_Model } from "../../../../generated/typebox/barrel";
import {
  getModelIdApiInfoJsonPath,
  getModelVersionApiInfoJsonPath,
  getMediaFilePathByFileName,
} from "../service/fileLayout";

export class PreviewNotFound extends Error {
  constructor(public message: string) {
    super(message);
  }
}

export class NoPreview extends Error {
  constructor(public message: string) {
    super(message);
  }
}

const mediaController = new Elysia({ prefix: "/media" })
  .error({ PreviewNotFound, NoPreview })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "PreviewNotFound":
        return status(404, error);
      case "NoPreview":
        return status(404, error);
    }
  })
  .get("/:filename", ({ params: { filename } }) =>
    file(join(getMediaDir(getSettings().basePath), filename))
  )
  .get(
    "/preview",
    async ({ query: { previewFile } }) => {
      try {
        const officialPreview = getMediaFilePathByFileName(previewFile);
        return file(officialPreview);
      } catch (error) {
        throw new NoPreview("Have no preview for this.");
      }
    },
    {
      query: type({ previewFile: "string" }),
    }
  );

export class ModelJSONFileNotExists extends Error {
  constructor(
    public message: string,
    public jsonFilePath: string
  ) {
    super(message);
    this.jsonFilePath = jsonFilePath;
  }
}

export class ModelJSONContentValidationError extends Error {
  constructor(
    public message: string,
    public jsonFilePath: string,
    public jsonContent: string,
    public arkSummary: string
  ) {
    super(message);
    this.jsonFilePath = jsonFilePath;
    this.jsonContent = jsonContent;
    this.arkSummary = arkSummary;
  }
}

export class ModelJSONParseError extends Error {
  constructor(
    public message: string,
    public jsonFilePath: string,
    public jsonContent: string
  ) {
    super(message);
    this.jsonFilePath = jsonFilePath;
    this.jsonContent = jsonContent;
  }
}

async function parseModelJson(
  basePath: string,
  modelType: ModelTypes,
  modelId: number
): Promise<Model> {
  const modelJsonPath = getModelIdApiInfoJsonPath(basePath, modelType, modelId);
  const modelJsonFile = Bun.file(modelJsonPath);
  if ((await modelJsonFile.exists()) === false) {
    // model json file do not exists error
    const message = `model id: ${modelId}\nmodel json file path: ${modelJsonPath}\nCan't find the correspoding model json file.\n`;
    console.warn(message);
    throw new ModelJSONFileNotExists(message, modelJsonPath);
  }
  try {
    const rawData = await modelJsonFile.json();
    const data = model(rawData);
    if (data instanceof type.errors) {
      // model json content validation error
      const message = `model id: ${modelId}\nmodel json file path: ${modelJsonPath}\nJSON content validation Error!\n${data.summary}\n`;
      console.warn(message);
      throw new ModelJSONContentValidationError(
        message,
        modelJsonPath,
        rawData,
        data.summary
      );
    } else {
      return data;
    }
  } catch (error) {
    // model json parse error
    const message = `model id: ${modelId}\nmodel json file path: ${modelJsonPath}\nThe json structure of this model is invalid!\n`;
    console.warn(message);
    throw new ModelJSONParseError(
      message,
      modelJsonPath,
      await modelJsonFile.text()
    );
  }
}

async function parseModelVersionJson(
  basePath: string,
  modelType: ModelTypes,
  modelId: number,
  modelVersionId: number
): Promise<ModelVersion> {
  const modelVersionJsonPath = getModelVersionApiInfoJsonPath(
    basePath,
    modelType,
    modelId,
    modelVersionId
  );
  const modelVersionJsonFile = Bun.file(modelVersionJsonPath);
  if ((await modelVersionJsonFile.exists()) === false) {
    // model json file do not exists error
    const message = `model version id: ${modelVersionId}\njson file path: ${modelVersionJsonPath}\nCan't find the correspoding model json file.\n`;
    console.warn(message);
    throw new ModelJSONFileNotExists(message, modelVersionJsonPath);
  }
  try {
    const rawData = await modelVersionJsonFile.json();
    const data = model_version(rawData);
    if (data instanceof type.errors) {
      // model json content validation error
      const message = `model version id: ${modelId}\json file path: ${modelVersionJsonPath}\nJSON content validation Error!\n${data.summary}\n`;
      console.warn(message);
      throw new ModelJSONContentValidationError(
        message,
        modelVersionJsonPath,
        rawData,
        data.summary
      );
    } else {
      return data;
    }
  } catch (error) {
    // model json parse error
    const message = `model version id: ${modelId}\nmodel json file path: ${modelVersionJsonPath}\nThe json structure of this model is invalid!\n`;
    console.warn(message);
    throw new ModelJSONParseError(
      message,
      modelVersionJsonPath,
      await modelVersionJsonFile.text()
    );
  }
}

const localModelsApi = new Elysia({ prefix: `/models` })
  .get(
    "/",
    async ({ query }) => {
      const res = await cursorPaginationQuery(query);
      return {
        ...res,
      };
    },
    {
      query: models_request_opts,
      response: t.Object({
        totalCount: t.Number(),
        records: t.Array(TypeBox_Model),
      }),
    }
  )
  .get(
    "/nextPage",
    async ({ query }) => {
      const res = await cursorPaginationNext(query, query.modelIdAsCursor);

      return {
        records: res,
      };
    },
    {
      query: models_request_opts.and({ modelIdAsCursor: "number" }),
      response: t.Object({
        records: t.Array(TypeBox_Model),
      }),
    }
  )
  .post(
    "/pagination",
    async ({ body }) => {
      const res = await simplePagination(body);

      return {
        ...res,
      };
    },
    {
      body: models_request_opts,
      response: t.Object({
        totalCount: t.Number(),
        records: t.Array(TypeBox_Model),
      }),
    }
  )
  .post(
    "/modelId",
    async ({ body }) => {
      const settings = getSettings();
      const modelVersions: Array<ModelVersion> = [];
      const modelJson = await parseModelJson(
        settings.basePath,
        body.type,
        body.modelId
      );
      for await (const element of body.modelVersionIdNumbers) {
        modelVersions.push(
          await parseModelVersionJson(
            settings.basePath,
            body.type,
            body.modelId,
            element
          )
        );
      }
      modelJson.modelVersions = modelVersions;
      return modelJson;
    },
    {
      body: type({
        modelId: "number.integer",
        type: model_types,
        modelVersionIdNumbers: type("number.integer").array(),
      }),
      response: model,
    }
  );

export default new Elysia({ prefix: `/local` })
  .error({
    ModelJSONFileNotExists,
    ModelJSONContentValidationError,
    ModelJSONParseError,
  })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "ModelJSONFileNotExists":
        return status(404, error);
      case "ModelJSONContentValidationError":
        return status(500, error);
      case "ModelJSONParseError":
        return status(500, error);
    }
  })
  .use(mediaController)
  .use(localModelsApi)
  .head("/scanModels", async () => {
    await scanModelsAndSyncToDb();
    return true;
  });
