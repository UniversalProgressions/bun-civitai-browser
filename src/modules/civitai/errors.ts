/**
 * Civitai模块错误类
 *
 * 使用新的统一错误系统，替代现有的错误处理方式
 */
import { ExternalServiceError, ServiceError } from "../../utils/errors";

/**
 * Civitai API通用错误
 */
export class CivitaiApiError extends ServiceError {
  static readonly NAME = "CivitaiApiError" as const;

  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: any,
  ) {
    super(message);
    this.name = CivitaiApiError.NAME;
  }
}

/**
 * Civitai验证错误（ArkType验证失败）
 */
export class CivitaiValidationError extends ServiceError {
  static readonly NAME = "CivitaiValidationError" as const;

  constructor(
    message: string,
    public readonly arkSummary: string,
    public readonly validationDetails: any,
  ) {
    super(message);
    this.name = CivitaiValidationError.NAME;
  }
}

/**
 * 外部服务错误（Gopeed等服务错误）
 */
export class CivitaiExternalServiceError extends ExternalServiceError {
  static readonly NAME = "CivitaiExternalServiceError" as const;

  constructor(message: string) {
    super(message);
    this.name = CivitaiExternalServiceError.NAME;
  }
}

/**
 * Gopeed主机未指定错误
 */
export class GopeedHostNotSpecifiedError extends ServiceError {
  static readonly NAME = "GopeedHostNotSpecifiedError" as const;

  constructor(message: string) {
    super(message);
    this.name = GopeedHostNotSpecifiedError.NAME;
  }
}

/**
 * Civitai网络错误
 */
export class CivitaiNetworkError extends ServiceError {
  static readonly NAME = "CivitaiNetworkError" as const;

  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = CivitaiNetworkError.NAME;
  }
}

/**
 * Civitai请求错误（400 Bad Request）
 */
export class CivitaiBadRequestError extends ServiceError {
  static readonly NAME = "CivitaiBadRequestError" as const;

  constructor(
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = CivitaiBadRequestError.NAME;
  }
}

/**
 * Civitai未授权错误（401 Unauthorized）
 */
export class CivitaiUnauthorizedError extends ServiceError {
  static readonly NAME = "CivitaiUnauthorizedError" as const;

  constructor(
    message: string,
    public readonly details?: { suggestion?: string },
  ) {
    super(message);
    this.name = CivitaiUnauthorizedError.NAME;
  }
}

/**
 * Civitai未找到错误（404 Not Found）
 */
export class CivitaiNotFoundError extends ServiceError {
  static readonly NAME = "CivitaiNotFoundError" as const;

  constructor(
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = CivitaiNotFoundError.NAME;
  }
}

/**
 * Civitai下载错误
 */
export class CivitaiDownloadError extends ServiceError {
  static readonly NAME = "CivitaiDownloadError" as const;

  constructor(
    message: string,
    public readonly modelId?: number,
    public readonly modelVersionId?: number,
    public readonly fileId?: number,
  ) {
    super(message);
    this.name = CivitaiDownloadError.NAME;
  }
}

/**
 * Civitai文件处理错误
 */
export class CivitaiFileProcessingError extends ServiceError {
  static readonly NAME = "CivitaiFileProcessingError" as const;

  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly operation?: string,
  ) {
    super(message);
    this.name = CivitaiFileProcessingError.NAME;
  }
}

/**
 * 模型版本未找到错误
 */
export class ModelVersionNotFoundError extends ServiceError {
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
 * 模型文件已存在错误
 */
export class ModelFileAlreadyExistsError extends ServiceError {
  static readonly NAME = "ModelFileAlreadyExistsError" as const;

  constructor(
    message: string,
    public readonly filePath: string,
    public readonly modelId?: number,
  ) {
    super(message);
    this.name = ModelFileAlreadyExistsError.NAME;
  }
}

/**
 * 媒体文件处理错误
 */
export class MediaProcessingError extends ServiceError {
  static readonly NAME = "MediaProcessingError" as const;

  constructor(
    message: string,
    public readonly mediaIndex?: number,
    public readonly url?: string,
  ) {
    super(message);
    this.name = MediaProcessingError.NAME;
  }
}
