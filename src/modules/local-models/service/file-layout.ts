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
import { Effect, pipe } from "effect";

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

  findModelVersion(modelVersionId: number): ModelVersion {
    const modelVersion = find(
      this.model.modelVersions,
      (mv) => mv.id === modelVersionId,
    );
    if (modelVersion === undefined) {
      throw new Error(`model have no version id: ${modelVersionId}`);
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

  getModelVersionLayout(versionId: number) {
    const modelVersion = this.findModelVersion(versionId);
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
    const mv = this.getModelVersionLayout(versionId);
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
    const result = await Effect.runPromise(
      this.checkVersionFilesAndImagesExistenceEffect(versionId),
    );
    return result;
  }

  /**
   * Effect-style version of checkVersionFilesAndImagesExistence
   * Check if all files and images for a model version exist on disk
   * Returns an Effect that resolves to an object with existence status for each file and image
   */
  checkVersionFilesAndImagesExistenceEffect(versionId: number): Effect.Effect<
    {
      files: Array<{ id: number; exists: boolean }>;
      images: Array<{ id: number; exists: boolean }>;
    },
    never
  > {
    const self = this;
    return Effect.gen(function* () {
      const mv = self.getModelVersionLayout(versionId);

      // Helper function to safely check file existence
      const checkFileExists = (
        fileId: number,
        filePath: string,
      ): Effect.Effect<{ id: number; exists: boolean }, never> => {
        return pipe(
          Effect.tryPromise(async () => {
            return await Bun.file(filePath).exists();
          }),
          Effect.catchAll(() => Effect.succeed(false)),
          Effect.map((exists: boolean) => ({ id: fileId, exists })),
        );
      };

      // Check files in parallel
      const filesExistence: Array<{ id: number; exists: boolean }> =
        yield* Effect.all(
          mv.modelVersion.files.map((file: ModelFile) =>
            checkFileExists(file.id, mv.getFilePath(file.id)),
          ),
          { concurrency: "unbounded" },
        );

      // Helper function to safely check image existence
      const checkImageExists = (
        image: ModelImage,
      ): Effect.Effect<{ id: number; exists: boolean }, never> => {
        return pipe(
          Effect.sync(() => extractIdFromImageUrl(image.url)),
          Effect.flatMap((idResult) => {
            if (idResult.isOk()) {
              const imageId = idResult.value;
              return pipe(
                Effect.tryPromise(async () => {
                  const imagePath = mv.getMediaPath(imageId);
                  return await Bun.file(imagePath).exists();
                }),
                Effect.catchAll(() => Effect.succeed(false)),
                Effect.map((exists: boolean) => ({ id: imageId, exists })),
              );
            } else {
              // If can't extract ID, mark as not existing
              console.warn(`Could not extract ID from image URL: ${image.url}`);
              return Effect.succeed({ id: 0, exists: false });
            }
          }),
        );
      };

      // Check images in parallel
      const imagesExistence: Array<{ id: number; exists: boolean }> =
        yield* Effect.all(
          mv.modelVersion.images.map((image: ModelImage) =>
            checkImageExists(image),
          ),
          { concurrency: "unbounded" },
        );

      return { files: filesExistence, images: imagesExistence };
    });
  }
}

// Utility function to get base path from settings
export function getBasePath(): string {
  return settingsService.getSettings().basePath;
}
