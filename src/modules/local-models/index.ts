import { type } from "arktype";
import { Elysia, t } from "elysia";
import {
  modelSchema,
  modelVersionSchema,
} from "../../civitai-api/v1/models/models";
import { existedModelVersionsSchema } from "../../civitai-api/v1/models/model-id";
import { modelId2Model } from "../../civitai-api/v1/utils";
import { client } from "../civitai";
import {
  checkModelOnDisk,
  performIncrementalScan,
  performConsistencyCheckWithNeverthrow,
  repairDatabaseRecordsWithNeverthrow,
} from "./service/scan-models";
import { updateAllGopeedTaskStatus } from "../db/crud/modelVersion";

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
  .get(
    "/models/on-disk",
    async () => {
      // This would need to scan the filesystem and match with API data
      // For now, return a placeholder response
      return {
        items: [],
        metadata: {
          totalItems: 0,
          currentPage: 1,
          pageSize: 0,
          totalPages: 0,
        },
      };
    },
    {
      response: type({
        items: modelSchema.array(),
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
  );
