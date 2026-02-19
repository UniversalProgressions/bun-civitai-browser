import { Schema } from "effect";

export class ScanFileError extends Schema.TaggedError<ScanFileError>()(
  "ScanFileError",
  {
    filePath: Schema.String,
    message: Schema.String,
    cause: Schema.optional(Schema.String),
  },
) {}

export class JsonParseError extends Schema.TaggedError<JsonParseError>()(
  "JsonParseError",
  {
    filePath: Schema.String,
    message: Schema.String,
    validationErrors: Schema.String,
  },
) {}

export class DatabaseInsertError extends Schema.TaggedError<DatabaseInsertError>()(
  "DatabaseInsertError",
  {
    modelId: Schema.Number,
    versionId: Schema.Number,
    message: Schema.String,
    cause: Schema.optional(Schema.String),
  },
) {}

export class FileNotFoundError extends Schema.TaggedError<FileNotFoundError>()(
  "FileNotFoundError",
  {
    filePath: Schema.String,
    message: Schema.String,
  },
) {}

export class DirectoryStructureError extends Schema.TaggedError<DirectoryStructureError>()(
  "DirectoryStructureError",
  {
    filePath: Schema.String,
    expectedPattern: Schema.String,
    message: Schema.String,
  },
) {}

export class HashMismatchError extends Schema.TaggedError<HashMismatchError>()(
  "HashMismatchError",
  {
    filePath: Schema.String,
    expectedHash: Schema.String,
    actualHash: Schema.String,
    message: Schema.String,
  },
) {}

export class DatabaseConsistencyError extends Schema.TaggedError<DatabaseConsistencyError>()(
  "DatabaseConsistencyError",
  {
    modelId: Schema.Number,
    versionId: Schema.Number,
    message: Schema.String,
    missingFiles: Schema.Array(Schema.String),
    extraFiles: Schema.Array(Schema.String),
  },
) {}

export class ScanInterruptedError extends Schema.TaggedError<ScanInterruptedError>()(
  "ScanInterruptedError",
  {
    message: Schema.String,
    processedFiles: Schema.Number,
    totalFiles: Schema.Number,
  },
) {}

export class RecoveryError extends Schema.TaggedError<RecoveryError>()(
  "RecoveryError",
  {
    operation: Schema.String,
    message: Schema.String,
    failedItems: Schema.Array(Schema.String),
  },
) {}
