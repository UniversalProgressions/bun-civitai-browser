import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Result, ok, err } from "neverthrow";
import fg from "fast-glob";
import { settingsService } from "#modules/settings/service";
import { ModelLayout } from "./file-layout";
import type { Model } from "#civitai-api/v1/models/models";
import type { ExistedModelVersions } from "#civitai-api/v1/models/model-id";

// Supported model file extensions
const SUPPORTED_MODEL_EXTENSIONS = [
  ".safetensors",
  ".ckpt",
  ".pt",
  ".pth",
  ".bin",
  ".onnx",
  ".gguf",
];

/**
 * Check if a directory contains at least one model file.
 * Note: With the new file layout, model files are stored in the "files" subdirectory.
 * @param dirPath Absolute path to the directory
 * @returns Promise<Result<boolean, Error>> - true if model files exist, false otherwise
 */
export async function hasModelFiles(
  dirPath: string,
): Promise<Result<boolean, Error>> {
  try {
    // Check the "files" subdirectory in the new layout
    const filesDir = join(dirPath, "files");

    // Check if the files directory exists
    try {
      await fs.access(filesDir);
    } catch {
      // files directory doesn't exist
      return ok(false);
    }

    const files = await fs.readdir(filesDir);

    for (const file of files) {
      const fullPath = join(filesDir, file);
      const stats = await fs.stat(fullPath);

      if (stats.isFile()) {
        // Check if file has a supported model extension
        const extension = file.toLowerCase().slice(file.lastIndexOf("."));
        if (SUPPORTED_MODEL_EXTENSIONS.includes(extension)) {
          return ok(true);
        }
      }
    }

    return ok(false);
  } catch (error) {
    return err(
      new Error(
        `Error scanning directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * Check if a model version exists on disk with the new file layout.
 * @param modelVersionPath Absolute path to the model version directory
 * @returns Promise<Result<boolean, Error>> - true if model version exists on disk
 */
export async function isModelVersionOnDisk(
  modelVersionPath: string,
): Promise<Result<boolean, Error>> {
  try {
    // Check if the model version directory exists
    const dirExists = await Bun.file(modelVersionPath).exists();
    if (!dirExists) {
      return ok(false);
    }

    // Check if there are model files in the "files" subdirectory
    const hasFilesResult = await hasModelFiles(modelVersionPath);
    if (hasFilesResult.isErr()) {
      return err(hasFilesResult.error);
    }

    return ok(hasFilesResult.value);
  } catch (error) {
    return err(
      new Error(
        `Error checking model version at ${modelVersionPath}: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * Scans for model files in the base directory.
 *
 * TODO: Optimize using fast-glob's stream feature to implement async iterator pattern
 * This would allow streaming results instead of returning all at once, which is important
 * when dealing with thousands of files. Example optimization:
 *
 * ```typescript
 * import fg from "fast-glob";
 *
 * async function* scanModelsStream(): AsyncGenerator<string, void, void> {
 *   const stream = fg.stream(pattern);
 *   for await (const file of stream) {
 *     yield file;
 *   }
 * }
 * ```
 *
 * @returns Promise<Result<string[], Error>> - Array of absolute paths to model files
 */
export async function scanModels(): Promise<Result<string[], Error>> {
  try {
    const settings = settingsService.getSettings();
    const basePath = settings.basePath;

    // Build pattern for all supported model file extensions
    const extensionsPattern = `{${SUPPORTED_MODEL_EXTENSIONS.map((ext) => ext.slice(1)).join(",")}}`;
    const pattern =
      process.platform === "win32"
        ? `${fg.convertPathToPattern(basePath)}/**/*.${extensionsPattern}`
        : `${basePath}/**/*.${extensionsPattern}`;

    const modelFiles = await fg.async(pattern);
    return ok(modelFiles);
  } catch (error) {
    return err(
      new Error(
        `Failed to scan models: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * Check which model versions exist on disk for a given model.
 * @param modelData The model data to check
 * @returns Promise<Result<ExistedModelVersions, Error>> - Array of model versions that exist on disk with their file IDs
 */
export async function checkModelOnDisk(
  modelData: Model,
): Promise<Result<ExistedModelVersions, Error>> {
  try {
    const settings = settingsService.getSettings();
    const mi = new ModelLayout(settings.basePath, modelData);
    const existedModelVersions: ExistedModelVersions = [];

    for (const version of modelData.modelVersions) {
      const idsOfFilesOnDiskResult = await mi.checkVersionFilesOnDisk(
        version.id,
      );
      if (idsOfFilesOnDiskResult.length === 0) {
        continue;
      }

      existedModelVersions.push({
        versionId: version.id,
        filesOnDisk: idsOfFilesOnDiskResult,
      });
    }

    return ok(existedModelVersions);
  } catch (error) {
    return err(
      new Error(
        `Failed to check model on disk: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

// Legacy function names for backward compatibility
export async function hasSafetensorsFile(dirPath: string): Promise<boolean> {
  const result = await hasModelFiles(dirPath);
  return result.isOk() ? result.value : false;
}

export async function checkIfModelVersionOnDisk(
  modelVersionPath: string,
): Promise<boolean> {
  const result = await isModelVersionOnDisk(modelVersionPath);
  return result.isOk() ? result.value : false;
}
