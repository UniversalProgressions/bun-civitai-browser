import { Result, ok, err } from "neverthrow";
import type { Model } from "#civitai-api/v1/models";
import { prisma } from "../../db/service";
import {
  deleteOneModelVersion,
  deleteMultipleModelVersions,
} from "../../db/crud/modelVersion";
import {
  deleteModelVersionFiles,
  checkModelVersionFilesExist,
  getModelVersionDeletionDetails,
} from "./delete-model-version";
import {
  ModelVersionDeleteError,
  DeleteConfirmationError,
  BatchDeleteError,
} from "./errors";

// Memory storage for delete confirmation tokens
const deleteConfirmations = new Map<
  string,
  {
    expiresAt: Date;
    items: Array<{
      versionId: number;
      model: Model;
      deletionDetails: Awaited<
        ReturnType<typeof getModelVersionDeletionDetails>
      >;
    }>;
  }
>();

// Export for testing
export const __test = {
  deleteConfirmations,
};

// Token expiration time (30 minutes)
const TOKEN_EXPIRATION_MS = 30 * 60 * 1000;

/**
 * Generate a unique confirmation token
 */
function generateConfirmationToken(): string {
  return `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate a confirmation token
 */
function validateConfirmationToken(token: string): Result<
  {
    expiresAt: Date;
    items: Array<{
      versionId: number;
      model: Model;
      deletionDetails: Awaited<
        ReturnType<typeof getModelVersionDeletionDetails>
      >;
    }>;
  },
  DeleteConfirmationError
> {
  const confirmation = deleteConfirmations.get(token);
  if (!confirmation) {
    return err(
      new DeleteConfirmationError(
        "Confirmation token not found",
        token,
        "missing",
      ),
    );
  }

  if (confirmation.expiresAt < new Date()) {
    deleteConfirmations.delete(token);
    return err(
      new DeleteConfirmationError(
        "Confirmation token expired",
        token,
        "expired",
      ),
    );
  }

  return ok(confirmation);
}

/**
 * Create a deletion confirmation for a single model version
 * @param model The model data
 * @param versionId The model version ID to delete
 * @returns Result with confirmation token and deletion details
 */
export async function createDeletionConfirmation(
  model: Model,
  versionId: number,
): Promise<
  Result<
    {
      token: string;
      expiresAt: Date;
      item: {
        versionId: number;
        modelId: number;
        modelName: string;
        versionName: string;
        directoryPath: string;
        fileCount: number;
        imageCount: number;
        exists: boolean;
      };
    },
    DeleteConfirmationError | ModelVersionDeleteError
  >
> {
  try {
    // Get deletion details
    const detailsResult = await getModelVersionDeletionDetails(
      model,
      versionId,
    );
    if (detailsResult.isErr()) {
      return err(detailsResult.error);
    }

    const details = detailsResult.value;

    // Generate token
    const token = generateConfirmationToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // Store confirmation
    deleteConfirmations.set(token, {
      expiresAt,
      items: [
        {
          versionId,
          model,
          deletionDetails: detailsResult,
        },
      ],
    });

    // Clean up old confirmations
    cleanupExpiredConfirmations();

    return ok({
      token,
      expiresAt,
      item: details,
    });
  } catch (error) {
    return err(
      new DeleteConfirmationError(
        `Failed to create deletion confirmation: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        "invalid",
      ),
    );
  }
}

/**
 * Create a deletion confirmation for multiple model versions
 * @param items Array of { model, versionId } pairs
 * @returns Result with confirmation token and deletion details
 */
export async function createBatchDeletionConfirmation(
  items: Array<{ model: Model; versionId: number }>,
): Promise<
  Result<
    {
      token: string;
      expiresAt: Date;
      items: Array<{
        versionId: number;
        modelId: number;
        modelName: string;
        versionName: string;
        directoryPath: string;
        fileCount: number;
        imageCount: number;
        exists: boolean;
      }>;
    },
    DeleteConfirmationError | ModelVersionDeleteError
  >
> {
  try {
    const confirmationItems = [];
    const deletionDetails = [];

    // Get details for all items
    for (const { model, versionId } of items) {
      const detailsResult = await getModelVersionDeletionDetails(
        model,
        versionId,
      );
      if (detailsResult.isErr()) {
        return err(detailsResult.error);
      }

      confirmationItems.push({
        versionId,
        model,
        deletionDetails: detailsResult,
      });

      deletionDetails.push(detailsResult.value);
    }

    // Generate token
    const token = generateConfirmationToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

    // Store confirmation
    deleteConfirmations.set(token, {
      expiresAt,
      items: confirmationItems,
    });

    // Clean up old confirmations
    cleanupExpiredConfirmations();

    return ok({
      token,
      expiresAt,
      items: deletionDetails,
    });
  } catch (error) {
    return err(
      new DeleteConfirmationError(
        `Failed to create batch deletion confirmation: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        "invalid",
      ),
    );
  }
}

/**
 * Confirm and delete a single model version using a confirmation token
 * @param token Confirmation token
 * @returns Result with deletion results
 */
export async function confirmAndDeleteModelVersion(token: string): Promise<
  Result<
    {
      versionId: number;
      databaseDeleted: boolean;
      filesDeleted: boolean;
      modelDeleted: boolean;
      deletedFiles: number;
      deletedImages: number;
    },
    DeleteConfirmationError | ModelVersionDeleteError
  >
> {
  // Validate token
  const validationResult = validateConfirmationToken(token);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const confirmation = validationResult.value;

  // Should only have one item for single deletion
  if (confirmation.items.length !== 1) {
    return err(
      new DeleteConfirmationError(
        "Invalid confirmation token for single deletion",
        token,
        "invalid",
      ),
    );
  }

  const { versionId, model, deletionDetails } = confirmation.items[0];

  // Get deletion details
  const details = deletionDetails.isOk() ? deletionDetails.value : null;
  if (!details) {
    return err(
      new ModelVersionDeleteError(
        "Failed to get deletion details",
        model.id,
        versionId,
      ),
    );
  }

  try {
    // Check if files exist
    const filesExist = details.exists;

    // Delete database record
    const dbResult = await deleteOneModelVersion(versionId, model.id, prisma);

    // Delete files if they exist
    let filesDeleted = false;
    if (filesExist) {
      const deleteResult = await deleteModelVersionFiles(model, versionId);
      filesDeleted = deleteResult.isOk();
    }

    // Remove token after successful deletion
    deleteConfirmations.delete(token);

    return ok({
      versionId,
      databaseDeleted: dbResult.deleted,
      filesDeleted,
      modelDeleted: dbResult.modelDeleted,
      deletedFiles: dbResult.fileCount,
      deletedImages: dbResult.imageCount,
    });
  } catch (error) {
    return err(
      new ModelVersionDeleteError(
        `Failed to delete model version: ${error instanceof Error ? error.message : String(error)}`,
        model.id,
        versionId,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

/**
 * Confirm and delete multiple model versions using a confirmation token
 * @param token Confirmation token
 * @returns Result with batch deletion results
 */
export async function confirmAndDeleteBatchModelVersions(
  token: string,
): Promise<
  Result<
    {
      total: number;
      succeeded: number;
      failed: number;
      results: Array<{
        versionId: number;
        success: boolean;
        error?: string;
        databaseDeleted?: boolean;
        filesDeleted?: boolean;
        modelDeleted?: boolean;
        deletedFiles?: number;
        deletedImages?: number;
      }>;
    },
    DeleteConfirmationError | BatchDeleteError
  >
> {
  // Validate token
  const validationResult = validateConfirmationToken(token);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  const confirmation = validationResult.value;
  const results = [];
  let succeeded = 0;
  let failed = 0;

  // Process each item
  for (const { versionId, model, deletionDetails } of confirmation.items) {
    try {
      const details = deletionDetails.isOk() ? deletionDetails.value : null;
      if (!details) {
        results.push({
          versionId,
          success: false,
          error: "Failed to get deletion details",
        });
        failed++;
        continue;
      }

      // Check if files exist
      const filesExist = details.exists;

      // Delete database record
      const dbResult = await deleteOneModelVersion(versionId, model.id, prisma);

      // Delete files if they exist
      let filesDeleted = false;
      if (filesExist) {
        const deleteResult = await deleteModelVersionFiles(model, versionId);
        filesDeleted = deleteResult.isOk();
      }

      results.push({
        versionId,
        success: true,
        databaseDeleted: dbResult.deleted,
        filesDeleted,
        modelDeleted: dbResult.modelDeleted,
        deletedFiles: dbResult.fileCount,
        deletedImages: dbResult.imageCount,
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

  // Remove token after processing
  deleteConfirmations.delete(token);

  if (failed > 0) {
    return err(
      new BatchDeleteError(
        `Batch deletion partially failed: ${failed} items failed`,
        confirmation.items.length,
        succeeded,
        failed,
        results
          .filter((r) => !r.success)
          .map((r) => ({
            versionId: r.versionId,
            error: r.error || "Unknown error",
          })),
      ),
    );
  }

  return ok({
    total: confirmation.items.length,
    succeeded,
    failed,
    results,
  });
}

/**
 * Delete a model version completely (database + files) without confirmation
 * @param model The model data
 * @param versionId The model version ID to delete
 * @returns Result with deletion results
 */
export async function deleteModelVersionCompletely(
  model: Model,
  versionId: number,
): Promise<
  Result<
    {
      databaseDeleted: boolean;
      filesDeleted: boolean;
      modelDeleted: boolean;
      deletedFiles: number;
      deletedImages: number;
    },
    ModelVersionDeleteError
  >
> {
  try {
    // Check if files exist
    const filesExistResult = await checkModelVersionFilesExist(
      model,
      versionId,
    );
    if (filesExistResult.isErr()) {
      return err(filesExistResult.error);
    }

    const filesExist = filesExistResult.value;

    // Delete database record
    const dbResult = await deleteOneModelVersion(versionId, model.id, prisma);

    // Delete files if they exist
    let filesDeleted = false;
    if (filesExist) {
      const deleteResult = await deleteModelVersionFiles(model, versionId);
      filesDeleted = deleteResult.isOk();
    }

    return ok({
      databaseDeleted: dbResult.deleted,
      filesDeleted,
      modelDeleted: dbResult.modelDeleted,
      deletedFiles: dbResult.fileCount,
      deletedImages: dbResult.imageCount,
    });
  } catch (error) {
    return err(
      new ModelVersionDeleteError(
        `Failed to delete model version completely: ${error instanceof Error ? error.message : String(error)}`,
        model.id,
        versionId,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
}

/**
 * Delete multiple model versions completely (database + files) without confirmation
 * @param items Array of { model, versionId } pairs
 * @returns Result with batch deletion results
 */
export async function deleteBatchModelVersionsCompletely(
  items: Array<{ model: Model; versionId: number }>,
): Promise<
  Result<
    {
      total: number;
      succeeded: number;
      failed: number;
      results: Array<{
        versionId: number;
        success: boolean;
        error?: string;
        databaseDeleted?: boolean;
        filesDeleted?: boolean;
        modelDeleted?: boolean;
        deletedFiles?: number;
        deletedImages?: number;
      }>;
    },
    BatchDeleteError
  >
> {
  const results = [];
  let succeeded = 0;
  let failed = 0;

  for (const { model, versionId } of items) {
    try {
      const result = await deleteModelVersionCompletely(model, versionId);
      if (result.isErr()) {
        throw new Error(result.error.message);
      }

      const value = result.value;
      results.push({
        versionId,
        success: true,
        databaseDeleted: value.databaseDeleted,
        filesDeleted: value.filesDeleted,
        modelDeleted: value.modelDeleted,
        deletedFiles: value.deletedFiles,
        deletedImages: value.deletedImages,
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

  if (failed > 0) {
    return err(
      new BatchDeleteError(
        `Batch deletion partially failed: ${failed} items failed`,
        items.length,
        succeeded,
        failed,
        results
          .filter((r) => !r.success)
          .map((r) => ({
            versionId: r.versionId,
            error: r.error || "Unknown error",
          })),
      ),
    );
  }

  return ok({
    total: items.length,
    succeeded,
    failed,
    results,
  });
}

/**
 * Clean up expired confirmation tokens
 */
function cleanupExpiredConfirmations(): void {
  const now = new Date();
  for (const [token, confirmation] of deleteConfirmations.entries()) {
    if (confirmation.expiresAt < now) {
      deleteConfirmations.delete(token);
    }
  }
}

/**
 * Get statistics about confirmation tokens
 */
export function getConfirmationStats(): {
  activeTokens: number;
  totalItems: number;
  oldestExpiration: Date | null;
  newestExpiration: Date | null;
} {
  const tokens = Array.from(deleteConfirmations.entries());
  if (tokens.length === 0) {
    return {
      activeTokens: 0,
      totalItems: 0,
      oldestExpiration: null,
      newestExpiration: null,
    };
  }

  const expirations = tokens.map(([, confirmation]) => confirmation.expiresAt);
  const totalItems = tokens.reduce(
    (sum, [, confirmation]) => sum + confirmation.items.length,
    0,
  );

  return {
    activeTokens: tokens.length,
    totalItems,
    oldestExpiration: new Date(
      Math.min(...expirations.map((d) => d.getTime())),
    ),
    newestExpiration: new Date(
      Math.max(...expirations.map((d) => d.getTime())),
    ),
  };
}
