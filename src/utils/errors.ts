/**
 * 统一错误基类和分类系统
 *
 * 设计原则：
 * 1. 所有错误类都有自动设置的name属性（通过this.constructor.name）
 * 2. 清晰的分类层级，便于错误处理和识别
 * 3. 保持向后兼容性，不影响现有代码
 * 4. 无需额外的序列化方法（按用户要求）
 * 5. 不使用arktype验证（按用户要求）
 */

// ============================================================================
// 核心错误基类
// ============================================================================

/**
 * 应用程序错误基类
 *
 * 所有自定义错误都应继承此类。
 * name属性会自动设置为构造函数名。
 */
export abstract class AppError extends Error {
  /**
   * 创建应用程序错误
   *
   * 注意：子类应在构造函数中显式设置name属性以获取最佳性能。
   * 推荐使用静态属性模式：
   *   static readonly NAME = "ClassName" as const;
   *   this.name = ClassName.NAME;
   *
   * @param message 错误消息
   * @param cause 原始错误原因（可选）
   * @param context 错误上下文信息（可选）
   */
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    // 子类应显式设置name属性以获得最佳性能
    // 这里不自动设置，避免覆盖子类的设置
  }
}

// ============================================================================
// 主要错误分类
// ============================================================================

/**
 * 领域错误 - 与业务逻辑相关的错误
 */
export abstract class DomainError extends AppError {}

/**
 * 服务错误 - 服务层操作相关的错误
 */
export abstract class ServiceError extends AppError {}

/**
 * 基础设施错误 - 基础设施相关的错误（网络、数据库、文件系统等）
 */
export abstract class InfrastructureError extends AppError {}

// ============================================================================
// 具体错误类别
// ============================================================================

/**
 * 验证错误 - 数据验证失败
 */
export abstract class ValidationError extends AppError {}

/**
 * 网络错误 - 网络请求相关错误
 */
export abstract class NetworkError extends AppError {}

/**
 * 数据库错误 - 数据库操作相关错误
 */
export abstract class DatabaseError extends AppError {}

/**
 * 文件系统错误 - 文件操作相关错误
 */
export abstract class FileSystemError extends AppError {}

/**
 * 配置错误 - 配置相关错误
 */
export abstract class ConfigurationError extends AppError {}

/**
 * 安全错误 - 安全相关错误
 */
export abstract class SecurityError extends AppError {}

/**
 * 外部服务错误 - 第三方服务相关错误
 */
export abstract class ExternalServiceError extends AppError {}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 检查错误是否为特定类型的错误
 */
export function isErrorOfType<T extends AppError>(
  error: unknown,
  errorType: new (...args: any[]) => T,
): error is T {
  return error instanceof errorType;
}

/**
 * 安全地获取错误消息
 *
 * 如果错误是AppError或其子类，返回其消息；
 * 否则返回默认消息或错误的字符串表示。
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = "An unknown error occurred",
): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}

/**
 * 安全地获取错误名称
 */
export function getErrorName(error: unknown): string {
  if (error instanceof AppError) {
    return error.name;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return "UnknownError";
}
