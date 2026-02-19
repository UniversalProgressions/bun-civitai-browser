/**
 * 数据库模块错误类
 *
 * 使用新的统一错误系统，替代直接使用Error
 */
import {
  DatabaseError as BaseDatabaseError,
  ValidationError as BaseValidationError,
} from "../../utils/errors";

/**
 * 数据库连接错误
 */
export class DatabaseConnectionError extends BaseDatabaseError {
  static readonly NAME = "DatabaseConnectionError" as const;

  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message, cause);
    this.name = DatabaseConnectionError.NAME;
  }
}

/**
 * 数据库查询错误
 */
export class DatabaseQueryError extends BaseDatabaseError {
  static readonly NAME = "DatabaseQueryError" as const;

  constructor(
    message: string,
    public readonly query?: string,
    public readonly parameters?: any,
    public readonly cause?: unknown,
  ) {
    super(message, cause);
    this.name = DatabaseQueryError.NAME;
  }
}

/**
 * 数据库事务错误
 */
export class DatabaseTransactionError extends BaseDatabaseError {
  static readonly NAME = "DatabaseTransactionError" as const;

  constructor(
    message: string,
    public readonly operation?: string,
    public readonly cause?: unknown,
  ) {
    super(message, cause);
    this.name = DatabaseTransactionError.NAME;
  }
}

/**
 * 记录未找到错误
 */
export class RecordNotFoundError extends BaseDatabaseError {
  static readonly NAME = "RecordNotFoundError" as const;

  constructor(
    message: string,
    public readonly table?: string,
    public readonly id?: number | string,
  ) {
    super(message);
    this.name = RecordNotFoundError.NAME;
  }
}

/**
 * 记录已存在错误
 */
export class RecordAlreadyExistsError extends BaseDatabaseError {
  static readonly NAME = "RecordAlreadyExistsError" as const;

  constructor(
    message: string,
    public readonly table?: string,
    public readonly uniqueFields?: Record<string, any>,
  ) {
    super(message);
    this.name = RecordAlreadyExistsError.NAME;
  }
}

/**
 * 数据库约束错误
 */
export class DatabaseConstraintError extends BaseDatabaseError {
  static readonly NAME = "DatabaseConstraintError" as const;

  constructor(
    message: string,
    public readonly constraint?: string,
    public readonly table?: string,
    public readonly cause?: unknown,
  ) {
    super(message, cause);
    this.name = DatabaseConstraintError.NAME;
  }
}

/**
 * 模型验证错误
 */
export class ModelValidationError extends BaseValidationError {
  static readonly NAME = "ModelValidationError" as const;

  constructor(
    message: string,
    public readonly validationErrors: any,
    public readonly modelData?: any,
  ) {
    super(message);
    this.name = ModelValidationError.NAME;
  }
}

/**
 * 模型版本未找到错误
 */
export class ModelVersionNotFoundError extends BaseDatabaseError {
  static readonly NAME = "ModelVersionNotFoundError" as const;

  constructor(
    message: string,
    public readonly modelId?: number,
    public readonly modelVersionId?: number,
  ) {
    super(message);
    this.name = ModelVersionNotFoundError.NAME;
  }
}

/**
 * 模型未找到错误
 */
export class ModelNotFoundError extends BaseDatabaseError {
  static readonly NAME = "ModelNotFoundError" as const;

  constructor(
    message: string,
    public readonly modelId?: number,
    public readonly criteria?: Record<string, any>,
  ) {
    super(message);
    this.name = ModelNotFoundError.NAME;
  }
}

/**
 * 文件记录未找到错误
 */
export class FileRecordNotFoundError extends BaseDatabaseError {
  static readonly NAME = "FileRecordNotFoundError" as const;

  constructor(
    message: string,
    public readonly fileId?: number,
    public readonly modelVersionId?: number,
  ) {
    super(message);
    this.name = FileRecordNotFoundError.NAME;
  }
}

/**
 * 图片记录未找到错误
 */
export class ImageRecordNotFoundError extends BaseDatabaseError {
  static readonly NAME = "ImageRecordNotFoundError" as const;

  constructor(
    message: string,
    public readonly imageId?: number,
    public readonly modelVersionId?: number,
  ) {
    super(message);
    this.name = ImageRecordNotFoundError.NAME;
  }
}

/**
 * 批量操作错误
 */
export class BatchOperationError extends BaseDatabaseError {
  static readonly NAME = "BatchOperationError" as const;

  constructor(
    message: string,
    public readonly successful: number,
    public readonly failed: number,
    public readonly errors: Array<{ index: number; error: any }>,
  ) {
    super(message);
    this.name = BatchOperationError.NAME;
  }
}

/**
 * 数据库迁移错误
 */
export class DatabaseMigrationError extends BaseDatabaseError {
  static readonly NAME = "DatabaseMigrationError" as const;

  constructor(
    message: string,
    public readonly migration?: string,
    public readonly cause?: unknown,
  ) {
    super(message, cause);
    this.name = DatabaseMigrationError.NAME;
  }
}

/**
 * 数据库完整性错误
 */
export class DatabaseIntegrityError extends BaseDatabaseError {
  static readonly NAME = "DatabaseIntegrityError" as const;

  constructor(
    message: string,
    public readonly issue: string,
    public readonly affectedRecords?: any[],
  ) {
    super(message);
    this.name = DatabaseIntegrityError.NAME;
  }
}

/**
 * Prisma客户端错误
 */
export class PrismaClientError extends BaseDatabaseError {
  static readonly NAME = "PrismaClientError" as const;

  constructor(
    message: string,
    public readonly prismaCode?: string,
    public readonly meta?: any,
    public readonly cause?: unknown,
  ) {
    super(message, cause);
    this.name = PrismaClientError.NAME;
  }
}
