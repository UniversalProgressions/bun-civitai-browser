import { prisma } from "../../../db/service";
import { model, model_version, type Model, type ModelVersion } from "../../models/models_endpoint";
import { getSettings } from "../../../settings/service";
import { findOrCreateOneBaseModel } from "./baseModel";
import { findOrCreateOneBaseModelType } from "./baseModelType";
import { findOrCreateOneModelId } from "./modelId";
import { normalize, sep, dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import { scanModels } from "../localModels";
import {
  getModelIdApiInfoJsonPath,
  getModelVersionApiInfoJsonPath,
} from "../fileLayout";
import type { ModelTypes } from "../../models/baseModels/misc";
import { type } from "arktype";
import { pathExists } from "path-exists";
import { PathScurry } from "path-scurry";

export async function upsertOneModelVersion(
  modelId: Model,
  modelVersion: ModelVersion
) {
  const baseModelRecord = await findOrCreateOneBaseModel(
    modelVersion.baseModel
  );
  const baseModelTypeRecord = modelVersion.baseModelType
    ? await findOrCreateOneBaseModelType(
      modelVersion.baseModelType,
      baseModelRecord.id
    )
    : undefined;
  const modelIdRecord = await findOrCreateOneModelId(modelId);

  const record = await prisma.modelVersion.upsert({
    where: {
      id: modelVersion.id,
    },
    update: {
      name: modelVersion.name,
      baseModelId: baseModelRecord.id,
      baseModelTypeId: baseModelTypeRecord ? baseModelTypeRecord.id : undefined,
      publishedAt: modelVersion.publishedAt ?? undefined,
      nsfwLevel: modelVersion.nsfwLevel,
    },
    create: {
      id: modelVersion.id,
      modelId: modelIdRecord.id,
      name: modelVersion.name,
      baseModelId: baseModelRecord.id,
      baseModelTypeId: baseModelTypeRecord ? baseModelTypeRecord.id : undefined,
      publishedAt: modelVersion.publishedAt ?? undefined,
      nsfwLevel: modelVersion.nsfwLevel,
      images: {
        connectOrCreate: modelVersion.images.map((image) => ({
          where: { id: image.id },
          create: {
            id: image.id,
            url: image.url,
            nsfwLevel: image.nsfwLevel,
            width: image.width,
            height: image.height,
            hash: image.hash,
            type: image.type,
          },
        })),
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
          },
        })),
      },
    },
  });

  return record;
}

export async function deleteOneModelVersion(
  modelVersionId: number,
  modelId: number
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

/**
 * 从.safetensors文件路径中提取模型信息（支持批量处理）
 * @param filePaths 文件路径数组
 * @returns 包含模型信息的数组，无效路径会被过滤
 */
export function extractAllModelInfo(filePaths: string[]): ModelInfo[] {
  return filePaths
    .map((filePath) => {
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
    })
    .filter((info): info is ModelInfo => info !== null);
}

export async function scanModelsAndSyncToDb() {
  const safetensorsPaths = await scanModels();
  const safetensors = extractAllModelInfo(safetensorsPaths);
  for (let index = 0; index < safetensors.length; index++) {
    const modelInfo = safetensors[index];
    const isExistsInDb = await prisma.modelVersion.findUnique({
      where: {
        id: modelInfo.versionId,
      },
    });
    if (isExistsInDb === null) {
      const modelVersionJson = Bun.file(getModelVersionApiInfoJsonPath(
        getSettings().basePath,
        modelInfo.modelType as ModelTypes,
        modelInfo.modelId,
        modelInfo.versionId
      ));
      if ((await modelVersionJson.exists()) === false) {
        console.log(
          `modelVersion ${modelInfo.versionId}'s json file doesn't exists, exclude from processing.`
        );
        continue;
      }
      const modelVersionInfo = model_version(await modelVersionJson.json());
      if (modelVersionInfo instanceof type.errors) {
        // hover out.summary to see validation errors
        console.error(modelVersionInfo.summary)
        throw modelVersionInfo;
      }
      const modelIdJson = Bun.file(getModelIdApiInfoJsonPath(
        getSettings().basePath,
        modelInfo.modelType as ModelTypes,
        modelInfo.modelId
      ));
      if ((await modelIdJson.exists()) === false) {
        console.log(
          `modelID ${modelInfo.modelId}'s json file doesn't exists, exclude from processing.`
        );
        continue;
      }
      const modelIdInfo = model(await modelIdJson.json());
      if (modelIdInfo instanceof type.errors) {
        // hover out.summary to see validation errors
        console.error(modelIdInfo.summary)
        throw modelIdInfo;
      }
      await upsertOneModelVersion(modelIdInfo, modelVersionInfo);
    }
  }
}
