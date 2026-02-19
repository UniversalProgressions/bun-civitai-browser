/**
 * Gopeed模块错误类
 *
 * 使用新的统一错误系统，替代Effect Data.Error
 */
import { ServiceError } from "../../utils/errors";

/**
 * Gopeed服务通用错误
 */
export class GopeedServiceError extends ServiceError {
  static readonly NAME = "GopeedServiceError" as const;

  constructor(message: string) {
    super(message);
    this.name = GopeedServiceError.NAME;
  }
}

/**
 * 模型版本未找到错误
 */
export class ModelVersionNotFoundError extends ServiceError {
  static readonly NAME = "ModelVersionNotFoundError" as const;

  constructor(message: string) {
    super(message);
    this.name = ModelVersionNotFoundError.NAME;
  }
}

/**
 * 任务重复错误（任务已存在）
 */
export class TaskDuplicateError extends ServiceError {
  static readonly NAME = "TaskDuplicateError" as const;

  constructor(
    message: string,
    public readonly gopeedTaskId: string,
  ) {
    super(message);
    this.name = TaskDuplicateError.NAME;
  }
}

/**
 * 任务已完成错误（文件已下载）
 */
export class TaskAlreadyFinishedError extends ServiceError {
  static readonly NAME = "TaskAlreadyFinishedError" as const;

  constructor(message: string) {
    super(message);
    this.name = TaskAlreadyFinishedError.NAME;
  }
}

/**
 * Gopeed任务状态枚举
 */
export enum GopeedTaskStatus {
  FAILED = "FAILED",
  CREATED = "CREATED",
  FINISHED = "FINISHED",
  CLEANED = "CLEANED",
}

/**
 * 根据数据库字段判断Gopeed任务状态
 */
export function getGopeedTaskStatus(
  gopeedTaskId: string | null,
  gopeedTaskFinished: boolean,
  gopeedTaskDeleted: boolean,
): GopeedTaskStatus {
  if (gopeedTaskId === null) {
    return GopeedTaskStatus.FAILED;
  }
  if (!gopeedTaskFinished) {
    return GopeedTaskStatus.CREATED;
  }
  if (!gopeedTaskDeleted) {
    return GopeedTaskStatus.FINISHED;
  }
  return GopeedTaskStatus.CLEANED;
}
