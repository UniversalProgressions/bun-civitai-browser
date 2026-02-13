import { join } from "node:path";
import type { TaskStatus, Task, CreateTaskWithRequest } from "@gopeed/types";
import { Client, ApiError } from "@gopeed/rest";
import { err, ok, Result } from "neverthrow";
import { prisma } from "#modules/db/service";
import type {
  ModelVersion,
  Model,
  ModelTypes,
  ModelFile,
} from "#civitai-api/v1/models";
import type { ModelImageWithId } from "#civitai-api/v1/models/models";
import { extractFilenameFromUrl } from "#civitai-api/v1/utils";
import { getSettings } from "#modules/settings/service";
import type { Settings } from "#modules/settings/model";
import { getMediaDir } from "#modules/local-models/service/file-layout";
import { GopeedTaskPlain } from "#generated/typebox/GopeedTask";

type GopeedTaskPlain = typeof GopeedTaskPlain.static;

export class GopeedServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export interface IGopeedService {
  getModelVersionTasks(mvid: number): Promise<Result<Array<Task>, ApiError>>;
  stopModelVersionTasks(mvid: number): Promise<Result<true, ApiError>>;
  resumeModelVersionTasks(mvid: number): Promise<Result<true, ApiError>>;
  deleteModelVersionTasks(mvid: number): Promise<Result<true, ApiError>>;
  createModelVersionTasks(
    settings: Settings,
    type: ModelTypes,
    mid: number,
    mv: ModelVersion,
  ): Promise<Array<Result<GopeedTaskPlain, GopeedServiceError | ApiError>>>;

  getTask(taskId: string): Promise<Result<Task, ApiError>>;
  pauseTask(taskId: string): Promise<Result<true, ApiError>>;
  continueTask(taskId: string): Promise<Result<true, ApiError>>;
  deleteTask(taskId: string): Promise<Result<true, ApiError>>;
  createMediaTask(
    settings: Settings,
    type: ModelTypes,
    mid: number,
    mv: ModelVersion,
    image: ModelImageWithId,
  ): Promise<Result<GopeedTaskPlain, GopeedServiceError | ApiError>>;
  createFileTask(
    settings: Settings,
    type: ModelTypes,
    mid: number,
    mv: ModelVersion,
    file: ModelFile,
  ): Promise<Result<GopeedTaskPlain, GopeedServiceError | ApiError>>;
}

export class GopeedService implements IGopeedService {
  public client: Client;
  constructor({ host, token = "" }: { host: string; token: string }) {
    this.client = new Client({ host, token });
  }
  getModelVersionTasks(mvid: number): Promise<Result<Array<Task>, ApiError>> {
    throw new Error("Method not implemented.");
  }
  stopModelVersionTasks(mvid: number): Promise<Result<true, ApiError>> {
    throw new Error("Method not implemented.");
  }
  resumeModelVersionTasks(mvid: number): Promise<Result<true, ApiError>> {
    throw new Error("Method not implemented.");
  }
  deleteModelVersionTasks(mvid: number): Promise<Result<true, ApiError>> {
    throw new Error("Method not implemented.");
  }
  async createModelVersionTasks(
    settings: Settings,
    type: ModelTypes,
    mid: number,
    mv: ModelVersion,
  ): Promise<Array<Result<GopeedTaskPlain, GopeedServiceError | ApiError>>> {
    const reqs: Array<
      Promise<Result<GopeedTaskPlain, GopeedServiceError | ApiError>>
    > = [];
    // 1. create images tasks object
    mv.images.forEach((image) => {
      reqs.push(this.createMediaTask(settings, type, mid, mv, image));
    });
    // 2. create files tasks object
    mv.files.forEach((file) => {
      reqs.push(this.createFileTask(settings, type, mid, mv, file));
    });
    // 3. push tasks to gopeed
    return await Promise.all(reqs);
  }
  async getTask(taskId: string): Promise<Result<Task, ApiError>> {
    try {
      return ok(await this.client.getTask(taskId));
    } catch (error) {
      return err(error as ApiError);
    }
  }
  async pauseTask(taskId: string): Promise<Result<true, ApiError>> {
    try {
      await this.client.pauseTask(taskId);
      return ok(true);
    } catch (error) {
      return err(error as ApiError);
    }
  }
  async continueTask(taskId: string): Promise<Result<true, ApiError>> {
    try {
      await this.client.continueTask(taskId);
      return ok(true);
    } catch (error) {
      return err(error as ApiError);
    }
  }
  async deleteTask(
    taskId: string,
    force: boolean = false,
  ): Promise<Result<true, ApiError>> {
    try {
      await this.client.deleteTask(taskId, force);
      return ok(true);
    } catch (error) {
      return err(error as ApiError);
    }
  }
  /**
   * Create a Gopeed download task.
   * @param task - The option of a Gopeed task.
   * @returns The Result type which contains a string of Gopeed task id if success.
   */
  async createMediaTask(
    settings: Settings,
    type: ModelTypes,
    mid: number,
    mv: ModelVersion,
    image: ModelImageWithId,
  ): Promise<Result<GopeedTaskPlain, GopeedServiceError | ApiError>> {
    const fileNameResult = extractFilenameFromUrl(image.url);
    if (fileNameResult.isErr())
      return err(new GopeedServiceError(fileNameResult.error.message));

    const taskOpts: CreateTaskWithRequest = {
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
        name: fileNameResult.value,
        path: getMediaDir(settings.basePath, type, mid, mv.id),
      },
    };
    const task = await createGopeedTask(this.client, taskOpts, image.id);
    if (task.isErr()) {
      return err(task.error);
    }
    const record = await prisma.gopeedTask.create({
      data: {
        id: task.value,
        isFinished: false,
        fileId: image.id,
        isMedia: true,
        modelVersionId: mv.id,
      },
    });
    return ok(record);
  }
  async createFileTask(
    settings: Settings,
    type: ModelTypes,
    mid: number,
    mv: ModelVersion,
    file: ModelFile,
  ): Promise<Result<GopeedTaskPlain, GopeedServiceError | ApiError>> {
    const taskOpts: CreateTaskWithRequest = {
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
    };
    const task = await createGopeedTask(this.client, taskOpts, file.id);
    if (task.isErr()) {
      return err(task.error);
    }
    const record = await prisma.gopeedTask.create({
      data: {
        id: task.value,
        isFinished: false,
        fileId: file.id,
        isMedia: true,
        modelVersionId: mv.id,
      },
    });
    return ok(record);
  }
}

export class TaskDuplicateError extends GopeedServiceError {
  public record: GopeedTaskPlain;
  constructor(message: string, record: GopeedTaskPlain) {
    super(message);
    this.record = record;
  }
}

export class TaskAlreadyFinishedError extends GopeedServiceError {
  constructor(message: string) {
    super(message);
  }
}

async function createGopeedTask(
  client: Client,
  taskOpts: CreateTaskWithRequest,
  fileId: number,
): Promise<Result<string, GopeedServiceError | ApiError>> {
  // 1. Is the file already existed?
  if (
    await Bun.file(join(taskOpts.opts?.path!, taskOpts.opts?.name!)).exists()
  ) {
    return err(
      new TaskAlreadyFinishedError(
        `the file ${taskOpts.opts?.name} has been downloaded on disk.`,
      ),
    );
  }
  // 2. If not, is this task already been created?
  const record = await prisma.gopeedTask.findFirst({
    where: {
      fileId,
    },
  });
  if (record) {
    return err(new TaskDuplicateError(`The task already existed!`, record));
  }
  // 3. if not, create the task.
  try {
    const task = await client.createTask(taskOpts);
    return ok(task);
  } catch (error) {
    console.log(`Failed to create the gopeed task with url: ${taskOpts}!`);
    return err(error as ApiError);
  }
}
