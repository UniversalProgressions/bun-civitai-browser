import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Result, ok, err } from "neverthrow";
import fg from "fast-glob";
import { settingsService } from "../../settings/service";
import { ModelLayout } from "./file-layout";
import type {
  ExistedModelVersions,
  Model,
  ModelVersion,
} from "#civitai-api/v1/models";
import { extractModelInfo } from "../../db/crud/modelVersion";
import { ModelVersionRelations } from "#generated/typebox/ModelVersion";

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

// Scans for model files in the base directory.
export function scanModelsStream() {
  const settings = settingsService.getSettings();
  const basePath = settings.basePath;

  // Build pattern for all supported model file extensions
  const extensionsPattern = `{${SUPPORTED_MODEL_EXTENSIONS.map((ext) => ext.slice(1)).join(",")}}`;
  const pattern =
    process.platform === "win32"
      ? `${fg.convertPathToPattern(basePath)}/**/*.${extensionsPattern}`
      : `${basePath}/**/*.${extensionsPattern}`;

  return fg.globStream(pattern);
}

// Custom error types for scanning operations
export class ScanError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly operation?: string,
  ) {
    super(message);
    this.name = "ScanError";
  }
}

export class JsonParseError extends ScanError {
  constructor(
    message: string,
    filePath: string,
    public readonly validationErrors?: string,
  ) {
    super(message, filePath, "json-parse");
    this.name = "JsonParseError";
  }
}

export class DatabaseError extends ScanError {
  constructor(
    message: string,
    public readonly modelId?: number,
    public readonly versionId?: number,
  ) {
    super(message, undefined, "database");
    this.name = "DatabaseError";
  }
}

export class FileNotFoundError extends ScanError {
  constructor(message: string, filePath: string) {
    super(message, filePath, "file-not-found");
    this.name = "FileNotFoundError";
  }
}

export class DirectoryStructureError extends ScanError {
  constructor(
    message: string,
    filePath: string,
    public readonly expectedPattern?: string,
  ) {
    super(message, filePath, "directory-structure");
    this.name = "DirectoryStructureError";
  }
}

// Types for scanning operations
export interface ScanOptions {
  incremental?: boolean;
  checkConsistency?: boolean;
  repairDatabase?: boolean;
  maxConcurrency?: number;
}

export interface ScanResult {
  scannedFiles: number;
  existingRecords: number;
  addedRecords: number;
  missingJsonWarnings: number;
  errors: number;
  details: string[];
}

export interface EnhancedScanResult {
  totalFilesScanned: number;
  newRecordsAdded: number;
  existingRecordsFound: number;
  consistencyErrors: string[];
  repairedRecords: number;
  failedFiles: string[];
  scanDurationMs: number;
}

export interface ConsistencyCheckResult {
  modelId: number;
  versionId: number;
  missingFiles: string[];
  extraFiles: string[];
  jsonValid: boolean;
  databaseRecordExists: boolean;
}

/**
 * Scan all model files in the base directory using neverthrow style.
 * @returns Promise<Result<string[], ScanError>> - Array of file paths that match expected directory structure
 */
export async function scanAllModelFilesWithNeverthrow(): Promise<
  Result<string[], ScanError>
> {
  try {
    const settings = settingsService.getSettings();
    const basePath = settings.basePath;

    // Build pattern for all supported model file extensions
    const extensionsPattern = `{${SUPPORTED_MODEL_EXTENSIONS.map((ext) => ext.slice(1)).join(",")}}`;
    const pattern =
      process.platform === "win32"
        ? `${fg.convertPathToPattern(basePath)}/**/*.${extensionsPattern}`
        : `${basePath}/**/*.${extensionsPattern}`;

    console.log(`[SCAN] Scanning pattern: ${pattern}`);

    const files = await fg(pattern, { onlyFiles: true, absolute: true });

    console.log(`[SCAN] Found ${files.length} model files`);

    // Filter files that match the expected directory structure
    const validFiles = files.filter((filePath: string) => {
      const info = extractModelInfo(filePath);
      return info !== null;
    });

    console.log(
      `[SCAN] ${validFiles.length} files match expected directory structure`,
    );

    return ok(validFiles);
  } catch (error) {
    console.error(`[SCAN ERROR] Failed to scan files: ${error}`);
    return err(
      new ScanError(
        `Failed to scan files: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        "scan",
      ),
    );
  }
}

// Legacy Effect function for backward compatibility
export const scanAllModelFiles = {
  // This is a placeholder to maintain compatibility during migration
  // Will be removed after updating all callers
};

// Helper function to safely check file existence
async function checkFileExistsSafe(filePath: string): Promise<boolean> {
  try {
    return await Bun.file(filePath).exists();
  } catch {
    return false;
  }
}

// Helper function to get last scan time
async function getLastScanTime(basePath: string): Promise<Date> {
  try {
    const configPath = `${basePath}/.last_scan_time`;
    const content = await Bun.file(configPath).text();
    return new Date(content.trim());
  } catch {
    return new Date(0);
  }
}

// Helper function to update last scan time
async function updateLastScanTime(basePath: string): Promise<void> {
  try {
    const configPath = `${basePath}/.last_scan_time`;
    await Bun.write(configPath, new Date().toISOString());
  } catch (error) {
    console.warn(`Failed to update last scan time: ${error}`);
  }
}

/**
 * Perform incremental scan of model files
 * @param options Scan options
 * @returns Promise<Result<EnhancedScanResult, ScanError>>
 */
export async function performIncrementalScan(
  options: ScanOptions = {},
): Promise<Result<EnhancedScanResult, ScanError>> {
  const startTime = Date.now();

  try {
    const settings = settingsService.getSettings();
    const basePath = settings.basePath;

    // Get last scan timestamp
    const lastScanTime = await getLastScanTime(basePath);

    // Scan all model files
    const scanResult = await scanAllModelFilesWithNeverthrow();
    if (scanResult.isErr()) {
      return err(scanResult.error);
    }

    const allFiles = scanResult.value;

    // Filter files modified since last scan for incremental mode
    let filesToProcess = allFiles;
    if (options.incremental !== false) {
      const filteredFiles: string[] = [];

      for (const filePath of allFiles) {
        try {
          const stats = await fs.stat(filePath);
          if (stats.mtime > lastScanTime) {
            filteredFiles.push(filePath);
          }
        } catch {
          // Skip files we can't stat
        }
      }

      filesToProcess = filteredFiles;
    }

    console.log(
      `[ENHANCED SCAN] Processing ${filesToProcess.length} files (${options.incremental !== false ? "incremental" : "full"} mode)`,
    );

    // Process files
    const results: Array<{
      filePath: string;
      status: "added" | "exists" | "error" | "skipped";
      message: string;
    }> = [];
    let newRecordsAdded = 0;
    let existingRecordsFound = 0;
    const failedFiles: string[] = [];

    for (const filePath of filesToProcess) {
      try {
        const result = await processSingleFile(filePath, basePath);
        results.push(result);

        if (result.status === "added") {
          newRecordsAdded++;
        } else if (result.status === "exists") {
          existingRecordsFound++;
        } else if (result.status === "error") {
          failedFiles.push(`${filePath}: ${result.message}`);
        }
      } catch (error) {
        failedFiles.push(
          `${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Update last scan timestamp
    await updateLastScanTime(basePath);

    const durationMs = Date.now() - startTime;

    const scanResultData: EnhancedScanResult = {
      totalFilesScanned: filesToProcess.length,
      newRecordsAdded,
      existingRecordsFound,
      consistencyErrors: [], // Will be populated by consistency check if requested
      repairedRecords: 0,
      failedFiles,
      scanDurationMs: durationMs,
    };

    return ok(scanResultData);
  } catch (error) {
    console.error("[ENHANCED SCAN] Error during scan:", error);
    const durationMs = Date.now() - startTime;
    return err(
      new ScanError(
        `Scan error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        "scan",
      ),
    );
  }
}

/**
 * Process a single file for database insertion
 */
async function processSingleFile(
  filePath: string,
  basePath: string,
): Promise<{
  filePath: string;
  status: "added" | "exists" | "error" | "skipped";
  message: string;
}> {
  console.log(`[SCAN] Processing file: ${filePath}`);

  const modelInfo = extractModelInfo(filePath);
  if (!modelInfo) {
    return {
      filePath,
      status: "skipped",
      message: "File does not match expected directory structure",
    };
  }

  // Import necessary utilities
  const { getModelIdApiInfoJsonPath, getModelVersionApiInfoJsonPath } =
    await import("./file-layout");
  const { prisma } = await import("../../db/service");
  const { modelSchema, modelVersionSchema } = await import(
    "#civitai-api/v1/models"
  );
  const { type } = await import("arktype");
  const { upsertOneModelVersion } = await import("../../db/crud/modelVersion");

  // Check JSON files exist
  const modelJsonPath = getModelIdApiInfoJsonPath(
    basePath,
    modelInfo.modelType,
    modelInfo.modelId,
  );

  const versionJsonPath = getModelVersionApiInfoJsonPath(
    basePath,
    modelInfo.modelType,
    modelInfo.modelId,
    modelInfo.versionId,
  );

  const [modelJsonExists, versionJsonExists] = await Promise.all([
    checkFileExistsSafe(modelJsonPath),
    checkFileExistsSafe(versionJsonPath),
  ]);

  if (!modelJsonExists || !versionJsonExists) {
    const missingFiles: string[] = [];
    if (!modelJsonExists) missingFiles.push("model JSON");
    if (!versionJsonExists) missingFiles.push("version JSON");
    console.log(
      `[SCAN]   ⚠ Missing ${missingFiles.join(" and ")} file(s), skipping`,
    );
    return {
      filePath,
      status: "skipped",
      message: `Missing JSON file(s): ${missingFiles.join(", ")}`,
    };
  }

  // Check if model version already exists in database
  const existingRecord = await prisma.modelVersion.findUnique({
    where: { id: modelInfo.versionId },
  });

  if (existingRecord) {
    console.log(
      `[SCAN]   ✓ Record already exists in database (Version ID: ${modelInfo.versionId})`,
    );
    return {
      filePath,
      status: "exists",
      message: `Version ${modelInfo.versionId} already exists in database`,
    };
  }

  // Read and parse JSON files
  let modelData: Model, versionData: ModelVersion;

  try {
    const modelContent = await Bun.file(modelJsonPath).json();
    const versionContent = await Bun.file(versionJsonPath).json();

    const modelValidation = modelSchema(modelContent);
    const versionValidation = modelVersionSchema(versionContent);

    if (
      modelValidation instanceof type.errors ||
      versionValidation instanceof type.errors
    ) {
      const errors: string[] = [];
      if (modelValidation instanceof type.errors)
        errors.push(`Model JSON: ${modelValidation.summary}`);
      if (versionValidation instanceof type.errors)
        errors.push(`Version JSON: ${versionValidation.summary}`);

      return {
        filePath,
        status: "error",
        message: `JSON validation failed: ${errors.join(", ")}`,
      };
    }

    modelData = modelValidation;
    versionData = versionValidation;
  } catch (error) {
    console.error(`[SCAN]   ✗ JSON file error: ${error}`);
    return {
      filePath,
      status: "error",
      message: `JSON file error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  // Insert into database
  try {
    await upsertOneModelVersion(modelData, versionData, {
      checkFileExistence: true,
      basePath,
    });

    console.log(
      `[SCAN]   ✓ Added to database (Model ID: ${modelInfo.modelId}, Version ID: ${modelInfo.versionId})`,
    );

    return {
      filePath,
      status: "added",
      message: `Added model ${modelInfo.modelId}, version ${modelInfo.versionId} to database`,
    };
  } catch (error) {
    console.error(`[SCAN]   ✗ Error adding to database: ${error}`);
    return {
      filePath,
      status: "error",
      message: `Error adding to database: ${error instanceof Error ? error.message : String(error)}`,
    };
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

/**
 * Perform consistency check on all model versions in database
 * @returns Promise<Result<ConsistencyCheckResult[], ScanError>>
 */
export async function performConsistencyCheckWithNeverthrow(): Promise<
  Result<ConsistencyCheckResult[], ScanError>
> {
  try {
    const settings = settingsService.getSettings();
    const basePath = settings.basePath;

    // Get all model versions from database
    const { prisma } = await import("../../db/service");

    const allModelVersions = await prisma.modelVersion.findMany({
      include: {
        model: true,
        files: true,
        images: true,
        baseModel: true,
        baseModelType: true,
      },
    });

    const results: ConsistencyCheckResult[] = [];

    for (const dbModelVersion of allModelVersions) {
      const modelJson = dbModelVersion.model.json as Model;
      const modelType = modelJson.type;
      const modelId = dbModelVersion.model.id;
      const versionId = dbModelVersion.id;

      try {
        const checkResult = await checkSingleModelVersionConsistency(
          basePath,
          modelType,
          modelId,
          versionId,
          dbModelVersion,
        );
        results.push(checkResult);
      } catch (error) {
        console.error(
          `Consistency check failed for model ${modelId} version ${versionId}:`,
          error,
        );
        results.push({
          modelId,
          versionId,
          missingFiles: [
            `Error: ${error instanceof Error ? error.message : String(error)}`,
          ],
          extraFiles: [],
          jsonValid: false,
          databaseRecordExists: true,
        });
      }
    }

    return ok(results);
  } catch (error) {
    console.error("[CONSISTENCY CHECK] Error during check:", error);
    return err(
      new ScanError(
        `Consistency check error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        "consistency-check",
      ),
    );
  }
}

/**
 * Check consistency for a single model version
 */
async function checkSingleModelVersionConsistency(
  basePath: string,
  modelType: string,
  modelId: number,
  versionId: number,
  dbModelVersion: typeof ModelVersionRelations.static,
): Promise<ConsistencyCheckResult> {
  const result: ConsistencyCheckResult = {
    modelId,
    versionId,
    missingFiles: [],
    extraFiles: [],
    jsonValid: false,
    databaseRecordExists: true,
  };

  // Check JSON files exist
  const { getModelIdApiInfoJsonPath, getModelVersionApiInfoJsonPath } =
    await import("./file-layout");
  const { ModelLayout } = await import("./file-layout");
  const { modelSchema, modelVersionSchema } = await import(
    "#civitai-api/v1/models"
  );
  const { type } = await import("arktype");

  const modelJsonPath = getModelIdApiInfoJsonPath(basePath, modelType, modelId);
  const versionJsonPath = getModelVersionApiInfoJsonPath(
    basePath,
    modelType,
    modelId,
    versionId,
  );

  const [modelJsonExists, versionJsonExists] = await Promise.all([
    checkFileExistsSafe(modelJsonPath),
    checkFileExistsSafe(versionJsonPath),
  ]);

  if (!modelJsonExists || !versionJsonExists) {
    if (!modelJsonExists)
      result.missingFiles = [
        ...result.missingFiles,
        `Model JSON: ${modelJsonPath}`,
      ];
    if (!versionJsonExists)
      result.missingFiles = [
        ...result.missingFiles,
        `Version JSON: ${versionJsonPath}`,
      ];
    return result;
  }

  // Try to parse JSON files
  try {
    const modelContent = await Bun.file(modelJsonPath).json();
    const versionContent = await Bun.file(versionJsonPath).json();

    const modelValidation = modelSchema(modelContent);
    const versionValidation = modelVersionSchema(versionContent);

    if (
      modelValidation instanceof type.errors ||
      versionValidation instanceof type.errors
    ) {
      result.missingFiles = [...result.missingFiles, "JSON parsing error"];
      return result;
    }

    const modelData = modelValidation;
    const versionData = versionValidation;
    result.jsonValid = true;

    // Check file existence on disk
    const modelLayout = new ModelLayout(basePath, modelData);
    const existenceStatus =
      await modelLayout.checkVersionFilesAndImagesExistence(versionId);

    // Compare with database records
    const dbFiles = dbModelVersion.files || [];
    const dbImages = dbModelVersion.images || [];

    // Check for missing files
    for (const file of versionData.files) {
      const existsOnDisk = existenceStatus.files.some(
        (f) => f.id === file.id && f.exists,
      );
      const existsInDb = dbFiles.some((f) => f.id === file.id);

      if (!existsOnDisk && existsInDb) {
        result.missingFiles = [
          ...result.missingFiles,
          `File: ${file.name} (ID: ${file.id})`,
        ];
      }
    }

    // Check for extra files in database that don't exist in JSON
    for (const dbFile of dbFiles) {
      const existsInJson = versionData.files.some((f) => f.id === dbFile.id);
      if (!existsInJson) {
        result.extraFiles = [
          ...result.extraFiles,
          `Extra file in DB: ${dbFile.name} (ID: ${dbFile.id})`,
        ];
      }
    }
  } catch (error) {
    result.jsonValid = false;
    result.missingFiles = [
      ...result.missingFiles,
      `JSON parsing error: ${error instanceof Error ? error.message : String(error)}`,
    ];
  }

  return result;
}

/**
 * Repair database records for model versions with consistency issues
 * @returns Promise<Result<{ repaired: number; failed: number; total: number }, ScanError>>
 */
export async function repairDatabaseRecordsWithNeverthrow(): Promise<
  Result<{ repaired: number; failed: number; total: number }, ScanError>
> {
  try {
    const consistencyResults = await performConsistencyCheckWithNeverthrow();
    if (consistencyResults.isErr()) {
      return err(consistencyResults.error);
    }

    const settings = settingsService.getSettings();
    const basePath = settings.basePath;

    let repaired = 0;
    let failed = 0;

    for (const result of consistencyResults.value) {
      if (!result.jsonValid || result.missingFiles.length > 0) {
        try {
          // Try to read JSON files and re-insert
          const { getModelIdApiInfoJsonPath, getModelVersionApiInfoJsonPath } =
            await import("./file-layout");
          const { upsertOneModelVersion } = await import(
            "../../db/crud/modelVersion"
          );
          const { modelSchema, modelVersionSchema } = await import(
            "#civitai-api/v1/models"
          );
          const { type } = await import("arktype");

          const modelJsonPath = getModelIdApiInfoJsonPath(
            basePath,
            "Checkpoint",
            result.modelId,
          );
          const versionJsonPath = getModelVersionApiInfoJsonPath(
            basePath,
            "Checkpoint",
            result.modelId,
            result.versionId,
          );

          const modelContent = await Bun.file(modelJsonPath).json();
          const versionContent = await Bun.file(versionJsonPath).json();

          const modelValidation = modelSchema(modelContent);
          const versionValidation = modelVersionSchema(versionContent);

          if (
            modelValidation instanceof type.errors ||
            versionValidation instanceof type.errors
          ) {
            throw new Error("JSON validation failed");
          }

          const modelData = modelValidation;
          const versionData = versionValidation;

          // Re-insert into database
          await upsertOneModelVersion(modelData, versionData, {
            checkFileExistence: true,
            basePath,
          });

          repaired++;
        } catch (error) {
          console.error(
            `Failed to repair model ${result.modelId} version ${result.versionId}:`,
            error,
          );
          failed++;
        }
      }
    }

    return ok({
      repaired,
      failed,
      total: consistencyResults.value.length,
    });
  } catch (error) {
    console.error("[DATABASE REPAIR] Error during repair:", error);
    return err(
      new ScanError(
        `Database repair error: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        "database-repair",
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
