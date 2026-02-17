import { join } from "node:path";
import { readdir } from "node:fs/promises";
import { pathExists } from "path-exists";
import type { TaskStatus, Task, CreateTaskWithRequest } from "@gopeed/types";
import { Client, ApiError } from "@gopeed/rest";
import { err, ok, Result } from "neverthrow";
import { prisma } from "../db/service";
import type {
  ModelVersion,
  Model,
  ModelTypes,
  ModelFile,
} from "#civitai-api/v1/models";
import type { ModelImageWithId } from "#civitai-api/v1/models/models";
import { extractFilenameFromUrl } from "#civitai-api/v1/utils";
import type { Settings } from "../settings/model";
import { getMediaDir } from "../local-models/service/file-layout";
import { Data, Context, Effect, pipe } from "effect";

export class GopeedServiceError extends Data.Error<{ message: string }> {
  constructor(message: string) {
    super({ message });
  }
}

export class ModelVersionNotFoundError extends Data.Error<{ message: string }> {
  constructor(message: string) {
    super({ message });
  }
}

export class GopeedClient extends Context.Tag("GopeedClient")<
  GopeedClient,
  Client
>() {}

export class PrismaService extends Context.Tag("PrismaService")<
  PrismaService,
  typeof prisma
>() {}

export class SettingsContext extends Context.Tag("SettingsContext")<
  SettingsContext,
  Settings
>() {}

export class TaskDuplicateError extends Data.Error<{
  message: string;
  gopeedTaskId: string;
}> {
  constructor(message: string, gopeedTaskId: string) {
    super({ message, gopeedTaskId });
  }
}

export class TaskAlreadyFinishedError extends Data.Error<{ message: string }> {
  constructor(message: string) {
    super({ message });
  }
}

const checkFileExists = (path: string, name: string) =>
  pipe(
    Effect.tryPromise({
      try: () => Bun.file(join(path, name)).exists(),
      catch: (error) =>
        new GopeedServiceError(`Failed to check file existence: ${error}`),
    }),
    Effect.flatMap((exists) =>
      exists
        ? Effect.fail(
            new TaskAlreadyFinishedError(
              `the file ${name} has been downloaded on disk.`,
            ),
          )
        : Effect.succeed(true),
    ),
  );

const createTask = (taskOpts: CreateTaskWithRequest) =>
  pipe(
    GopeedClient,
    Effect.flatMap((client) =>
      Effect.tryPromise({
        try: () => client.createTask(taskOpts),
        catch: (error) => error as ApiError,
      }),
    ),
  );

export const createGopeedTaskEffect = (
  taskOpts: CreateTaskWithRequest,
  fileId: number,
  isMedia: boolean = false,
): Effect.Effect<
  string,
  GopeedServiceError | TaskDuplicateError | ApiError | TaskAlreadyFinishedError,
  PrismaService | GopeedClient
> => {
  const path = taskOpts.opts?.path;
  const name = taskOpts.opts?.name;

  if (!path || !name) {
    return Effect.fail(
      new GopeedServiceError("Task options must include path and name"),
    );
  }

  return pipe(
    checkFileExists(path, name),
    Effect.flatMap(() => checkTaskExists(fileId, isMedia)),
    Effect.flatMap(() => createTask(taskOpts)),
  );
};

// 兼容性函数：将Effect转换为Promise<Result>
export const createGopeedTask = (
  client: Client,
  taskOpts: CreateTaskWithRequest,
  fileId: number,
): Promise<Result<string, GopeedServiceError | ApiError>> => {
  // 注意：这里简化处理，实际需要更完整的实现
  // 为了保持兼容性，这里先抛出一个错误，提示使用新API
  return Promise.resolve(
    err(new GopeedServiceError("Please use createGopeedTaskEffect instead")),
  );
};

// Effect版本的createMediaTask
export const createMediaTaskEffect = (
  settings: Settings,
  type: ModelTypes,
  mid: number,
  mv: ModelVersion,
  image: ModelImageWithId,
): Effect.Effect<
  string,
  GopeedServiceError | TaskDuplicateError | ApiError | TaskAlreadyFinishedError,
  PrismaService | GopeedClient | SettingsContext
> => {
  const getFileName = pipe(
    Effect.try({
      try: () => extractFilenameFromUrl(image.url),
      catch: (error) =>
        new GopeedServiceError(`Failed to extract filename: ${error}`),
    }),
    Effect.flatMap((result) =>
      result.isErr()
        ? Effect.fail(new GopeedServiceError(result.error.message))
        : Effect.succeed(result.value),
    ),
  );

  const createTaskRecord = (taskId: string) =>
    pipe(
      PrismaService,
      Effect.flatMap((prisma) =>
        Effect.tryPromise({
          try: async () => {
            const record = await (prisma as any).modelVersionImage.update({
              where: { id: image.id },
              data: {
                gopeedTaskId: taskId,
                gopeedTaskFinished: false,
              },
            });
            return record as { gopeedTaskId: string };
          },
          catch: (error) =>
            new GopeedServiceError(`Failed to update image record: ${error}`),
        }),
      ),
      Effect.map((record) => record.gopeedTaskId),
    );

  return pipe(
    getFileName,
    Effect.map((fileName) => ({
      req: {
        url: image.url,
        extra: {
          header: {
            Authorization: `Bearer ${settings.civitai_api_token}`,
          },
        },
        labels: {
          CivitAI: `Media`,
        },
      },
      opts: {
        name: fileName,
        path: getMediaDir(settings.basePath, type, mid, mv.id),
      },
    })),
    Effect.flatMap((taskOpts) =>
      createGopeedTaskEffect(taskOpts, image.id, true),
    ),
    Effect.flatMap(createTaskRecord),
  );
};

// Effect版本的createFileTask
export const createFileTaskEffect = (
  settings: Settings,
  type: ModelTypes,
  mid: number,
  mv: ModelVersion,
  file: ModelFile,
): Effect.Effect<
  string,
  GopeedServiceError | TaskDuplicateError | ApiError | TaskAlreadyFinishedError,
  PrismaService | GopeedClient | SettingsContext
> => {
  const createTaskRecord = (taskId: string) =>
    pipe(
      PrismaService,
      Effect.flatMap((prisma) =>
        Effect.tryPromise({
          try: async () => {
            const record = await (prisma as any).modelVersionFile.update({
              where: { id: file.id },
              data: {
                gopeedTaskId: taskId,
                gopeedTaskFinished: false,
              },
            });
            return record as { gopeedTaskId: string };
          },
          catch: (error) =>
            new GopeedServiceError(`Failed to update file record: ${error}`),
        }),
      ),
      Effect.map((record) => record.gopeedTaskId),
    );

  return pipe(
    Effect.succeed({
      req: {
        url: file.downloadUrl,
        extra: {
          header: {
            Authorization: `Bearer ${settings.civitai_api_token}`,
          },
        },
        labels: {
          CivitAI: `Media`,
        },
      },
      opts: {
        name: file.name,
        path: getMediaDir(settings.basePath, type, mid, mv.id),
      },
    }),
    Effect.flatMap((taskOpts) =>
      createGopeedTaskEffect(taskOpts, file.id, false),
    ),
    Effect.flatMap(createTaskRecord),
  );
};

// Effect版本的简单方法
export const getTaskEffect = (taskId: string) =>
  pipe(
    GopeedClient,
    Effect.flatMap((client) =>
      Effect.tryPromise({
        try: () => client.getTask(taskId),
        catch: (error) => error as ApiError,
      }),
    ),
  );

export const pauseTaskEffect = (taskId: string) =>
  pipe(
    GopeedClient,
    Effect.flatMap((client) =>
      Effect.tryPromise({
        try: () => client.pauseTask(taskId),
        catch: (error) => error as ApiError,
      }),
    ),
    Effect.map(() => true as const),
  );

export const continueTaskEffect = (taskId: string) =>
  pipe(
    GopeedClient,
    Effect.flatMap((client) =>
      Effect.tryPromise({
        try: () => client.continueTask(taskId),
        catch: (error) => error as ApiError,
      }),
    ),
    Effect.map(() => true as const),
  );

export const deleteTaskEffect = (taskId: string, force: boolean = false) =>
  pipe(
    GopeedClient,
    Effect.flatMap((client) =>
      Effect.tryPromise({
        try: () => client.deleteTask(taskId, force),
        catch: (error) => error as ApiError,
      }),
    ),
    Effect.map(() => true as const),
  );

// 修复checkTaskExists中的类型问题
const checkTaskExists = (fileId: number, isMedia: boolean) => {
  const modelName = isMedia ? "modelVersionImage" : "modelVersionFile";
  return pipe(
    PrismaService,
    Effect.flatMap((prisma) =>
      Effect.tryPromise({
        try: async () => {
          const record = await (prisma as any)[modelName].findFirst({
            where: { id: fileId },
          });
          return record as { gopeedTaskId?: string } | null;
        },
        catch: (error) =>
          new GopeedServiceError(`Failed to check existing task: ${error}`),
      }),
    ),
    Effect.flatMap((existingTask) =>
      existingTask && existingTask.gopeedTaskId
        ? Effect.fail(
            new TaskDuplicateError(
              "The task already existed!",
              existingTask.gopeedTaskId,
            ),
          )
        : Effect.succeed(true),
    ),
  );
};
