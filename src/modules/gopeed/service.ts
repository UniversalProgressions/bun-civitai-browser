/**
 * Gopeed服务模块 - 使用neverthrow重构版本
 *
 * 完全移除了Effect-TS依赖，使用neverthrow的Result类型
 */
import { join } from "node:path";
import type { CreateTaskWithRequest, Task } from "@gopeed/types";
import { type Client, ApiError } from "@gopeed/rest";
import { err, ok, type Result } from "neverthrow";
import type { prisma } from "../db/service";
import type {
  ModelVersion,
  ModelTypes,
  ModelFile,
} from "#civitai-api/v1/models";
import type { ModelImageWithId } from "#civitai-api/v1/models/models";
import { extractFilenameFromUrl } from "#civitai-api/v1/utils";
import type { Settings } from "../settings/model";
import { getMediaDir } from "../local-models/service/file-layout";
import {
  GopeedServiceError,
  ModelVersionNotFoundError,
  TaskDuplicateError,
  TaskAlreadyFinishedError,
  GopeedTaskStatus,
  getGopeedTaskStatus as getGopeedTaskStatusFunc,
} from "./errors";

// 导出错误类和枚举
export {
  GopeedServiceError,
  ModelVersionNotFoundError,
  TaskDuplicateError,
  TaskAlreadyFinishedError,
  GopeedTaskStatus,
  getGopeedTaskStatusFunc as getGopeedTaskStatus,
};

// 错误类型别名，用于简化函数签名
export type GopeedError =
  | GopeedServiceError
  | ModelVersionNotFoundError
  | TaskDuplicateError
  | TaskAlreadyFinishedError
  | ApiError;

/**
 * 检查文件是否已存在于磁盘上
 */
async function checkFileExists(
  path: string,
  name: string,
): Promise<Result<boolean, GopeedServiceError | TaskAlreadyFinishedError>> {
  try {
    const exists = await Bun.file(join(path, name)).exists();
    if (exists) {
      return err(
        new TaskAlreadyFinishedError(
          `the file ${name} has been downloaded on disk.`,
        ),
      );
    }
    return ok(true);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to check file existence: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 检查任务是否已存在于数据库中
 */
async function checkTaskExists(
  prismaClient: typeof prisma,
  fileId: number,
  isMedia: boolean,
): Promise<Result<boolean, GopeedServiceError | TaskDuplicateError>> {
  try {
    const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
    const record = await (prismaClient as any)[modelName].findFirst({
      where: { id: fileId },
    });

    if (record && record.gopeedTaskId) {
      return err(
        new TaskDuplicateError(
          "The task already existed!",
          record.gopeedTaskId,
        ),
      );
    }
    return ok(true);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to check existing task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 创建Gopeed任务 - 核心函数
 */
export async function createGopeedTask(
  client: Client,
  prismaClient: typeof prisma,
  taskOpts: CreateTaskWithRequest,
  fileId: number,
  isMedia: boolean = false,
): Promise<Result<string, GopeedError>> {
  const path = taskOpts.opts?.path;
  const name = taskOpts.opts?.name;

  if (!path || !name) {
    return err(
      new GopeedServiceError("Task options must include path and name"),
    );
  }

  // 检查文件是否已存在
  const fileExistsResult = await checkFileExists(path, name);
  if (fileExistsResult.isErr()) {
    return err(fileExistsResult.error);
  }

  // 检查任务是否已存在
  const taskExistsResult = await checkTaskExists(prismaClient, fileId, isMedia);
  if (taskExistsResult.isErr()) {
    return err(taskExistsResult.error);
  }

  // 创建任务
  try {
    const taskId = await client.createTask(taskOpts);
    return ok(taskId);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(error);
    }
    return err(
      new GopeedServiceError(
        `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 创建媒体（图片）下载任务
 */
export async function createMediaTask(
  client: Client,
  prismaClient: typeof prisma,
  settings: Settings,
  type: ModelTypes,
  mid: number,
  mv: ModelVersion,
  image: ModelImageWithId,
): Promise<Result<string, GopeedError>> {
  // 提取文件名
  const fileNameResult = extractFilenameFromUrl(image.url);
  if (fileNameResult.isErr()) {
    return err(
      new GopeedServiceError(
        `Failed to extract filename: ${fileNameResult.error.message}`,
      ),
    );
  }
  const fileName = fileNameResult.value;

  // 创建任务选项
  const taskOpts: CreateTaskWithRequest = {
    req: {
      url: image.url,
      extra: {
        header: {
          Authorization: `Bearer ${settings.civitai_api_token}`,
        },
      },
      labels: {
        CivitAI: "Media",
      },
    },
    opts: {
      name: fileName,
      path: getMediaDir(settings.basePath, type, mid, mv.id),
    },
  };

  // 创建任务
  const taskResult = await createGopeedTask(
    client,
    prismaClient,
    taskOpts,
    image.id,
    true,
  );
  if (taskResult.isErr()) {
    return err(taskResult.error);
  }
  const taskId = taskResult.value;

  // 更新数据库记录
  try {
    await prismaClient.modelVersionImage.update({
      where: { id: image.id },
      data: {
        gopeedTaskId: taskId,
        gopeedTaskFinished: false,
        gopeedTaskDeleted: false,
      },
    });
    return ok(taskId);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to update image record: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 创建文件下载任务
 */
export async function createFileTask(
  client: Client,
  prismaClient: typeof prisma,
  settings: Settings,
  type: ModelTypes,
  mid: number,
  mv: ModelVersion,
  file: ModelFile,
): Promise<Result<string, GopeedError>> {
  // 创建任务选项
  const taskOpts: CreateTaskWithRequest = {
    req: {
      url: file.downloadUrl,
      extra: {
        header: {
          Authorization: `Bearer ${settings.civitai_api_token}`,
        },
      },
      labels: {
        CivitAI: "Media",
      },
    },
    opts: {
      name: file.name,
      path: getMediaDir(settings.basePath, type, mid, mv.id),
    },
  };

  // 创建任务
  const taskResult = await createGopeedTask(
    client,
    prismaClient,
    taskOpts,
    file.id,
    false,
  );
  if (taskResult.isErr()) {
    return err(taskResult.error);
  }
  const taskId = taskResult.value;

  // 更新数据库记录
  try {
    await prismaClient.modelVersionFile.update({
      where: { id: file.id },
      data: {
        gopeedTaskId: taskId,
        gopeedTaskFinished: false,
        gopeedTaskDeleted: false,
      },
    });
    return ok(taskId);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to update file record: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 获取任务信息
 */
export async function getTask(
  client: Client,
  taskId: string,
): Promise<Result<Task, ApiError>> {
  try {
    const task = await client.getTask(taskId);
    return ok(task);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(error);
    }
    return err(
      new ApiError(
        500,
        `Failed to get task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 暂停任务
 */
export async function pauseTask(
  client: Client,
  taskId: string,
): Promise<Result<true, ApiError>> {
  try {
    await client.pauseTask(taskId);
    return ok(true);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(error);
    }
    return err(
      new ApiError(
        500,
        `Failed to pause task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 继续任务
 */
export async function continueTask(
  client: Client,
  taskId: string,
): Promise<Result<true, ApiError>> {
  try {
    await client.continueTask(taskId);
    return ok(true);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(error);
    }
    return err(
      new ApiError(
        500,
        `Failed to continue task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 取消任务（仅删除Gopeed任务，不删除文件）
 */
export async function cancelTask(
  client: Client,
  taskId: string,
): Promise<Result<true, ApiError>> {
  try {
    // 使用force=false仅删除Gopeed任务，不删除文件
    await client.deleteTask(taskId, false);
    return ok(true);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(error);
    }
    return err(
      new ApiError(
        500,
        `Failed to cancel task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 删除任务（可选的force参数）
 */
export async function deleteTask(
  client: Client,
  taskId: string,
  force: boolean = false,
): Promise<Result<true, ApiError>> {
  try {
    await client.deleteTask(taskId, force);
    return ok(true);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(error);
    }
    return err(
      new ApiError(
        500,
        `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 将任务标记为失败
 */
export async function updateTaskFailed(
  prismaClient: typeof prisma,
  fileId: number,
  isMedia: boolean,
): Promise<Result<void, GopeedServiceError>> {
  try {
    const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
    await (prismaClient as any)[modelName].update({
      where: { id: fileId },
      data: {
        gopeedTaskId: null,
        gopeedTaskFinished: false,
        gopeedTaskDeleted: false,
      },
    });
    return ok(undefined);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to update task as failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 将任务标记为已创建
 */
export async function updateTaskCreated(
  prismaClient: typeof prisma,
  fileId: number,
  taskId: string,
  isMedia: boolean,
): Promise<Result<void, GopeedServiceError>> {
  try {
    const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
    await (prismaClient as any)[modelName].update({
      where: { id: fileId },
      data: {
        gopeedTaskId: taskId,
        gopeedTaskFinished: false,
        gopeedTaskDeleted: false,
      },
    });
    return ok(undefined);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to update task as created: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 将任务标记为已完成
 */
export async function updateTaskFinished(
  prismaClient: typeof prisma,
  fileId: number,
  isMedia: boolean,
): Promise<Result<void, GopeedServiceError>> {
  try {
    const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
    await (prismaClient as any)[modelName].update({
      where: { id: fileId },
      data: {
        gopeedTaskFinished: true,
        gopeedTaskDeleted: false,
      },
    });
    return ok(undefined);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to update task as finished: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 将任务标记为已清理
 */
export async function updateTaskCleaned(
  prismaClient: typeof prisma,
  fileId: number,
  isMedia: boolean,
): Promise<Result<void, GopeedServiceError>> {
  try {
    const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
    await (prismaClient as any)[modelName].update({
      where: { id: fileId },
      data: {
        gopeedTaskDeleted: true,
      },
    });
    return ok(undefined);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to update task as cleaned: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 完成任务并清理Gopeed任务
 */
export async function finishAndCleanTask(
  client: Client,
  prismaClient: typeof prisma,
  taskId: string,
  fileId: number,
  isMedia: boolean,
  force: boolean = false,
): Promise<Result<void, GopeedServiceError | ApiError>> {
  // 删除Gopeed任务
  const deleteResult = await deleteTask(client, taskId, force);
  if (deleteResult.isErr()) {
    return err(deleteResult.error);
  }

  // 标记为已清理
  const cleanResult = await updateTaskCleaned(prismaClient, fileId, isMedia);
  if (cleanResult.isErr()) {
    return err(cleanResult.error);
  }

  return ok(undefined);
}

/**
 * 从数据库获取任务状态
 */
export async function getTaskStatusFromDb(
  prismaClient: typeof prisma,
  fileId: number,
  isMedia: boolean,
): Promise<Result<GopeedTaskStatus, GopeedServiceError>> {
  try {
    const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
    const record = await (prismaClient as any)[modelName].findUnique({
      where: { id: fileId },
      select: {
        gopeedTaskId: true,
        gopeedTaskFinished: true,
        gopeedTaskDeleted: true,
      },
    });

    if (!record) {
      return err(
        new GopeedServiceError(`Record not found for fileId: ${fileId}`),
      );
    }

    const status = getGopeedTaskStatusFunc(
      record.gopeedTaskId,
      record.gopeedTaskFinished,
      record.gopeedTaskDeleted,
    );
    return ok(status);
  } catch (error) {
    return err(
      new GopeedServiceError(
        `Failed to get task status: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * 旧的兼容函数（保持API兼容性）
 * @deprecated 请使用新的createGopeedTask函数
 */
export const createGopeedTaskLegacy = (
  client: Client,
  taskOpts: CreateTaskWithRequest,
  fileId: number,
): Promise<Result<string, GopeedServiceError | ApiError>> => {
  return Promise.resolve(
    err(new GopeedServiceError("Please use the new createGopeedTask function")),
  );
};
