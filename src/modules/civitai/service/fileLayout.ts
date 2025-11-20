import { normalize, join } from "node:path";
import sanitize from "sanitize-basename";
import { find } from "es-toolkit/compat";
import type {
  Model,
  ModelVersion,
  ModelVersionFile,
  ModelVersionImage,
} from "../models/models_endpoint";
import { ModelTypes } from "../models/baseModels/misc";
import { findModelVersion } from "./sharedUtils";
import { getSettings } from "../../settings/service";
import { extractFilenameFromUrl } from "./sharedUtils";
// import { pathExists } from "path-exists"; // use Bun.file() to locate file and use the returned object's exists() function to ensure if it exists.

/**
 * The layout of directory:
 * {baseDir} / {modelType} / {modelId} / {modelId}.api-info.json
 * {baseDir} / {modelType} / {modelId} / {modelFileName}.preview.xxx
 * {baseDir} / {modelType} / {modelId} / {versionId} / {fileId}_{fileName}
 * {baseDir} / {modelType} / {modelId} / {versionId} / {versionId}.api-info.json
 * {baseDir} / "media" / {imageId}.xxx
 */


export function getModelIdPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number
) {
  return join(normalize(basePath), modelType, modelId.toString());
}

export function getApiInfoJsonFileName(id: number): string {
  return `${id}.api-info.json`;
}

export function getModelIdApiInfoJsonPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number
): string {
  return join(
    getModelIdPath(basePath, modelType, modelId),
    getApiInfoJsonFileName(modelId)
  );
}

export function getModelVersionPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number,
  versionId: number
) {
  return join(
    getModelIdPath(basePath, modelType, modelId),
    versionId.toString()
  );
}

export function getModelVersionApiInfoJsonPath(
  basePath: string,
  modelType: ModelTypes,
  modelId: number,
  modelVersionId: number
) {
  return join(
    getModelVersionPath(basePath, modelType, modelId, modelVersionId),
    getApiInfoJsonFileName(modelVersionId)
  );
}

export function getMediaDir(basePath: string) {
  return join(basePath, "media");
}

export function getMediaFilePathByFileName(fileName: string) {
  return join(getMediaDir(getSettings().basePath), fileName);
}

// // Test cases
// try {
//     console.log(extractFilenameFromUrl('https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/df372d95-4f9b-4363-a86c-82a11d166f40/width=450/6039981.jpeg'));
//     // Output: "6039981.jpeg"

//     console.log(extractFilenameFromUrl('https://example.com/path/to/file.png?param=value'));
//     // Output: "file.png"

//     console.log(extractFilenameFromUrl('not-a-url'));
//     // Throws Error: "Invalid URL provided"
// } catch (e) {
//     console.error(e.message);
// }

export class ModelVersionLayout {
  constructor(
    public modelVersionPath: string,
    public modelVersion: ModelVersion,
    public imgDir: string
  ) {
    this.modelVersionPath = normalize(modelVersionPath);
    this.modelVersion = modelVersion;
    this.imgDir = imgDir;
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
      this.getApiInfoJsonFileName()
    );
  }

  findFile(fileId: number): ModelVersionFile {
    const file = find(this.modelVersion.files, function (file) {
      return file.id === fileId;
    });
    if (file === undefined) {
      throw new Error(`model have no file id: ${fileId}`);
    }
    return file;
  }

  getFileName(fileId: number): string {
    const modelFile = this.findFile(fileId);
    return `${fileId}_${sanitize(modelFile.name)}`;
  }

  getFileDirPath(): string {
    return this.modelVersionPath;
  }

  getFilePath(fileId: number): string {
    const modelFile = this.findFile(fileId);
    return join(join(this.getFileDirPath(), this.getFileName(fileId)));
  }

  findMedia(mediaId: number): ModelVersionImage {
    const img = find(this.modelVersion.images, function (img) {
      return img.id === mediaId;
    });
    if (img === undefined) {
      throw new Error(`model have no file id: ${mediaId}`);
    }
    return img;
  }

  getMediaFileName(mediaId: number): string {
    const media = this.findMedia(mediaId);
    return extractFilenameFromUrl(media.url);
  }

  getMediaFileDirPath(): string {
    return this.imgDir;
  }

  getMediaPath(mediaId: number): string {
    return join(this.getMediaFileDirPath(), this.getMediaFileName(mediaId));
  }
}

export class ModelLayout {
  imgDir: string;
  modelIdPath: string;
  constructor(public basePath: string, public modelId: Model) {
    this.modelIdPath = getModelIdPath(
      basePath,
      this.modelId.type,
      this.modelId.id
    );
    this.imgDir = getMediaDir(basePath);
    this.modelId = modelId;
  }

  findModelVersion(modelVersionId: number): ModelVersion {
    return findModelVersion(this.modelId, modelVersionId);
  }

  getApiInfoJsonFileDir(): string {
    return this.modelIdPath;
  }

  getApiInfoJsonFileName(): string {
    return getApiInfoJsonFileName(this.modelId.id);
  }

  getApiInfoJsonPath(): string {
    return getModelIdApiInfoJsonPath(
      this.basePath,
      this.modelId.type,
      this.modelId.id
    );
  }

  getModelVersionLayout(versionId: number) {
    return new ModelVersionLayout(
      // join(this.modelIdPath, versionId.toString()),
      getModelVersionPath(
        this.basePath,
        this.modelId.type,
        this.modelId.id,
        versionId
      ),
      this.findModelVersion(versionId),
      this.imgDir
    );
  }

  async checkVersionFilesOnDisk(versionId: number): Promise<Array<number>> {
    const mv = this.getModelVersionLayout(versionId)
    const existedFiles: Array<number> = []
    for (let index = 0; index < mv.modelVersion.files.length; index++) {
      const file = mv.modelVersion.files[index];
      const element = Bun.file(mv.getFilePath(file.id));
      if (await element.exists()) {
        existedFiles.push(file.id)
      }
    }
    return existedFiles
  }
}
