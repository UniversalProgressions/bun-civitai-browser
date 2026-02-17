import { prisma } from "../service";
import { modelVersionSchema, modelSchema } from "#civitai-api/v1/models";
import type { Model, ModelVersion, ModelTypes } from "#civitai-api/v1/models";
import { getSettings } from "../../settings/service";
import { findOrCreateOneBaseModel } from "./baseModel";
import { findOrCreateOneBaseModelType } from "./baseModelType";
import { findOrCreateOneModel } from "./model";
import { normalize, sep } from "node:path";
import { scanModelsStream } from "../../local-models/service/scan-models";
import {
  getModelIdApiInfoJsonPath,
  getModelVersionApiInfoJsonPath,
} from "../../local-models/service/file-layout";
import { type } from "arktype";
import { isEqual } from "es-toolkit";
import { extractIdFromImageUrl } from "#civitai-api/v1/utils";

export async function upsertOneModelVersion(
  model: Model,
  modelVersion: ModelVersion,
) {
  const baseModelRecord = await findOrCreateOneBaseModel(
    modelVersion.baseModel,
  );
  const baseModelTypeRecord = modelVersion.baseModelType
    ? await findOrCreateOneBaseModelType(
        modelVersion.baseModelType,
        baseModelRecord.id,
      )
    : undefined;
  const modelIdRecord = await findOrCreateOneModel(model);

  const record = await prisma.modelVersion.upsert({
    where: {
      id: modelVersion.id,
    },
    update: {
      name: modelVersion.name,
      baseModelId: baseModelRecord.id,
      baseModelTypeId: baseModelTypeRecord ? baseModelTypeRecord.id : undefined,
      nsfwLevel: modelVersion.nsfwLevel,
      json: modelVersion,
    },
    create: {
      id: modelVersion.id,
      modelId: modelIdRecord.id,
      name: modelVersion.name,
      baseModelId: baseModelRecord.id,
      baseModelTypeId: baseModelTypeRecord ? baseModelTypeRecord.id : undefined,
      nsfwLevel: modelVersion.nsfwLevel,
      images: {
        connectOrCreate: modelVersion.images.map((image) => {
          // Extract image ID from URL since ModelImage no longer has id field
          const idResult = extractIdFromImageUrl(image.url);
          if (idResult.isErr()) {
            throw new Error(
              `Failed to extract image ID from URL: ${image.url}, error: ${idResult.error.message}`,
            );
          }
          const id = idResult.value;

          return {
            where: { id },
            create: {
              id,
              url: image.url,
              nsfwLevel: image.nsfwLevel,
              width: image.width,
              height: image.height,
              hash: image.hash,
              type: image.type,
              gopeedTaskId: null,
              gopeedTaskFinished: false,
              gopeedTaskDeleted: false,
            },
          };
        }),
      },
      files: {
        connectOrCreate: modelVersion.files.map((file) => ({
          where: { id: file.id },
          create: {
            id: file.id,
            sizeKB: file.sizeKB,
            name: file.name,
            type: file.type,
            downloadUrl: file.downloadUrl,
            gopeedTaskId: null,
            gopeedTaskFinished: false,
            gopeedTaskDeleted: false,
          },
        })),
      },
      json: modelVersion,
    },
  });

  return record;
}

export async function deleteOneModelVersion(
  modelVersionId: number,
  modelId: number,
) {
  await prisma.modelVersion.delete({
    where: {
      id: modelVersionId,
    },
  });
  // Check if there is any modelVersion have same modelId
  const remainingModelVersions = await prisma.modelVersion.count({
    where: { modelId: modelId },
  });

  // delete modelId if it has no modelversion records in database
  if (remainingModelVersions === 0) {
    await prisma.model.delete({
      where: {
        id: modelId,
      },
    });
  }
}

type ModelInfo = {
  modelType: string;
  modelId: number;
  versionId: number;
  filePath: string;
  fileName: string;
};

export function extractModelInfo(filePath: string): ModelInfo | null {
  const normalizedPath = normalize(filePath);
  const parts = normalizedPath.split(sep);

  if (parts.length < 3) return null;

  const fileName = parts[parts.length - 1];
  if (!fileName.endsWith(".safetensors")) return null;

  return {
    modelType: parts[parts.length - 4],
    modelId: Number(parts[parts.length - 3]),
    versionId: Number(parts[parts.length - 2]),
    filePath: normalizedPath,
    fileName: fileName.replace(".safetensors", ""),
  };
}

/**
 * 从.safetensors文件路径中提取模型信息（支持批量处理）
 * @param filePaths 文件路径数组
 * @returns 包含模型信息的数组，无效路径会被过滤
 */
export function extractAllModelInfo(filePaths: string[]): ModelInfo[] {
  return filePaths
    .map((filePath) => {
      return extractModelInfo(filePath);
    })
    .filter((info): info is ModelInfo => info !== null);
}

export async function scanModelsAndSyncToDb() {
  const safetensorsPathsStream = scanModelsStream();
  for await (const entry of safetensorsPathsStream) {
    const modelInfo = extractModelInfo(entry as string);
    if (modelInfo === null) {
      continue;
    }
    const isExistsInDb = await prisma.modelVersion.findUnique({
      where: {
        id: modelInfo.versionId,
      },
    });
    if (isExistsInDb === null) {
      const modelVersionJson = Bun.file(
        getModelVersionApiInfoJsonPath(
          getSettings().basePath,
          modelInfo.modelType as ModelTypes,
          modelInfo.modelId,
          modelInfo.versionId,
        ),
      );
      if ((await modelVersionJson.exists()) === false) {
        console.log(
          `modelVersion ${modelInfo.versionId}'s json file doesn't exists, exclude from processing.`,
        );
        continue;
      }
      const modelVersionInfo = modelVersionSchema(
        await modelVersionJson.json(),
      );
      if (modelVersionInfo instanceof type.errors) {
        // hover out.summary to see validation errors
        console.error(modelVersionInfo.summary);
        throw modelVersionInfo;
      }
      const modelIdJson = Bun.file(
        getModelIdApiInfoJsonPath(
          getSettings().basePath,
          modelInfo.modelType as ModelTypes,
          modelInfo.modelId,
        ),
      );
      if ((await modelIdJson.exists()) === false) {
        console.log(
          `modelID ${modelInfo.modelId}'s json file doesn't exists, exclude from processing.`,
        );
        continue;
      }
      const modelIdInfo = modelSchema(await modelIdJson.json());
      if (modelIdInfo instanceof type.errors) {
        // hover out.summary to see validation errors
        console.error(modelIdInfo.summary);
        throw modelIdInfo;
      }
      await upsertOneModelVersion(modelIdInfo, modelVersionInfo);
    }
  }
}
