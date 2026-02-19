import { cron } from "@elysiajs/cron";
import { getSettings } from "../settings/service";
import { prisma } from "../db/service";
import { Client, ApiError } from "@gopeed/rest";
import { Result, ok, err } from "neverthrow";

// Define error types
export class CronError extends Error {
  constructor(
    message: string,
    public readonly taskId?: string,
    public readonly fileId?: number,
    public readonly isMedia?: boolean,
  ) {
    super(message);
    this.name = "CronError";
  }
}

export class GopeedApiError extends CronError {
  constructor(
    message: string,
    taskId?: string,
    fileId?: number,
    isMedia?: boolean,
  ) {
    super(message, taskId, fileId, isMedia);
    this.name = "GopeedApiError";
  }
}

export class DatabaseError extends CronError {
  constructor(message: string, fileId?: number, isMedia?: boolean) {
    super(message, undefined, fileId, isMedia);
    this.name = "DatabaseError";
  }
}

// Helper function to get Gopeed client
function getGopeedClient() {
  const settings = getSettings();
  return new Client({
    host: settings.gopeed_api_host,
    token: settings.gopeed_api_token || "",
  });
}

// Helper function to check and update a single task status
async function checkAndUpdateTask(
  taskId: string,
  fileId: number,
  isMedia: boolean,
): Promise<Result<void, CronError>> {
  try {
    const client = getGopeedClient();

    // Get task status from Gopeed
    const task = await client.getTask(taskId);

    // Update database based on task status
    switch (task.status) {
      case "ready":
      case "running":
        // Mark as created/running
        if (isMedia) {
          await prisma.modelVersionImage.update({
            where: { id: fileId },
            data: {
              gopeedTaskId: taskId,
              gopeedTaskFinished: false,
              gopeedTaskDeleted: false,
            },
          });
        } else {
          await prisma.modelVersionFile.update({
            where: { id: fileId },
            data: {
              gopeedTaskId: taskId,
              gopeedTaskFinished: false,
              gopeedTaskDeleted: false,
            },
          });
        }
        break;

      case "error":
        // Mark as failed
        if (isMedia) {
          await prisma.modelVersionImage.update({
            where: { id: fileId },
            data: {
              gopeedTaskId: null,
              gopeedTaskFinished: false,
              gopeedTaskDeleted: false,
            },
          });
        } else {
          await prisma.modelVersionFile.update({
            where: { id: fileId },
            data: {
              gopeedTaskId: null,
              gopeedTaskFinished: false,
              gopeedTaskDeleted: false,
            },
          });
        }
        break;

      case "done":
        // Mark as finished
        if (isMedia) {
          await prisma.modelVersionImage.update({
            where: { id: fileId },
            data: {
              gopeedTaskFinished: true,
              gopeedTaskDeleted: false,
            },
          });
        } else {
          await prisma.modelVersionFile.update({
            where: { id: fileId },
            data: {
              gopeedTaskFinished: true,
              gopeedTaskDeleted: false,
            },
          });
        }
        break;

      case "pause":
        // Task is paused, no status change needed
        break;

      default:
        console.warn(`Unknown task status for task ${taskId}: ${task.status}`);
    }

    return ok(undefined);
  } catch (error) {
    if (error instanceof ApiError) {
      return err(
        new GopeedApiError(
          `Gopeed API error: ${error.message}`,
          taskId,
          fileId,
          isMedia,
        ),
      );
    }

    // If we can't get task status, mark as failed
    try {
      if (isMedia) {
        await prisma.modelVersionImage.update({
          where: { id: fileId },
          data: {
            gopeedTaskId: null,
            gopeedTaskFinished: false,
            gopeedTaskDeleted: false,
          },
        });
      } else {
        await prisma.modelVersionFile.update({
          where: { id: fileId },
          data: {
            gopeedTaskId: null,
            gopeedTaskFinished: false,
            gopeedTaskDeleted: false,
          },
        });
      }
    } catch (dbError) {
      return err(
        new DatabaseError(
          `Failed to update task as failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`,
          fileId,
          isMedia,
        ),
      );
    }

    return err(
      new CronError(
        `Failed to check task ${taskId}: ${error instanceof Error ? error.message : String(error)}`,
        taskId,
        fileId,
        isMedia,
      ),
    );
  }
}

// Main function to poll all active tasks
export async function pollActiveTasks(): Promise<void> {
  try {
    console.log(
      `[${new Date().toISOString()}] Polling active download tasks...`,
    );

    // Find all active tasks from database (files)
    const activeFiles = await prisma.modelVersionFile.findMany({
      where: {
        gopeedTaskId: { not: null },
        gopeedTaskFinished: false,
        gopeedTaskDeleted: false,
      },
      select: {
        id: true,
        gopeedTaskId: true,
      },
    });

    // Find all active tasks from database (images)
    const activeImages = await prisma.modelVersionImage.findMany({
      where: {
        gopeedTaskId: { not: null },
        gopeedTaskFinished: false,
        gopeedTaskDeleted: false,
      },
      select: {
        id: true,
        gopeedTaskId: true,
      },
    });

    console.log(
      `Found ${activeFiles.length} active files and ${activeImages.length} active images to check`,
    );

    // Check all file tasks
    for (const file of activeFiles) {
      if (!file.gopeedTaskId) continue;
      try {
        const result = await checkAndUpdateTask(
          file.gopeedTaskId,
          file.id,
          false,
        );
        if (result.isErr()) {
          console.error(
            `Failed to check file task ${file.gopeedTaskId}:`,
            result.error,
          );
        }
      } catch (error) {
        console.error(
          `Unexpected error checking file task ${file.gopeedTaskId}:`,
          error,
        );
      }
    }

    // Check all image tasks
    for (const image of activeImages) {
      if (!image.gopeedTaskId) continue;
      try {
        const result = await checkAndUpdateTask(
          image.gopeedTaskId,
          image.id,
          true,
        );
        if (result.isErr()) {
          console.error(
            `Failed to check image task ${image.gopeedTaskId}:`,
            result.error,
          );
        }
      } catch (error) {
        console.error(
          `Unexpected error checking image task ${image.gopeedTaskId}:`,
          error,
        );
      }
    }

    // Log finished tasks (for monitoring)
    const finishedFiles = await prisma.modelVersionFile.findMany({
      where: {
        gopeedTaskFinished: true,
        gopeedTaskDeleted: false,
      },
      select: {
        id: true,
        gopeedTaskId: true,
      },
    });

    const finishedImages = await prisma.modelVersionImage.findMany({
      where: {
        gopeedTaskFinished: true,
        gopeedTaskDeleted: false,
      },
      select: {
        id: true,
        gopeedTaskId: true,
      },
    });

    console.log(
      `Polling complete. ${finishedFiles.length} finished files, ${finishedImages.length} finished images`,
    );
  } catch (error) {
    console.error("Error in pollActiveTasks:", error);
  }
}

// Create cron configuration
export const gopeedCron = cron({
  name: "poll-active-tasks",
  pattern: "*/5 * * * *", // Every 5 minutes
  run: pollActiveTasks,
});

// For backward compatibility - export the function directly
export default pollActiveTasks;
