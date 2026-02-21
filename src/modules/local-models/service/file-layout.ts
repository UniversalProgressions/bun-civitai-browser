import { normalize, join } from "node:path";
import isValidFilename from "valid-filename";
import filenamify from "filenamify";
import { find } from "es-toolkit/compat";
import type {
  Model,
  ModelVersion,
} from "../../../civitai-api/v1/models/models";
import type {
  ModelFile,
  ModelImage,
} from "../../../civitai-api/v1/models/shared-types";
import { settingsService } from "../../settings/service";
import {
  extractFilenameFromUrl,
  extractIdFromImageUrl,
} from "../../../civitai-api/v1/utils";

/**
 * The layout of directory:
 * {baseDir} / {modelType} / {modelId} / {modelId}.api-info.json
 * {baseDir} / {modelType} / {modelId} / {versionId} / "files" / {fileName}.xxx
 * {baseDir} / {modelType} / {modelId} / {versionId} / {versionId}.api-info.json
 * {baseDir} / {modelType} / {modelId} / {versionId} / "media" / {imageId}.xxx
 */

export function getModelIdPath(
  basePath: string,
  modelType: string,
  modelId: number,
) {
  return join(normalize(basePath), modelType, modelId.toString());
}

export function getApiInfoJsonFileName(id: number): string {
  return `${id}.api-info.json`;
}

export function getModelIdApiInfoJsonPath(
  basePath: string,
  modelType: string,
  modelId: number,
): string {
  return join(
    getModelIdPath(basePath, modelType, modelId),
    getApiInfoJsonFileName(modelId),
  );
}

export function getModelVersionPath(
  basePath: string,
  modelType: string,
  modelId: number,
  versionId: number,
) {
  return join(
    getModelIdPath(basePath, modelType, modelId),
    versionId.toString(),
  );
}

export function getModelVersionApiInfoJsonPath(
  basePath: string,
  modelType: string,
  modelId: number,
  modelVersionId: number,
) {
  return join(
    getModelVersionPath(basePath, modelType, modelId, modelVersionId),
    getApiInfoJsonFileName(modelVersionId),
  );
}

export function getMediaDir(
  basePath: string,
  modelType: string,
  modelId: number,
  versionId: number,
) {
  return join(
    getModelVersionPath(basePath, modelType, modelId, versionId),
    "media",
  );
}

export function getFilesDir(
  basePath: string,
  modelType: string,
  modelId: number,
  versionId: number,
) {
  return join(
    getModelVersionPath(basePath, modelType, modelId, versionId),
    "files",
  );
}

export class ModelVersionLayout {
  constructor(
    public modelVersionPath: string,
    public modelVersion: ModelVersion,
    public filesDir: string,
    public mediaDir: string,
  ) {
    this.modelVersionPath = normalize(modelVersionPath);
    this.modelVersion = modelVersion;
    this.filesDir = filesDir;
    this.mediaDir = mediaDir;
  }

  getApiInfoJsonFileDirPath(): string {
    return this.modelVersionPath;
  }

  getApiInfoJsonFileName(): string {
    return getApiInfoJsonFileName(this.modelVersion.id);
  }

  getApiInfoJsonPath(): string {
    return join(
      this.getApiInfoJsonFileDirPath(),
      this.getApiInfoJsonFileName(),
    );
  }

  findFile(fileId: number): ModelFile {
    const file = find(this.modelVersion.files, (file) => file.id === fileId);
    if (file === undefined) {
      throw new Error(`model have no file id: ${fileId}`);
    }
    return file;
  }

  getFileName(fileId: number): string {
    const modelFile = this.findFile(fileId);
    if (isValidFilename(modelFile.name)) {
      return modelFile.name;
    }
    return filenamify(modelFile.name, { replacement: "_" });
  }

  getFileDirPath(): string {
    return this.filesDir;
  }

  getFilePath(fileId: number): string {
    const modelFile = this.findFile(fileId);
    return join(this.getFileDirPath(), this.getFileName(fileId));
  }

  findMedia(mediaId: number): ModelImage {
    const img = find(this.modelVersion.images, (img) => {
      // Handle cases where id might be null by extracting from URL
      // Note: ModelImage no longer has id field, extract from URL
      const idResult = extractIdFromImageUrl(img.url);
      if (idResult.isOk()) {
        return idResult.value === mediaId;
      }
      return false;
    });
    if (img === undefined) {
      throw new Error(`model have no media with id: ${mediaId}`);
    }
    return img;
  }

  getMediaFileName(mediaId: number): string {
    const media = this.findMedia(mediaId);
    return extractFilenameFromUrl(media.url).unwrapOr(`${mediaId}.jpg`);
  }

  getMediaFileDirPath(): string {
    return this.mediaDir;
  }

  getMediaPath(mediaId: number): string {
    return join(this.getMediaFileDirPath(), this.getMediaFileName(mediaId));
  }
}

export class ModelLayout {
  basePath: string;
  modelIdPath: string;

  constructor(
    basePath: string,
    public model: Model,
  ) {
    this.basePath = basePath;
    this.modelIdPath = getModelIdPath(basePath, this.model.type, this.model.id);
  }

  async findModelVersion(modelVersionId: number): Promise<ModelVersion> {
    const modelVersion = find(
      this.model.modelVersions,
      (mv) => mv.id === modelVersionId,
    );

    if (modelVersion === undefined) {
      // 对于本地存储，model JSON中的modelVersions可能是空数组
      // 尝试从本地文件系统读取version JSON
      try {
        const versionJsonPath = getModelVersionApiInfoJsonPath(
          this.basePath,
          this.model.type,
          this.model.id,
          modelVersionId,
        );

        // 检查文件是否存在
        const fileExists = await Bun.file(versionJsonPath).exists();
        if (!fileExists) {
          throw new Error(
            `model have no version id: ${modelVersionId} and version JSON not found on disk`,
          );
        }

        // 读取并解析version JSON
        const content = await Bun.file(versionJsonPath).json();
        const { modelVersionSchema } = await import("#civitai-api/v1/models");
        const { type } = await import("arktype");

        const validation = modelVersionSchema(content);
        if (validation instanceof type.errors) {
          throw new Error(`Invalid version JSON: ${validation.summary}`);
        }

        // 添加到model的versions数组中，避免重复读取
        this.model.modelVersions.push(validation);
        return validation;
      } catch (error) {
        throw new Error(
          `model have no version id: ${modelVersionId} and cannot read from disk: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return modelVersion;
  }

  getApiInfoJsonFileDir(): string {
    return this.modelIdPath;
  }

  getApiInfoJsonFileName(): string {
    return getApiInfoJsonFileName(this.model.id);
  }

  getApiInfoJsonPath(): string {
    return getModelIdApiInfoJsonPath(
      this.basePath,
      this.model.type,
      this.model.id,
    );
  }

  async getModelVersionLayout(versionId: number) {
    const modelVersion = await this.findModelVersion(versionId);
    return new ModelVersionLayout(
      getModelVersionPath(
        this.basePath,
        this.model.type,
        this.model.id,
        versionId,
      ),
      modelVersion,
      getFilesDir(this.basePath, this.model.type, this.model.id, versionId),
      getMediaDir(this.basePath, this.model.type, this.model.id, versionId),
    );
  }

  async checkVersionFilesOnDisk(versionId: number): Promise<Array<number>> {
    const mv = await this.getModelVersionLayout(versionId);
    const existedFiles: Array<number> = [];
    for (let index = 0; index < mv.modelVersion.files.length; index++) {
      const file = mv.modelVersion.files[index];
      const element = Bun.file(mv.getFilePath(file.id));
      if (await element.exists()) {
        existedFiles.push(file.id);
      }
    }
    return existedFiles;
  }

  /**
   * Check if all files and images for a model version exist on disk
   * Returns an object with existence status for each file and image
   */
  async checkVersionFilesAndImagesExistence(versionId: number): Promise<{
    files: Array<{ id: number; exists: boolean }>;
    images: Array<{ id: number; exists: boolean }>;
  }> {
    const mv = await this.getModelVersionLayout(versionId);

    // Helper function to safely check file existence
    const checkFileExists = async (
      fileId: number,
      filePath: string,
    ): Promise<{ id: number; exists: boolean }> => {
      try {
        const exists = await Bun.file(filePath).exists();
        return { id: fileId, exists };
      } catch {
        return { id: fileId, exists: false };
      }
    };

    // Helper function to safely check image existence
    const checkImageExists = async (
      image: ModelImage,
    ): Promise<{ id: number; exists: boolean }> => {
      const idResult = extractIdFromImageUrl(image.url);
      if (idResult.isOk()) {
        const imageId = idResult.value;
        try {
          const imagePath = mv.getMediaPath(imageId);
          const exists = await Bun.file(imagePath).exists();
          return { id: imageId, exists };
        } catch {
          return { id: imageId, exists: false };
        }
      } else {
        // If can't extract ID, mark as not existing
        console.warn(`Could not extract ID from image URL: ${image.url}`);
        return { id: 0, exists: false };
      }
    };

    // Check files in parallel
    const filesExistence = await Promise.all(
      mv.modelVersion.files.map((file: ModelFile) =>
        checkFileExists(file.id, mv.getFilePath(file.id)),
      ),
    );

    // Check images in parallel
    const imagesExistence = await Promise.all(
      mv.modelVersion.images.map((image: ModelImage) =>
        checkImageExists(image),
      ),
    );

    return { files: filesExistence, images: imagesExistence };
  }
}

// Utility function to get base path from settings
export function getBasePath(): string {
  return settingsService.getSettings().basePath;
}
