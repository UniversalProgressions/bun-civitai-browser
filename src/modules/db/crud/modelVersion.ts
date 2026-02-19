import { prisma as defaultPrisma } from "../service";
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
import type { PrismaClient } from "../generated/client";

export async function upsertOneModelVersion(
  model: Model,
  modelVersion: ModelVersion,
  options?: {
    checkFileExistence?: boolean;
    basePath?: string;
  },
  prisma: PrismaClient = defaultPrisma,
) {
  const baseModelRecord = await findOrCreateOneBaseModel(
    modelVersion.baseModel,
    prisma,
  );
  const baseModelTypeRecord = modelVersion.baseModelType
    ? await findOrCreateOneBaseModelType(
        modelVersion.baseModelType,
        baseModelRecord.id,
        prisma,
      )
    : undefined;
  const modelIdRecord = await findOrCreateOneModel(model, prisma);

  const checkFileExistence = options?.checkFileExistence ?? false;
  const basePath = options?.basePath || getSettings().basePath;

  // IMPORTANT: Ensure the model object contains the modelVersion in its modelVersions array
  // This is needed for the ModelLayout class to find the version
  const modelWithVersion = {
    ...model,
    modelVersions: model.modelVersions || [],
  };

  // Add the version if not already present
  if (
    !modelWithVersion.modelVersions.some((mv: any) => mv.id === modelVersion.id)
  ) {
    modelWithVersion.modelVersions.push(modelVersion);
  }

  // Helper function to check if a file exists on disk
  const checkFileExists = async (
    fileId: number,
    fileName: string,
  ): Promise<boolean> => {
    if (!checkFileExistence) return false;

    const modelLayout = new (
      await import("../../local-models/service/file-layout")
    ).ModelLayout(basePath, modelWithVersion);
    const mvLayout = modelLayout.getModelVersionLayout(modelVersion.id);
    const filePath = mvLayout.getFilePath(fileId);
    return await Bun.file(filePath).exists();
  };

  // Helper function to check if an image exists on disk
  const checkImageExists = async (
    imageUrl: string,
    imageId: number,
  ): Promise<boolean> => {
    if (!checkFileExistence) return false;

    const modelLayout = new (
      await import("../../local-models/service/file-layout")
    ).ModelLayout(basePath, modelWithVersion);
    const mvLayout = modelLayout.getModelVersionLayout(modelVersion.id);
    const imagePath = mvLayout.getMediaPath(imageId);
    return await Bun.file(imagePath).exists();
  };

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
        connectOrCreate: await Promise.all(
          modelVersion.images.map(async (image) => {
            // Extract image ID from URL since ModelImage no longer has id field
            const idResult = extractIdFromImageUrl(image.url);
            if (idResult.isErr()) {
              throw new Error(
                `Failed to extract image ID from URL: ${image.url}, error: ${idResult.error.message}`,
              );
            }
            const id = idResult.value;

            // Check if image exists on disk if requested
            const fileExists = checkFileExistence
              ? await checkImageExists(image.url, id)
              : false;

            return {
              where: { id },
              create: {
                id,
                url: image.url,
                nsfwLevel: image.nsfwLevel,
                width: image.width,
                height: image.height,
                hash: image.hash,
                type: image.type as string, // Convert 'image' | 'video' literal to string
                gopeedTaskId: null,
                gopeedTaskFinished: fileExists, // Set to true if file exists on disk
                gopeedTaskDeleted: false,
              },
            };
          }),
        ),
      },
      files: {
        connectOrCreate: await Promise.all(
          modelVersion.files.map(async (file) => {
            // Check if file exists on disk if requested
            const fileExists = checkFileExistence
              ? await checkFileExists(file.id, file.name)
              : false;

            return {
              where: { id: file.id },
              create: {
                id: file.id,
                sizeKB: file.sizeKB,
                name: file.name,
                type: file.type,
                downloadUrl: file.downloadUrl,
                gopeedTaskId: null,
                gopeedTaskFinished: fileExists, // Set to true if file exists on disk
                gopeedTaskDeleted: false,
              },
            };
          }),
        ),
      },
      json: modelVersion,
    },
  });

  return record;
}

export async function deleteOneModelVersion(
  modelVersionId: number,
  modelId: number,
  prisma: PrismaClient = defaultPrisma,
): Promise<{
  deleted: boolean;
  modelDeleted: boolean;
  fileCount: number;
  imageCount: number;
}> {
  // First, get the model version details to know what we're deleting
  const modelVersion = await prisma.modelVersion.findUnique({
    where: { id: modelVersionId },
    include: {
      files: true,
      images: true,
    },
  });

  if (!modelVersion) {
    throw new Error(`Model version ${modelVersionId} not found`);
  }

  const fileCount = modelVersion.files.length;
  const imageCount = modelVersion.images.length;

  // Delete the model version (cascade will delete files and images)
  await prisma.modelVersion.delete({
    where: {
      id: modelVersionId,
    },
  });

  // Check if there are any remaining model versions for this model
  const remainingModelVersions = await prisma.modelVersion.count({
    where: { modelId: modelId },
  });

  let modelDeleted = false;
  // Delete model if it has no model version records in database
  if (remainingModelVersions === 0) {
    await prisma.model.delete({
      where: {
        id: modelId,
      },
    });
    modelDeleted = true;
  }

  return {
    deleted: true,
    modelDeleted,
    fileCount,
    imageCount,
  };
}

/**
 * Delete multiple model versions
 * @param versionIds Array of model version IDs to delete
 * @param prisma Prisma client instance
 * @returns Result of batch deletion
 */
export async function deleteMultipleModelVersions(
  versionIds: number[],
  prisma: PrismaClient = defaultPrisma,
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    versionId: number;
    success: boolean;
    error?: string;
    modelDeleted?: boolean;
    fileCount?: number;
    imageCount?: number;
  }>;
}> {
  const results = [];
  let succeeded = 0;
  let failed = 0;

  for (const versionId of versionIds) {
    try {
      // Get model version to find its modelId
      const modelVersion = await prisma.modelVersion.findUnique({
        where: { id: versionId },
        select: { modelId: true },
      });

      if (!modelVersion) {
        results.push({
          versionId,
          success: false,
          error: `Model version ${versionId} not found`,
        });
        failed++;
        continue;
      }

      // Use existing delete function
      const result = await deleteOneModelVersion(
        versionId,
        modelVersion.modelId,
        prisma,
      );

      results.push({
        versionId,
        success: true,
        modelDeleted: result.modelDeleted,
        fileCount: result.fileCount,
        imageCount: result.imageCount,
      });
      succeeded++;
    } catch (error) {
      results.push({
        versionId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      failed++;
    }
  }

  return {
    total: versionIds.length,
    succeeded,
    failed,
    results,
  };
}

type ModelInfo = {
  modelType: string;
  modelId: number;
  versionId: number;
  filePath: string;
  fileName: string;
  fileExtension: string;
  directoryStructure: "old" | "new"; // old: .../modelType/modelId/versionId/file.ext, new: .../modelType/modelId/versionId/files/file.ext
};

export function extractModelInfo(filePath: string): ModelInfo | null {
  const normalizedPath = normalize(filePath);
  const parts = normalizedPath.split(sep);

  // Minimum parts needed: .../modelType/modelId/versionId/file.ext (old) or .../modelType/modelId/versionId/files/file.ext (new)
  if (parts.length < 4) return null;

  const fileName = parts[parts.length - 1];

  // Check if file has a supported model extension
  const supportedExtensions = [
    ".safetensors",
    ".ckpt",
    ".pt",
    ".pth",
    ".bin",
    ".onnx",
    ".gguf",
  ];

  const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (!supportedExtensions.includes(fileExtension)) return null;

  // Check if we have the new directory structure with "files" folder
  const hasFilesFolder = parts[parts.length - 2] === "files";

  let modelType: string;
  let modelId: number;
  let versionId: number;

  if (hasFilesFolder) {
    // New structure: .../modelType/modelId/versionId/files/file.ext
    if (parts.length < 5) return null; // Need at least: .../modelType/modelId/versionId/files/file.ext

    modelType = parts[parts.length - 5];
    modelId = Number(parts[parts.length - 4]);
    versionId = Number(parts[parts.length - 3]);
  } else {
    // Old structure: .../modelType/modelId/versionId/file.ext
    modelType = parts[parts.length - 4];
    modelId = Number(parts[parts.length - 3]);
    versionId = Number(parts[parts.length - 2]);
  }

  // Validate numeric IDs
  if (Number.isNaN(modelId) || Number.isNaN(versionId)) return null;

  return {
    modelType,
    modelId,
    versionId,
    filePath: normalizedPath,
    fileName: fileName.replace(fileExtension, ""),
    fileExtension,
    directoryStructure: hasFilesFolder ? "new" : "old",
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

export async function scanModelsAndSyncToDb(
  prisma: PrismaClient = defaultPrisma,
) {
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
      await upsertOneModelVersion(
        modelIdInfo,
        modelVersionInfo,
        undefined,
        prisma,
      );
    }
  }
}

/**
 * Update Gopeed task ID for a specific model version file
 * @param fileId The ID of the model version file
 * @param taskId The Gopeed task ID to associate with the file
 */
export async function updateModelVersionFileTaskId(
  fileId: number,
  taskId: string,
  prisma: PrismaClient = defaultPrisma,
) {
  await prisma.modelVersionFile.update({
    where: { id: fileId },
    data: { gopeedTaskId: taskId },
  });
}

/**
 * Update Gopeed task ID for a specific model version image
 * @param imageId The ID of the model version image
 * @param taskId The Gopeed task ID to associate with the image
 */
export async function updateModelVersionImageTaskId(
  imageId: number,
  taskId: string,
  prisma: PrismaClient = defaultPrisma,
) {
  await prisma.modelVersionImage.update({
    where: { id: imageId },
    data: { gopeedTaskId: taskId },
  });
}

/**
 * Update Gopeed task status for all files and images of a model version based on disk existence
 * @param modelVersionId The ID of the model version
 * @param basePath Optional base path for file checking (defaults to settings)
 */
export async function updateGopeedTaskStatus(
  modelVersionId: number,
  basePath?: string,
  prisma: PrismaClient = defaultPrisma,
) {
  const settings = getSettings();
  const effectiveBasePath = basePath || settings.basePath;

  // Get model version with related model data
  const modelVersion = await prisma.modelVersion.findUnique({
    where: { id: modelVersionId },
    include: {
      model: true,
      files: true,
      images: true,
    },
  });

  if (!modelVersion) {
    throw new Error(`Model version ${modelVersionId} not found`);
  }

  // Get model type from model JSON
  const modelJson = modelVersion.model.json as any;
  const modelType = modelJson.type;
  const modelId = modelVersion.model.id;

  // Create ModelLayout instance for file checking
  const { ModelLayout } = await import(
    "../../local-models/service/file-layout"
  );
  const modelLayout = new ModelLayout(effectiveBasePath, modelJson);

  // Get existence status for all files and images
  const existenceStatus =
    await modelLayout.checkVersionFilesAndImagesExistence(modelVersionId);

  // Update files based on existence
  for (const fileStatus of existenceStatus.files) {
    const fileExists = fileStatus.exists;
    await prisma.modelVersionFile.update({
      where: { id: fileStatus.id },
      data: {
        gopeedTaskFinished: fileExists,
        gopeedTaskDeleted: false, // Always false unless we have logic for deleted files
      },
    });
    console.log(
      `[STATUS] File ${fileStatus.id}: exists=${fileExists}, gopeedTaskFinished=${fileExists}`,
    );
  }

  // Update images based on existence
  for (const imageStatus of existenceStatus.images) {
    const imageExists = imageStatus.exists;
    await prisma.modelVersionImage.update({
      where: { id: imageStatus.id },
      data: {
        gopeedTaskFinished: imageExists,
        gopeedTaskDeleted: false, // Always false unless we have logic for deleted files
      },
    });
    console.log(
      `[STATUS] Image ${imageStatus.id}: exists=${imageExists}, gopeedTaskFinished=${imageExists}`,
    );
  }

  return {
    updatedFiles: existenceStatus.files.length,
    updatedImages: existenceStatus.images.length,
    filesExist: existenceStatus.files.filter((f) => f.exists).length,
    imagesExist: existenceStatus.images.filter((i) => i.exists).length,
  };
}

/**
 * Update Gopeed task status for all model versions in the database
 * @param basePath Optional base path for file checking
 */
export async function updateAllGopeedTaskStatus(
  basePath?: string,
  prisma: PrismaClient = defaultPrisma,
) {
  const allModelVersions = await prisma.modelVersion.findMany({
    select: { id: true },
  });

  const results = [];
  let totalUpdatedFiles = 0;
  let totalUpdatedImages = 0;
  let totalFilesExist = 0;
  let totalImagesExist = 0;

  for (const mv of allModelVersions) {
    try {
      const result = await updateGopeedTaskStatus(mv.id, basePath, prisma);
      results.push({
        modelVersionId: mv.id,
        ...result,
      });

      totalUpdatedFiles += result.updatedFiles;
      totalUpdatedImages += result.updatedImages;
      totalFilesExist += result.filesExist;
      totalImagesExist += result.imagesExist;

      console.log(
        `[STATUS] Updated model version ${mv.id}: ${result.filesExist}/${result.updatedFiles} files exist, ${result.imagesExist}/${result.updatedImages} images exist`,
      );
    } catch (error) {
      console.error(`[STATUS] Failed to update model version ${mv.id}:`, error);
      results.push({
        modelVersionId: mv.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    totalModelVersions: allModelVersions.length,
    totalUpdatedFiles,
    totalUpdatedImages,
    totalFilesExist,
    totalImagesExist,
    details: results,
  };
}
