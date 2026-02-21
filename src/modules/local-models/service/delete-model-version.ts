import { rm } from "node:fs/promises";
import { join } from "node:path";
import { Result, ok, err } from "neverthrow";
import { getBasePath } from "./file-layout";
import { ModelLayout } from "./file-layout";
import type { Model } from "#civitai-api/v1/models";
import { FileDeleteError, ModelVersionDeleteError } from "./errors";

/**
 * Delete ModelVersion's local files directory
 * @param model The model data
 * @param versionId The model version ID to delete
 * @returns Result indicating success or failure
 */
export async function deleteModelVersionFiles(
  model: Model,
  versionId: number,
): Promise<Result<void, FileDeleteError>> {
  try {
    const basePath = getBasePath();
    const modelLayout = new ModelLayout(basePath, model);
    const versionLayout = await modelLayout.getModelVersionLayout(versionId);
    const modelVersionPath = versionLayout.modelVersionPath;

    // Check if directory exists before attempting to delete
    const dirExists = await Bun.file(modelVersionPath).exists();
    if (!dirExists) {
      return ok(); // Nothing to delete, return success
    }

    // Delete the entire versionId directory
    await rm(modelVersionPath, { recursive: true, force: true });

    return ok();
  } catch (error) {
    return err(
      new FileDeleteError(
        `Failed to delete model version files: ${error instanceof Error ? error.message : String(error)}`,
        "", // Will be populated below
        "delete",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

/**
 * Check if ModelVersion files exist on disk
 * @param model The model data
 * @param versionId The model version ID to check
 * @returns Result with boolean indicating existence
 */
export async function checkModelVersionFilesExist(
  model: Model,
  versionId: number,
): Promise<Result<boolean, ModelVersionDeleteError>> {
  try {
    const basePath = getBasePath();
    const modelLayout = new ModelLayout(basePath, model);
    const versionLayout = await modelLayout.getModelVersionLayout(versionId);
    const modelVersionPath = versionLayout.modelVersionPath;

    const exists = await Bun.file(modelVersionPath).exists();
    return ok(exists);
  } catch (error) {
    return err(
      new ModelVersionDeleteError(
        `Failed to check model version files existence: ${error instanceof Error ? error.message : String(error)}`,
        model.id,
        versionId,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

/**
 * Get detailed information about files to be deleted
 * @param model The model data
 * @param versionId The model version ID
 * @returns Result with deletion details
 */
export async function getModelVersionDeletionDetails(
  model: Model,
  versionId: number,
): Promise<
  Result<
    {
      versionId: number;
      modelId: number;
      modelName: string;
      versionName: string;
      directoryPath: string;
      fileCount: number;
      imageCount: number;
      exists: boolean;
    },
    ModelVersionDeleteError
  >
> {
  try {
    const basePath = getBasePath();
    const modelLayout = new ModelLayout(basePath, model);
    const versionLayout = await modelLayout.getModelVersionLayout(versionId);

    // Find the version data from model
    const versionData = model.modelVersions.find((v) => v.id === versionId);
    if (!versionData) {
      return err(
        new ModelVersionDeleteError(
          `Model version ${versionId} not found in model data`,
          model.id,
          versionId,
        ),
      );
    }

    // Check if directory exists
    const exists = await Bun.file(versionLayout.modelVersionPath).exists();

    return ok({
      versionId,
      modelId: model.id,
      modelName: model.name,
      versionName: versionData.name,
      directoryPath: versionLayout.modelVersionPath,
      fileCount: versionData.files?.length || 0,
      imageCount: versionData.images?.length || 0,
      exists,
    });
  } catch (error) {
    return err(
      new ModelVersionDeleteError(
        `Failed to get deletion details: ${error instanceof Error ? error.message : String(error)}`,
        model.id,
        versionId,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}
