import { type } from "arktype";
import { Elysia, t } from "elysia";
import {
  modelSchema,
  modelVersionSchema,
} from "../../civitai-api/v1/models/models";
import { existedModelVersionsSchema } from "../../civitai-api/v1/models/model-id";
import { modelId2Model } from "../../civitai-api/v1/utils";
import type { ModelsRequestOptions } from "#civitai-api/v1/models";
import { modelsRequestOptionsSchema } from "#civitai-api/v1/models";
import { client } from "../civitai";
import {
  checkModelOnDisk,
  performIncrementalScan,
  performConsistencyCheckWithNeverthrow,
  repairDatabaseRecordsWithNeverthrow,
} from "./service/scan-models";
import { updateAllGopeedTaskStatus } from "../db/crud/modelVersion";
import {
  createDeletionConfirmation,
  createBatchDeletionConfirmation,
  confirmAndDeleteModelVersion,
  confirmAndDeleteBatchModelVersions,
  deleteModelVersionCompletely,
  deleteBatchModelVersionsCompletely,
} from "./service/delete-service";
import { queryLocalModelVersions } from "./service/local-models-query";

export default new Elysia({ prefix: "/local-models" })
  // GET /local-models/models/:id/with-disk-status - Get model with disk existence check
  .get(
    "/models/:id/with-disk-status",
    async ({ params }) => {
      const id = parseInt(params.id, 10);
      if (Number.isNaN(id)) {
        throw new Error("Invalid model ID");
      }

      // Get model data from CivitAI API
      const result = await client.models.getById(id);
      if (result.isErr()) {
        throw new Error(`Failed to get model: ${result.error.message}`);
      }

      const modelById = result.value;
      const modelResult = modelId2Model(modelById);
      if (modelResult.isErr()) {
        throw new Error(
          `Failed to convert model: ${modelResult.error.message}`,
        );
      }
      const modelData = modelResult.value;

      // Check which versions exist on disk
      const diskCheckResult = await checkModelOnDisk(modelData);
      if (diskCheckResult.isErr()) {
        throw new Error(
          `Failed to check disk: ${diskCheckResult.error.message}`,
        );
      }

      return {
        model: modelData,
        existedModelversions: diskCheckResult.value,
      };
    },
    {
      params: type({ id: "string" }),
      response: type({
        model: modelSchema,
        existedModelversions: existedModelVersionsSchema,
      }),
    },
  )
  // GET /local-models/model-versions/:id/with-disk-status - Get model version with disk existence check
  .get(
    "/model-versions/:id/with-disk-status",
    async ({ params }) => {
      const id = parseInt(params.id, 10);
      if (Number.isNaN(id)) {
        throw new Error("Invalid model version ID");
      }

      // Get model version data from CivitAI API
      const versionResult = await client.modelVersions.getById(id);
      if (versionResult.isErr()) {
        throw new Error(
          `Failed to get model version: ${versionResult.error.message}`,
        );
      }

      const modelVersion = versionResult.value;

      // Get the parent model to check disk status
      const modelResult = await client.models.getById(modelVersion.modelId);
      if (modelResult.isErr()) {
        throw new Error(
          `Failed to get parent model: ${modelResult.error.message}`,
        );
      }

      const modelById = modelResult.value;
      const modelConversionResult = modelId2Model(modelById);
      if (modelConversionResult.isErr()) {
        throw new Error(
          `Failed to convert model: ${modelConversionResult.error.message}`,
        );
      }
      const modelData = modelConversionResult.value;

      // Check which versions exist on disk
      const diskCheckResult = await checkModelOnDisk(modelData);
      if (diskCheckResult.isErr()) {
        throw new Error(
          `Failed to check disk: ${diskCheckResult.error.message}`,
        );
      }

      return {
        model: modelData,
        existedModelversions: diskCheckResult.value,
      };
    },
    {
      params: type({ id: "string" }),
      response: type({
        model: modelSchema,
        existedModelversions: existedModelVersionsSchema,
      }),
    },
  )
  // GET /local-models/models/on-disk - List models that exist on disk
  .post(
    "/models/on-disk",
    async ({ body }) => {
      try {
        // 解析分页参数
        const page = body.page || 1;
        const pageSize = body.limit || 20;

        // 使用新的查询服务获取本地模型数据
        const result = await queryLocalModelVersions(page, pageSize);

        if (result.isErr()) {
          throw new Error(
            `Failed to query local models: ${result.error.message}`,
          );
        }

        return result.value;
      } catch (error) {
        console.error("[API] Error in /models/on-disk:", error);
        throw new Error(
          `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    {
      body: modelsRequestOptionsSchema,
      response: type({
        items: type({
          model: modelSchema,
          version: modelVersionSchema,
          mediaUrls: type({
            thumbnail: "string?",
            images: "string[]",
          }),
          files: type({
            id: "number",
            name: "string",
            url: "string",
            exists: "boolean",
          }).array(),
        }).array(),
        metadata: type({
          totalItems: "number",
          currentPage: "number",
          pageSize: "number",
          totalPages: "number",
        }),
      }),
    },
  )
  // GET /local-models/models/:id/versions/on-disk - List model versions that exist on disk for a specific model
  .get(
    "/models/:id/versions/on-disk",
    async ({ params }) => {
      const id = parseInt(params.id, 10);
      if (Number.isNaN(id)) {
        throw new Error("Invalid model ID");
      }

      // Get model data
      const result = await client.models.getById(id);
      if (result.isErr()) {
        throw new Error(`Failed to get model: ${result.error.message}`);
      }

      const modelById = result.value;
      const modelConversionResult = modelId2Model(modelById);
      if (modelConversionResult.isErr()) {
        throw new Error(
          `Failed to convert model: ${modelConversionResult.error.message}`,
        );
      }
      const modelData = modelConversionResult.value;

      // Check which versions exist on disk
      const diskCheckResult = await checkModelOnDisk(modelData);
      if (diskCheckResult.isErr()) {
        throw new Error(
          `Failed to check disk: ${diskCheckResult.error.message}`,
        );
      }

      // Filter model versions to only those that exist on disk
      const versionsOnDisk = modelData.modelVersions.filter((version) =>
        diskCheckResult.value.some((v) => v.versionId === version.id),
      );

      return {
        model: modelData,
        versionsOnDisk,
        diskStatus: diskCheckResult.value,
      };
    },
    {
      params: type({ id: "string" }),
      response: type({
        model: modelSchema,
        versionsOnDisk: modelVersionSchema.array(),
        diskStatus: existedModelVersionsSchema,
      }),
    },
  )
  // POST /local-models/enhanced-scan - Enhanced incremental scan with consistency checks (using neverthrow)
  .post(
    "/enhanced-scan",
    async ({ body }) => {
      console.log("[API] Starting enhanced scan process (neverthrow)...");
      const options = body || {};
      const result = await performIncrementalScan(options);
      if (result.isErr()) {
        console.error(`[API] Enhanced scan failed: ${result.error.message}`);
        throw new Error(`Enhanced scan failed: ${result.error.message}`);
      }
      console.log(
        `[API] Enhanced scan completed. Added ${result.value.newRecordsAdded} new records, found ${result.value.existingRecordsFound} existing records.`,
      );
      return result.value;
    },
    {
      body: type({
        "incremental?": "boolean",
        "checkConsistency?": "boolean",
        "repairDatabase?": "boolean",
        "maxConcurrency?": "number",
      }),
      response: type({
        totalFilesScanned: "number",
        newRecordsAdded: "number",
        existingRecordsFound: "number",
        consistencyErrors: "string[]",
        repairedRecords: "number",
        failedFiles: "string[]",
        scanDurationMs: "number",
      }),
    },
  )
  // POST /local-models/check-consistency - Check database consistency with local files (using neverthrow)
  .post(
    "/check-consistency",
    async () => {
      console.log("[API] Starting database consistency check (neverthrow)...");
      const results = await performConsistencyCheckWithNeverthrow();
      if (results.isErr()) {
        console.error(
          `[API] Consistency check failed: ${results.error.message}`,
        );
        throw new Error(`Consistency check failed: ${results.error.message}`);
      }
      console.log(
        `[API] Consistency check completed. Checked ${results.value.length} model versions.`,
      );
      return results.value;
    },
    {
      response: type({
        modelId: "number",
        versionId: "number",
        missingFiles: "string[]",
        extraFiles: "string[]",
        jsonValid: "boolean",
        databaseRecordExists: "boolean",
      }).array(),
    },
  )
  // POST /local-models/repair-database - Repair database records with consistency issues (using neverthrow)
  .post(
    "/repair-database",
    async () => {
      console.log("[API] Starting database repair process (neverthrow)...");
      const result = await repairDatabaseRecordsWithNeverthrow();
      if (result.isErr()) {
        console.error(`[API] Database repair failed: ${result.error.message}`);
        throw new Error(`Database repair failed: ${result.error.message}`);
      }
      console.log(
        `[API] Database repair completed. Repaired ${result.value.repaired} records, failed on ${result.value.failed} records.`,
      );
      return result.value;
    },
    {
      response: type({
        repaired: "number",
        failed: "number",
        total: "number",
      }),
    },
  )
  // POST /local-models/fix-gopeed-task-status - Fix gopeed task status for all model versions based on disk existence
  .post(
    "/fix-gopeed-task-status",
    async () => {
      console.log("[API] Starting gopeed task status fix process...");
      const result = await updateAllGopeedTaskStatus();
      console.log(
        `[API] Gopeed task status fix completed. Updated ${result.totalUpdatedFiles} files and ${result.totalUpdatedImages} images.`,
      );
      return result;
    },
    {
      response: t.Any(),
    },
  )
  // DELETE /local-models/model-versions/:id - Request deletion of a single model version (requires confirmation)
  .delete(
    "/model-versions/:id",
    async ({ params }) => {
      const versionId = parseInt(params.id, 10);
      if (Number.isNaN(versionId)) {
        throw new Error("Invalid model version ID");
      }

      // Get model version data from CivitAI API
      const versionResult = await client.modelVersions.getById(versionId);
      if (versionResult.isErr()) {
        throw new Error(
          `Failed to get model version: ${versionResult.error.message}`,
        );
      }

      const modelVersion = versionResult.value;

      // Get the parent model
      const modelResult = await client.models.getById(modelVersion.modelId);
      if (modelResult.isErr()) {
        throw new Error(
          `Failed to get parent model: ${modelResult.error.message}`,
        );
      }

      const modelById = modelResult.value;
      const modelConversionResult = modelId2Model(modelById);
      if (modelConversionResult.isErr()) {
        throw new Error(
          `Failed to convert model: ${modelConversionResult.error.message}`,
        );
      }
      const modelData = modelConversionResult.value;

      // Create deletion confirmation
      const confirmationResult = await createDeletionConfirmation(
        modelData,
        versionId,
      );
      if (confirmationResult.isErr()) {
        throw new Error(
          `Failed to create deletion confirmation: ${confirmationResult.error.message}`,
        );
      }

      return confirmationResult.value;
    },
    {
      params: type({ id: "string" }),
      response: type({
        token: "string",
        expiresAt: "Date",
        item: type({
          versionId: "number",
          modelId: "number",
          modelName: "string",
          versionName: "string",
          directoryPath: "string",
          fileCount: "number",
          imageCount: "number",
          exists: "boolean",
        }),
      }),
    },
  )
  // DELETE /local-models/model-versions - Request deletion of multiple model versions (requires confirmation)
  .delete(
    "/model-versions",
    async ({ body }) => {
      const { versionIds } = body;
      if (!Array.isArray(versionIds) || versionIds.length === 0) {
        throw new Error("versionIds must be a non-empty array");
      }

      const items = [];

      // Get model and version data for each ID
      for (const versionId of versionIds) {
        const versionResult = await client.modelVersions.getById(versionId);
        if (versionResult.isErr()) {
          throw new Error(
            `Failed to get model version ${versionId}: ${versionResult.error.message}`,
          );
        }

        const modelVersion = versionResult.value;

        // Get the parent model
        const modelResult = await client.models.getById(modelVersion.modelId);
        if (modelResult.isErr()) {
          throw new Error(
            `Failed to get parent model for version ${versionId}: ${modelResult.error.message}`,
          );
        }

        const modelById = modelResult.value;
        const modelConversionResult = modelId2Model(modelById);
        if (modelConversionResult.isErr()) {
          throw new Error(
            `Failed to convert model for version ${versionId}: ${modelConversionResult.error.message}`,
          );
        }
        const modelData = modelConversionResult.value;

        items.push({ model: modelData, versionId });
      }

      // Create batch deletion confirmation
      const confirmationResult = await createBatchDeletionConfirmation(items);
      if (confirmationResult.isErr()) {
        throw new Error(
          `Failed to create batch deletion confirmation: ${confirmationResult.error.message}`,
        );
      }

      return confirmationResult.value;
    },
    {
      body: type({
        versionIds: "number[]",
      }),
      response: type({
        token: "string",
        expiresAt: "Date",
        items: type({
          versionId: "number",
          modelId: "number",
          modelName: "string",
          versionName: "string",
          directoryPath: "string",
          fileCount: "number",
          imageCount: "number",
          exists: "boolean",
        }).array(),
      }),
    },
  )
  // POST /local-models/model-versions/:id/confirm-delete - Confirm and delete a single model version
  .post(
    "/model-versions/:id/confirm-delete",
    async ({ params, body }) => {
      const versionId = parseInt(params.id, 10);
      if (Number.isNaN(versionId)) {
        throw new Error("Invalid model version ID");
      }

      const { token } = body;
      if (!token) {
        throw new Error("Confirmation token is required");
      }

      // Confirm and delete using the token
      const result = await confirmAndDeleteModelVersion(token);
      if (result.isErr()) {
        throw new Error(
          `Failed to confirm and delete: ${result.error.message}`,
        );
      }

      return result.value;
    },
    {
      params: type({ id: "string" }),
      body: type({
        token: "string",
      }),
      response: type({
        versionId: "number",
        databaseDeleted: "boolean",
        filesDeleted: "boolean",
        modelDeleted: "boolean",
        deletedFiles: "number",
        deletedImages: "number",
      }),
    },
  )
  // POST /local-models/model-versions/confirm-delete - Confirm and delete multiple model versions
  .post(
    "/model-versions/confirm-delete",
    async ({ body }) => {
      const { token } = body;
      if (!token) {
        throw new Error("Confirmation token is required");
      }

      // Confirm and delete using the token
      const result = await confirmAndDeleteBatchModelVersions(token);
      if (result.isErr()) {
        throw new Error(
          `Failed to confirm and delete: ${result.error.message}`,
        );
      }

      return result.value;
    },
    {
      body: type({
        token: "string",
      }),
      response: type({
        total: "number",
        succeeded: "number",
        failed: "number",
        results: type({
          versionId: "number",
          success: "boolean",
          error: "string?",
          databaseDeleted: "boolean?",
          filesDeleted: "boolean?",
          modelDeleted: "boolean?",
          deletedFiles: "number?",
          deletedImages: "number?",
        }).array(),
      }),
    },
  )
  // GET /local-models/media - Get media file (images, etc.)
  .get(
    "/media",
    async ({ query }) => {
      try {
        const { modelId, versionId, modelType, filename } = query;

        // 验证参数
        if (!modelId || !versionId || !modelType || !filename) {
          throw new Error(
            "Missing required parameters: modelId, versionId, modelType, filename",
          );
        }

        const modelIdNum = parseInt(modelId, 10);
        const versionIdNum = parseInt(versionId, 10);

        if (Number.isNaN(modelIdNum) || Number.isNaN(versionIdNum)) {
          throw new Error("modelId and versionId must be valid numbers");
        }

        // 使用 file-layout 计算文件路径
        const { getMediaDir } = await import("./service/file-layout");
        const { settingsService } = await import("../settings/service");

        const basePath = settingsService.getSettings().basePath;
        const mediaDir = getMediaDir(
          basePath,
          modelType,
          modelIdNum,
          versionIdNum,
        );
        const filePath = `${mediaDir}/${filename}`;

        // 检查文件是否存在
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
          throw new Error(`File not found: ${filename}`);
        }

        // 根据文件扩展名设置 Content-Type
        const extension = filename.toLowerCase().split(".").pop();
        const contentType = getContentType(extension);

        // 返回文件
        return new Response(file, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400", // 缓存一天
          },
        });
      } catch (error) {
        console.error("[API] Error serving media file:", error);
        throw new Error(
          `Failed to serve media file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    {
      query: type({
        modelId: "string",
        versionId: "string",
        modelType: "string",
        filename: "string",
      }),
    },
  );

// 辅助函数：根据文件扩展名获取 Content-Type
function getContentType(extension: string | undefined): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    pdf: "application/pdf",
    json: "application/json",
    txt: "text/plain",
  };

  if (extension && mimeTypes[extension]) {
    return mimeTypes[extension];
  }

  return "application/octet-stream";
}
