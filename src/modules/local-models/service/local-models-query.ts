import { type Result, ok, err } from "neverthrow";
import { prisma } from "../../db/service";
import type { Model, ModelVersion } from "#civitai-api/v1/models";
import { ModelLayout } from "./file-layout";
import { settingsService } from "../../settings/service";

export interface LocalModelWithUrls {
  model: Model;
  version: ModelVersion;
  mediaUrls: {
    thumbnail?: string; // 第一个图片的URL
    images: string[]; // 所有图片的URL
  };
  files: Array<{
    id: number;
    name: string;
    url: string;
    exists: boolean;
  }>;
}

export interface PaginatedLocalModels {
  items: LocalModelWithUrls[];
  metadata: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * 生成媒体文件的访问URL
 */
export function generateMediaUrl(
  modelId: number,
  versionId: number,
  modelType: string,
  filename: string,
): string {
  return `/local-models/media?modelId=${modelId}&versionId=${versionId}&modelType=${modelType}&filename=${encodeURIComponent(filename)}`;
}

/**
 * 从ModelImage对象提取文件名
 */
function extractImageFilename(image: any): string {
  // 假设URL格式为 https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/.../imageId.ext
  const url = image.url;
  const parts = url.split("/");
  return parts[parts.length - 1];
}

/**
 * 为模型版本生成所有相关URL
 */
export function generateUrlsForModelVersion(
  model: Model,
  version: ModelVersion,
  basePath?: string,
): LocalModelWithUrls["mediaUrls"] & { files: LocalModelWithUrls["files"] } {
  const effectiveBasePath = basePath || settingsService.getSettings().basePath;
  const modelLayout = new ModelLayout(effectiveBasePath, model);
  const mediaUrls: string[] = [];
  let thumbnailUrl: string | undefined;

  // 生成图片URL
  for (let i = 0; i < version.images.length; i++) {
    const image = version.images[i];
    const filename = extractImageFilename(image);
    const url = generateMediaUrl(model.id, version.id, model.type, filename);
    mediaUrls.push(url);

    // 第一个图片作为缩略图
    if (i === 0) {
      thumbnailUrl = url;
    }
  }

  // 生成文件URL
  const files = version.files.map((file) => {
    const url = generateMediaUrl(model.id, version.id, model.type, file.name);
    return {
      id: file.id,
      name: file.name,
      url,
      exists: false, // 将在查询时填充
    };
  });

  return {
    thumbnail: thumbnailUrl,
    images: mediaUrls,
    files,
  };
}

/**
 * 查询本地存在的模型版本
 */
export async function queryLocalModelVersions(
  page: number = 1,
  pageSize: number = 20,
): Promise<Result<PaginatedLocalModels, Error>> {
  try {
    // 计算偏移量
    const skip = (page - 1) * pageSize;

    // 查询存在本地文件的模型版本
    // 我们需要查找至少有一个文件或图片标记为已下载完成的模型版本
    const modelVersions = await prisma.modelVersion.findMany({
      where: {
        OR: [
          {
            files: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
          {
            images: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
        ],
      },
      include: {
        model: true,
        files: {
          where: {
            gopeedTaskFinished: true,
          },
        },
        images: {
          where: {
            gopeedTaskFinished: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      skip,
      take: pageSize,
    });

    // 获取总数用于分页
    const totalCount = await prisma.modelVersion.count({
      where: {
        OR: [
          {
            files: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
          {
            images: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
        ],
      },
    });

    // 转换数据并生成URL
    const items: LocalModelWithUrls[] = [];
    const basePath = settingsService.getSettings().basePath;

    for (const dbModelVersion of modelVersions) {
      try {
        const modelJson = dbModelVersion.model.json as Model;
        const versionJson = dbModelVersion.json as ModelVersion;

        // 确保modelJson包含当前版本
        if (!modelJson.modelVersions.some((mv) => mv.id === versionJson.id)) {
          modelJson.modelVersions.push(versionJson);
        }

        // 生成URL
        const urls = generateUrlsForModelVersion(
          modelJson,
          versionJson,
          basePath,
        );

        // 检查文件实际是否存在
        const modelLayout = new ModelLayout(basePath, modelJson);
        const existenceStatus =
          await modelLayout.checkVersionFilesAndImagesExistence(versionJson.id);

        // 更新文件存在状态
        const filesWithExistence = urls.files.map((file) => ({
          ...file,
          exists: existenceStatus.files.some(
            (f) => f.id === file.id && f.exists,
          ),
        }));

        items.push({
          model: modelJson,
          version: versionJson,
          mediaUrls: {
            thumbnail: urls.thumbnail,
            images: urls.images,
          },
          files: filesWithExistence,
        });
      } catch (error) {
        console.error(
          `Error processing model version ${dbModelVersion.id}:`,
          error,
        );
        // 跳过处理失败的项目
      }
    }

    const totalPages = Math.ceil(totalCount / pageSize);

    return ok({
      items,
      metadata: {
        totalItems: totalCount,
        currentPage: page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    return err(
      new Error(
        `Failed to query local model versions: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 查询特定模型的本地版本
 */
export async function queryLocalModelVersionsByModelId(
  modelId: number,
  page: number = 1,
  pageSize: number = 20,
): Promise<Result<PaginatedLocalModels, Error>> {
  try {
    // 计算偏移量
    const skip = (page - 1) * pageSize;

    // 查询特定模型的本地版本
    const modelVersions = await prisma.modelVersion.findMany({
      where: {
        modelId,
        OR: [
          {
            files: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
          {
            images: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
        ],
      },
      include: {
        model: true,
        files: {
          where: {
            gopeedTaskFinished: true,
          },
        },
        images: {
          where: {
            gopeedTaskFinished: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
      skip,
      take: pageSize,
    });

    // 获取总数用于分页
    const totalCount = await prisma.modelVersion.count({
      where: {
        modelId,
        OR: [
          {
            files: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
          {
            images: {
              some: {
                gopeedTaskFinished: true,
              },
            },
          },
        ],
      },
    });

    // 如果没有任何版本，尝试获取模型信息
    if (modelVersions.length === 0) {
      const model = await prisma.model.findUnique({
        where: { id: modelId },
      });

      if (!model) {
        return err(new Error(`Model with ID ${modelId} not found`));
      }

      const totalPages = Math.ceil(totalCount / pageSize);

      return ok({
        items: [],
        metadata: {
          totalItems: totalCount,
          currentPage: page,
          pageSize,
          totalPages,
        },
      });
    }

    // 转换数据并生成URL
    const items: LocalModelWithUrls[] = [];
    const basePath = settingsService.getSettings().basePath;

    for (const dbModelVersion of modelVersions) {
      try {
        const modelJson = dbModelVersion.model.json as Model;
        const versionJson = dbModelVersion.json as ModelVersion;

        // 确保modelJson包含当前版本
        if (!modelJson.modelVersions.some((mv) => mv.id === versionJson.id)) {
          modelJson.modelVersions.push(versionJson);
        }

        // 生成URL
        const urls = generateUrlsForModelVersion(
          modelJson,
          versionJson,
          basePath,
        );

        // 检查文件实际是否存在
        const modelLayout = new ModelLayout(basePath, modelJson);
        const existenceStatus =
          await modelLayout.checkVersionFilesAndImagesExistence(versionJson.id);

        // 更新文件存在状态
        const filesWithExistence = urls.files.map((file) => ({
          ...file,
          exists: existenceStatus.files.some(
            (f) => f.id === file.id && f.exists,
          ),
        }));

        items.push({
          model: modelJson,
          version: versionJson,
          mediaUrls: {
            thumbnail: urls.thumbnail,
            images: urls.images,
          },
          files: filesWithExistence,
        });
      } catch (error) {
        console.error(
          `Error processing model version ${dbModelVersion.id}:`,
          error,
        );
        // 跳过处理失败的项目
      }
    }

    const totalPages = Math.ceil(totalCount / pageSize);

    return ok({
      items,
      metadata: {
        totalItems: totalCount,
        currentPage: page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    return err(
      new Error(
        `Failed to query local model versions for model ${modelId}: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}
