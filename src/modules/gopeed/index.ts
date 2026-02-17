import { Elysia, t } from "elysia";
import { type } from "arktype";
import { Effect } from "effect";
import {
  GopeedServiceError,
  GopeedTaskStatus,
  getGopeedTaskStatus,
  getTaskEffect,
  pauseTaskEffect,
  continueTaskEffect,
  deleteTaskEffect,
  getTaskStatusFromDbEffect,
  finishAndCleanTaskEffect,
  createGopeedTaskEffect,
  updateTaskFailedEffect,
  updateTaskCreatedEffect,
  updateTaskFinishedEffect,
  updateTaskCleanedEffect,
  GopeedClient,
  PrismaService,
  SettingsContext,
  TaskDuplicateError,
  TaskAlreadyFinishedError,
} from "./service";
import { getSettings } from "../settings/service";
import { prisma } from "../db/service";
import { Client } from "@gopeed/rest";
import type { CreateTaskWithRequest } from "@gopeed/types";

// Error classes for API responses
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    public message: string,
    public summary: string,
    public validationDetails: any,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Helper to run Effect programs with dependencies
const runEffect = <A, E extends Error>(
  effect: Effect.Effect<A, E, GopeedClient | PrismaService | SettingsContext>,
): Promise<A> => {
  const settings = getSettings();
  const client = new Client({
    host: settings.gopeed_api_host,
    token: settings.gopeed_api_token || "",
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provideService(GopeedClient, client),
      Effect.provideService(PrismaService, prisma),
      Effect.provideService(SettingsContext, settings),
    ),
  );
};

// Helper to handle Effect errors
const handleEffectError = (error: any): never => {
  if (error instanceof GopeedServiceError) {
    throw new ApiError(error.message, 500, error);
  } else if (error instanceof TaskDuplicateError) {
    throw new ApiError(error.message, 409, {
      gopeedTaskId: error.gopeedTaskId,
    });
  } else if (error instanceof TaskAlreadyFinishedError) {
    throw new ApiError(error.message, 400, error);
  } else if (error._tag === "ApiError") {
    // @gopeed/rest ApiError
    throw new ApiError(error.message, error.status || 500, error);
  } else {
    throw new ApiError(error.message || "Internal server error", 500, error);
  }
};

export default new Elysia({ prefix: `/gopeed` })
  .error({
    ApiError,
    ValidationError,
  })
  .onError(({ code, error, status }) => {
    switch (code) {
      case "ApiError":
        return status(error.status || 500, {
          code: error.status,
          message: error.message,
          details: error.details,
        });
      case "ValidationError":
        return status(422, {
          message: error.message,
          summary: error.summary,
          validationDetails: error.validationDetails,
        });
      default:
        return status(500, {
          message: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        });
    }
  })
  // GET /gopeed/tasks - List all tasks (from database)
  .get(
    "/tasks",
    async () => {
      try {
        const tasks = await prisma.modelVersionFile.findMany({
          where: {
            gopeedTaskId: { not: null },
            gopeedTaskDeleted: false,
          },
          select: {
            id: true,
            name: true,
            sizeKB: true,
            type: true,
            gopeedTaskId: true,
            gopeedTaskFinished: true,
            gopeedTaskDeleted: true,
            modelVersion: {
              select: {
                id: true,
                name: true,
                model: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        const images = await prisma.modelVersionImage.findMany({
          where: {
            gopeedTaskId: { not: null },
            gopeedTaskDeleted: false,
          },
          select: {
            id: true,
            url: true,
            type: true,
            gopeedTaskId: true,
            gopeedTaskFinished: true,
            gopeedTaskDeleted: true,
            modelVersion: {
              select: {
                id: true,
                name: true,
                model: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        return {
          files: tasks.map((task) => ({
            id: task.id,
            name: task.name,
            sizeKB: task.sizeKB,
            fileType: task.type,
            gopeedTaskId: task.gopeedTaskId,
            gopeedTaskFinished: task.gopeedTaskFinished,
            gopeedTaskDeleted: task.gopeedTaskDeleted,
            status: getGopeedTaskStatus(
              task.gopeedTaskId,
              task.gopeedTaskFinished,
              task.gopeedTaskDeleted,
            ),
            resourceType: "file" as const,
            modelVersion: task.modelVersion,
          })),
          images: images.map((image) => ({
            id: image.id,
            url: image.url,
            imageType: image.type,
            gopeedTaskId: image.gopeedTaskId,
            gopeedTaskFinished: image.gopeedTaskFinished,
            gopeedTaskDeleted: image.gopeedTaskDeleted,
            status: getGopeedTaskStatus(
              image.gopeedTaskId,
              image.gopeedTaskFinished,
              image.gopeedTaskDeleted,
            ),
            resourceType: "image" as const,
            modelVersion: image.modelVersion,
          })),
        };
      } catch (error) {
        throw error; // Let the error handler handle it
      }
    },
    {
      response: t.Object({
        files: t.Array(
          t.Object({
            id: t.Number(),
            name: t.String(),
            sizeKB: t.Number(),
            fileType: t.String(),
            gopeedTaskId: t.Union([t.String(), t.Null()]),
            gopeedTaskFinished: t.Boolean(),
            gopeedTaskDeleted: t.Boolean(),
            status: t.Enum(GopeedTaskStatus),
            resourceType: t.Literal("file"),
            modelVersion: t.Object({
              id: t.Number(),
              name: t.String(),
              model: t.Object({
                id: t.Number(),
                name: t.String(),
              }),
            }),
          }),
        ),
        images: t.Array(
          t.Object({
            id: t.Number(),
            url: t.String(),
            imageType: t.String(),
            gopeedTaskId: t.Union([t.String(), t.Null()]),
            gopeedTaskFinished: t.Boolean(),
            gopeedTaskDeleted: t.Boolean(),
            status: t.Enum(GopeedTaskStatus),
            resourceType: t.Literal("image"),
            modelVersion: t.Object({
              id: t.Number(),
              name: t.String(),
              model: t.Object({
                id: t.Number(),
                name: t.String(),
              }),
            }),
          }),
        ),
      }),
    },
  )
  // GET /gopeed/tasks/:taskId - Get task status by Gopeed task ID
  .get(
    "/tasks/:taskId",
    async ({ params }) => {
      try {
        const task = await runEffect(getTaskEffect(params.taskId));
        // Extract fields from task with safe defaults
        return {
          id: task.id,
          status: task.status,
          progress: typeof task.progress === "number" ? task.progress : 0,
          speed: (task as any).speed || 0,
          error: (task as any).error || null,
          createAt:
            (task as any).createAt ||
            (task as any).createdAt ||
            new Date().toISOString(),
        };
      } catch (error) {
        handleEffectError(error);
        throw error; // Re-throw to let Elysia handle it
      }
    },
    {
      params: t.Object({ taskId: t.String() }),
      response: t.Object({
        id: t.String(),
        status: t.String(),
        progress: t.Number(),
        speed: t.Number(),
        error: t.Union([t.String(), t.Null()]),
        createAt: t.String(),
      }),
    },
  )
  // GET /gopeed/files/:fileId/status - Get task status for a specific file
  .get(
    "/files/:fileId/status",
    async ({ params, query }) => {
      try {
        const fileId = parseInt(params.fileId);
        const queryType = query.type as string;
        const isMedia = queryType === "image";

        if (isNaN(fileId)) {
          throw new ApiError("Invalid file ID", 400);
        }

        const status = await runEffect(
          getTaskStatusFromDbEffect(fileId, isMedia),
        );
        return { fileId, isMedia, status };
      } catch (error) {
        handleEffectError(error);
        throw error;
      }
    },
    {
      params: t.Object({ fileId: t.String() }),
      query: t.Object({ type: t.String() }),
      response: t.Object({
        fileId: t.Number(),
        isMedia: t.Boolean(),
        status: t.Enum(GopeedTaskStatus),
      }),
    },
  )
  // POST /gopeed/tasks/:taskId/pause - Pause a task
  .post(
    "/tasks/:taskId/pause",
    async ({ params }) => {
      try {
        await runEffect(pauseTaskEffect(params.taskId));
        return { success: true, message: "Task paused successfully" };
      } catch (error) {
        handleEffectError(error);
        throw error;
      }
    },
    {
      params: t.Object({ taskId: t.String() }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  // POST /gopeed/tasks/:taskId/continue - Continue a paused task
  .post(
    "/tasks/:taskId/continue",
    async ({ params }) => {
      try {
        await runEffect(continueTaskEffect(params.taskId));
        return { success: true, message: "Task continued successfully" };
      } catch (error) {
        handleEffectError(error);
        throw error;
      }
    },
    {
      params: t.Object({ taskId: t.String() }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  // DELETE /gopeed/tasks/:taskId - Delete a task (force delete optional)
  .delete(
    "/tasks/:taskId",
    async ({ params, query }) => {
      try {
        const force = query.force === "true";
        await runEffect(deleteTaskEffect(params.taskId, force));
        return { success: true, message: "Task deleted successfully" };
      } catch (error) {
        handleEffectError(error);
        throw error;
      }
    },
    {
      params: type({ taskId: "string" }),
      query: type({ "force?": "string" }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  // POST /gopeed/tasks/:taskId/finish-and-clean - Mark task as finished and clean up
  .post(
    "/tasks/:taskId/finish-and-clean",
    async ({ params, body }) => {
      try {
        const { fileId, isMedia, force } = body;
        await runEffect(
          finishAndCleanTaskEffect(params.taskId, fileId, isMedia, force),
        );
        return {
          success: true,
          message: "Task finished and cleaned successfully",
        };
      } catch (error) {
        handleEffectError(error);
        throw error;
      }
    },
    {
      params: type({ taskId: "string" }),
      body: type({
        fileId: "number",
        isMedia: "boolean",
        "force?": "boolean",
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  // POST /gopeed/tasks - Create a new download task (direct API)
  .post(
    "/tasks",
    async ({ body }) => {
      try {
        const { taskOpts, fileId, isMedia } = body;
        const taskId = await runEffect(
          createGopeedTaskEffect(taskOpts, fileId, isMedia),
        );
        return { taskId, success: true, message: "Task created successfully" };
      } catch (error) {
        handleEffectError(error);
        throw error;
      }
    },
    {
      body: type({
        taskOpts: type({
          req: type({
            url: "string",
            "extra?": type({
              "header?": type({
                "Authorization?": "string",
              }),
            }),
            "labels?": type.Record("string", "string"),
          }),
          opts: type({
            name: "string",
            path: "string",
          }),
        }),
        fileId: "number",
        isMedia: "boolean",
      }),
      response: t.Object({
        taskId: t.String(),
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  );
