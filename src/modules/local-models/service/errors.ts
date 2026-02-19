/**
 * 本地模型服务错误类
 *
 * 使用新的统一错误系统，替代Effect Schema.TaggedError
 */
import {
  FileSystemError,
  ValidationError as BaseValidationError,
  DatabaseError as BaseDatabaseError,
  ServiceError,
} from "../../../utils/errors";

/**
 * 扫描文件错误
 */
export class ScanFileError extends FileSystemError {
  static readonly NAME = "ScanFileError" as const;

  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: string,
  ) {
    super(message);
    this.name = ScanFileError.NAME;
  }
}

/**
 * JSON解析错误
 */
export class JsonParseError extends BaseValidationError {
  static readonly NAME = "JsonParseError" as const;

  constructor(
    message: string,
    public readonly filePath: string,
    public readonly validationErrors: string,
  ) {
    super(message);
    this.name = JsonParseError.NAME;
  }
}

/**
 * 数据库插入错误
 */
export class DatabaseInsertError extends BaseDatabaseError {
  static readonly NAME = "DatabaseInsertError" as const;

  constructor(
    message: string,
    public readonly modelId: number,
    public readonly versionId: number,
    public readonly cause?: string,
  ) {
    super(message);
    this.name = DatabaseInsertError.NAME;
  }
}

/**
 * 文件未找到错误
 */
export class FileNotFoundError extends FileSystemError {
  static readonly NAME = "FileNotFoundError" as const;

  constructor(
    message: string,
    public readonly filePath: string,
  ) {
    super(message);
    this.name = FileNotFoundError.NAME;
  }
}

/**
 * 目录结构错误
 */
export class DirectoryStructureError extends FileSystemError {
  static readonly NAME = "DirectoryStructureError" as const;

  constructor(
    message: string,
    public readonly filePath: string,
    public readonly expectedPattern: string,
  ) {
    super(message);
    this.name = DirectoryStructureError.NAME;
  }
}

/**
 * 哈希不匹配错误
 */
export class HashMismatchError extends FileSystemError {
  static readonly NAME = "HashMismatchError" as const;

  constructor(
    message: string,
    public readonly filePath: string,
    public readonly expectedHash: string,
    public readonly actualHash: string,
  ) {
    super(message);
    this.name = HashMismatchError.NAME;
  }
}

/**
 * 数据库一致性错误
 */
export class DatabaseConsistencyError extends BaseDatabaseError {
  static readonly NAME = "DatabaseConsistencyError" as const;

  constructor(
    message: string,
    public readonly modelId: number,
    public readonly versionId: number,
    public readonly missingFiles: string[],
    public readonly extraFiles: string[],
  ) {
    super(message);
    this.name = DatabaseConsistencyError.NAME;
  }
}

/**
 * 扫描中断错误
 */
export class ScanInterruptedError extends ServiceError {
  static readonly NAME = "ScanInterruptedError" as const;

  constructor(
    message: string,
    public readonly processedFiles: number,
    public readonly totalFiles: number,
  ) {
    super(message);
    this.name = ScanInterruptedError.NAME;
  }
}

/**
 * 恢复错误
 */
export class RecoveryError extends ServiceError {
  static readonly NAME = "RecoveryError" as const;

  constructor(
    message: string,
    public readonly operation: string,
    public readonly failedItems: string[],
  ) {
    super(message);
    this.name = RecoveryError.NAME;
  }
}
