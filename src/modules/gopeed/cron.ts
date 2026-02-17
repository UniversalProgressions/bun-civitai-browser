import { Effect, Schedule } from "effect";
import { getSettings } from "../settings/service";
import { prisma } from "../db/service";
import { Client, ApiError } from "@gopeed/rest";
import {
  GopeedClient,
  PrismaService,
  SettingsContext,
  updateTaskCreatedEffect,
  updateTaskFinishedEffect,
  updateTaskFailedEffect,
  updateTaskCleanedEffect,
  GopeedTaskStatus,
  getTaskEffect,
  GopeedServiceError,
} from "./service";

// Create the services for Effect
const settings = getSettings();
const gopeedClient = new Client({
  host: settings.gopeed_api_host,
  token: settings.gopeed_api_token || "",
});

// Helper to run Effect programs
const runEffect = <A, E extends Error>(
  effect: Effect.Effect<A, E, GopeedClient | PrismaService | SettingsContext>,
): Promise<A> => {
  return Effect.runPromise(
    effect.pipe(
      Effect.provideService(GopeedClient, gopeedClient),
      Effect.provideService(PrismaService, prisma),
      Effect.provideService(SettingsContext, settings),
    ),
  );
};

// Retry schedule for 3 attempts with exponential backoff
const retrySchedule = Schedule.exponential(1000).pipe(
  Schedule.compose(Schedule.recurs(3)), // Max 3 retries
  Schedule.upTo("10 seconds"), // Max 10 seconds total
);

// Function to check and update a single task status
const checkAndUpdateTask = (
  taskId: string,
  fileId: number,
  isMedia: boolean,
): Effect.Effect<
  void,
  ApiError | GopeedServiceError,
  GopeedClient | PrismaService | SettingsContext
> => {
  return Effect.gen(function* () {
    try {
      // Get task status from Gopeed
      const task = yield* getTaskEffect(taskId);

      // Update database based on task status
      switch (task.status) {
        case "ready":
        case "running":
          yield* updateTaskCreatedEffect(fileId, taskId, isMedia);
          break;
        case "error":
          yield* updateTaskFailedEffect(fileId, isMedia);
          break;
        case "done":
          // Mark as finished
          yield* updateTaskFinishedEffect(fileId, isMedia);
          break;
        case "pause":
          // Task is paused, no status change needed
          break;
        default:
          // Handle unknown status
          console.warn(`Unknown task status: ${task.status}`);
      }
    } catch (error) {
      // If we can't get task status, mark as failed
      yield* updateTaskFailedEffect(fileId, isMedia);
    }
  }).pipe(Effect.retry(retrySchedule));
};

// Function to poll all active tasks
export const pollActiveTasks = async (): Promise<void> => {
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
        await runEffect(checkAndUpdateTask(file.gopeedTaskId, file.id, false));
      } catch (error) {
        console.error(`Failed to check file task ${file.gopeedTaskId}:`, error);
      }
    }

    // Check all image tasks
    for (const image of activeImages) {
      if (!image.gopeedTaskId) continue;
      try {
        await runEffect(checkAndUpdateTask(image.gopeedTaskId, image.id, true));
      } catch (error) {
        console.error(
          `Failed to check image task ${image.gopeedTaskId}:`,
          error,
        );
      }
    }

    // Clean up finished tasks (optional: mark as cleaned after some time)
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

    // Optionally mark finished tasks as cleaned (after some delay)
    // This could be implemented if you want to auto-clean finished tasks
    // For now, we just log them

    console.log(
      `Polling complete. ${finishedFiles.length} finished files, ${finishedImages.length} finished images`,
    );
  } catch (error) {
    console.error("Error in pollActiveTasks:", error);
  }
};

// Export for use in cron setup
export default pollActiveTasks;
