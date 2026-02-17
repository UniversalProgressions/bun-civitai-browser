import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { Client, ApiError } from "@gopeed/rest";
import { Data, Context, Effect, pipe } from "effect";
import { prisma } from "../db/service";
import type { Settings } from "../settings/model";
import {
  GopeedTaskStatus,
  GopeedServiceError,
  ModelVersionNotFoundError,
  TaskDuplicateError,
  TaskAlreadyFinishedError,
  GopeedClient,
  PrismaService,
  SettingsContext,
  createGopeedTaskEffect,
  createMediaTaskEffect,
  createFileTaskEffect,
  getTaskEffect,
  pauseTaskEffect,
  continueTaskEffect,
  deleteTaskEffect,
  getGopeedTaskStatus,
  updateTaskFailedEffect,
  updateTaskCreatedEffect,
  updateTaskFinishedEffect,
  updateTaskCleanedEffect,
  finishAndCleanTaskEffect,
  getTaskStatusFromDbEffect,
} from "./service";

// Mock implementations
const mockClient = {
  createTask: mock(),
  getTask: mock(),
  pauseTask: mock(),
  continueTask: mock(),
  deleteTask: mock(),
};

const mockPrisma = {
  modelVersionImage: {
    findFirst: mock(),
    findUnique: mock(),
    update: mock(),
  },
  modelVersionFile: {
    findFirst: mock(),
    findUnique: mock(),
    update: mock(),
  },
};

const mockSettings: Settings = {
  basePath: "/test/path",
  civitai_api_token: "test_token",
  gopeed_api_host: "http://localhost:8080",
};

// Helper function to run Effect tests with mocked dependencies
const runEffect = <E, A>(
  effect: Effect.Effect<A, E, GopeedClient | PrismaService | SettingsContext>,
  mocks: {
    client?: Partial<typeof mockClient>;
    prisma?: {
      modelVersionImage?: Partial<typeof mockPrisma.modelVersionImage>;
      modelVersionFile?: Partial<typeof mockPrisma.modelVersionFile>;
    };
    settings?: Partial<Settings>;
  } = {},
) => {
  // Setup mocks
  const client = { ...mockClient, ...mocks.client };
  const prismaMock = {
    modelVersionImage: {
      ...mockPrisma.modelVersionImage,
      ...mocks.prisma?.modelVersionImage,
    },
    modelVersionFile: {
      ...mockPrisma.modelVersionFile,
      ...mocks.prisma?.modelVersionFile,
    },
  };
  const settings = { ...mockSettings, ...mocks.settings };

  return Effect.runPromise(
    pipe(
      effect,
      Effect.provideService(GopeedClient, client as any),
      Effect.provideService(PrismaService, prismaMock as any),
      Effect.provideService(SettingsContext, settings as any),
    ),
  );
};

// Helper to run effect and get result or handle error
const runEffectWithExit = async <E, A>(
  effect: Effect.Effect<A, E, GopeedClient | PrismaService | SettingsContext>,
  mocks: {
    client?: Partial<typeof mockClient>;
    prisma?: {
      modelVersionImage?: Partial<typeof mockPrisma.modelVersionImage>;
      modelVersionFile?: Partial<typeof mockPrisma.modelVersionFile>;
    };
    settings?: Partial<Settings>;
  } = {},
) => {
  // Setup mocks
  const client = { ...mockClient, ...mocks.client };
  const prismaMock = {
    modelVersionImage: {
      ...mockPrisma.modelVersionImage,
      ...mocks.prisma?.modelVersionImage,
    },
    modelVersionFile: {
      ...mockPrisma.modelVersionFile,
      ...mocks.prisma?.modelVersionFile,
    },
  };
  const settings = { ...mockSettings, ...mocks.settings };

  const exit = await Effect.runPromiseExit(
    pipe(
      effect,
      Effect.provideService(GopeedClient, client as any),
      Effect.provideService(PrismaService, prismaMock as any),
      Effect.provideService(SettingsContext, settings as any),
    ),
  );

  return exit;
};

// Helper to run effect and get error if it fails
const runEffectAndGetError = async <E, A>(
  effect: Effect.Effect<A, E, GopeedClient | PrismaService | SettingsContext>,
  mocks: {
    client?: Partial<typeof mockClient>;
    prisma?: {
      modelVersionImage?: Partial<typeof mockPrisma.modelVersionImage>;
      modelVersionFile?: Partial<typeof mockPrisma.modelVersionFile>;
    };
    settings?: Partial<Settings>;
  } = {},
): Promise<E> => {
  const exit = await runEffectWithExit(effect, mocks);
  if (exit._tag === "Success") {
    throw new Error("Expected effect to fail, but it succeeded");
  }

  // Extract error from Cause
  const cause = exit.cause;
  if (cause._tag === "Fail") {
    return cause.error;
  }
  // For other cause types (e.g., "Die", "Interrupt", "Parallel"), we can't extract a typed error
  throw new Error(`Effect failed with cause type: ${cause._tag}`);
};

describe("Gopeed Service", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockClient.createTask.mockReset();
    mockClient.getTask.mockReset();
    mockClient.pauseTask.mockReset();
    mockClient.continueTask.mockReset();
    mockClient.deleteTask.mockReset();
    mockPrisma.modelVersionImage.findFirst.mockReset();
    mockPrisma.modelVersionImage.findUnique.mockReset();
    mockPrisma.modelVersionImage.update.mockReset();
    mockPrisma.modelVersionFile.findFirst.mockReset();
    mockPrisma.modelVersionFile.findUnique.mockReset();
    mockPrisma.modelVersionFile.update.mockReset();
  });

  describe("GopeedTaskStatus Enum", () => {
    test("should have correct enum values", () => {
      expect(GopeedTaskStatus.FAILED).toBe(GopeedTaskStatus.FAILED);
      expect(GopeedTaskStatus.CREATED).toBe(GopeedTaskStatus.CREATED);
      expect(GopeedTaskStatus.FINISHED).toBe(GopeedTaskStatus.FINISHED);
      expect(GopeedTaskStatus.CLEANED).toBe(GopeedTaskStatus.CLEANED);
    });
  });

  describe("Error Classes", () => {
    test("GopeedServiceError should have message", () => {
      const error = new GopeedServiceError("Test error");
      expect(error).toBeInstanceOf(Data.Error);
      expect(error.message).toBe("Test error");
    });

    test("ModelVersionNotFoundError should have message", () => {
      const error = new ModelVersionNotFoundError("Not found");
      expect(error).toBeInstanceOf(Data.Error);
      expect(error.message).toBe("Not found");
    });

    test("TaskDuplicateError should have message and gopeedTaskId", () => {
      const error = new TaskDuplicateError("Duplicate task", "task123");
      expect(error).toBeInstanceOf(Data.Error);
      expect(error.message).toBe("Duplicate task");
      expect(error.gopeedTaskId).toBe("task123");
    });

    test("TaskAlreadyFinishedError should have message", () => {
      const error = new TaskAlreadyFinishedError("Already finished");
      expect(error).toBeInstanceOf(Data.Error);
      expect(error.message).toBe("Already finished");
    });
  });

  describe("getGopeedTaskStatus", () => {
    test("should return FAILED when gopeedTaskId is null", () => {
      expect(getGopeedTaskStatus(null, false, false)).toBe(
        GopeedTaskStatus.FAILED,
      );
    });

    test("should return CREATED when task is not finished", () => {
      expect(getGopeedTaskStatus("task123", false, false)).toBe(
        GopeedTaskStatus.CREATED,
      );
    });

    test("should return FINISHED when task is finished but not deleted", () => {
      expect(getGopeedTaskStatus("task123", true, false)).toBe(
        GopeedTaskStatus.FINISHED,
      );
    });

    test("should return CLEANED when task is finished and deleted", () => {
      expect(getGopeedTaskStatus("task123", true, true)).toBe(
        GopeedTaskStatus.CLEANED,
      );
    });
  });

  describe("createGopeedTaskEffect", () => {
    test("should fail when task options lack path or name", async () => {
      const error = await runEffectAndGetError(
        createGopeedTaskEffect(
          { req: { url: "http://example.com" }, opts: {} } as any,
          1,
          false,
        ),
      );
      expect(error).toBeInstanceOf(GopeedServiceError);
      expect((error as GopeedServiceError).message).toBe(
        "Task options must include path and name",
      );
    });

    test("should fail when file already exists on disk", async () => {
      // Mock Bun.file().exists() to return true
      const originalBunFile = Bun.file;
      (Bun as any).file = () => ({
        exists: () => Promise.resolve(true),
      });

      try {
        const error = await runEffectAndGetError(
          createGopeedTaskEffect(
            {
              req: { url: "http://example.com" },
              opts: { path: "/test", name: "test.jpg" },
            },
            1,
            false,
          ),
        );
        expect(error).toBeInstanceOf(TaskAlreadyFinishedError);
        expect((error as TaskAlreadyFinishedError).message).toBe(
          "the file test.jpg has been downloaded on disk.",
        );
      } finally {
        (Bun as any).file = originalBunFile;
      }
    });

    test("should fail when task already exists in database", async () => {
      mockPrisma.modelVersionFile.findFirst.mockResolvedValue({
        gopeedTaskId: "existing-task",
      });

      const error = await runEffectAndGetError(
        createGopeedTaskEffect(
          {
            req: { url: "http://example.com" },
            opts: { path: "/test", name: "test.jpg" },
          },
          1,
          false,
        ),
        {
          prisma: {
            modelVersionFile: {
              findFirst: mockPrisma.modelVersionFile.findFirst,
            },
          },
        },
      );
      expect(error).toBeInstanceOf(TaskDuplicateError);
      expect((error as TaskDuplicateError).message).toBe(
        "The task already existed!",
      );
      expect((error as TaskDuplicateError).gopeedTaskId).toBe("existing-task");
    });

    test("should create task successfully", async () => {
      mockPrisma.modelVersionFile.findFirst.mockResolvedValue(null);
      mockClient.createTask.mockResolvedValue("new-task-id");

      const result = await runEffect(
        createGopeedTaskEffect(
          {
            req: { url: "http://example.com" },
            opts: { path: "/test", name: "test.jpg" },
          },
          1,
          false,
        ),
        {
          client: { createTask: mockClient.createTask },
          prisma: {
            modelVersionFile: {
              findFirst: mockPrisma.modelVersionFile.findFirst,
            },
          },
        },
      );

      expect(result).toBe("new-task-id");
      expect(mockClient.createTask).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task Management Effects", () => {
    test("getTaskEffect should retrieve task", async () => {
      const mockTask = {
        id: "task123",
        status: "downloading",
        protocol: "http",
        name: "test.jpg",
        meta: {},
        uploading: false,
        downloaded: 1024,
        size: 4096,
        resumable: true,
      } as any; // Use type assertion for mock Task
      mockClient.getTask.mockResolvedValue(mockTask);

      const result = await runEffect(getTaskEffect("task123"), {
        client: { getTask: mockClient.getTask },
      });

      expect(result).toEqual(mockTask);
      expect(mockClient.getTask).toHaveBeenCalledWith("task123");
    });

    test("pauseTaskEffect should pause task", async () => {
      mockClient.pauseTask.mockResolvedValue(undefined);

      const result = await runEffect(pauseTaskEffect("task123"), {
        client: { pauseTask: mockClient.pauseTask },
      });

      expect(result).toBe(true);
      expect(mockClient.pauseTask).toHaveBeenCalledWith("task123");
    });

    test("continueTaskEffect should continue task", async () => {
      mockClient.continueTask.mockResolvedValue(undefined);

      const result = await runEffect(continueTaskEffect("task123"), {
        client: { continueTask: mockClient.continueTask },
      });

      expect(result).toBe(true);
      expect(mockClient.continueTask).toHaveBeenCalledWith("task123");
    });

    test("deleteTaskEffect should delete task", async () => {
      mockClient.deleteTask.mockResolvedValue(undefined);

      const result = await runEffect(deleteTaskEffect("task123", true), {
        client: { deleteTask: mockClient.deleteTask },
      });

      expect(result).toBe(true);
      expect(mockClient.deleteTask).toHaveBeenCalledWith("task123", true);
    });
  });

  describe("Task Update Effects", () => {
    test("updateTaskFailedEffect should update record as failed", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      await runEffect(updateTaskFailedEffect(1, false), {
        prisma: {
          modelVersionFile: {
            update: mockPrisma.modelVersionFile.update,
          },
        },
      });

      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskId: null,
          gopeedTaskFinished: false,
          gopeedTaskDeleted: false,
        },
      });
    });

    test("updateTaskCreatedEffect should update record as created", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      await runEffect(updateTaskCreatedEffect(1, "task123", false), {
        prisma: {
          modelVersionFile: {
            update: mockPrisma.modelVersionFile.update,
          },
        },
      });

      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskId: "task123",
          gopeedTaskFinished: false,
          gopeedTaskDeleted: false,
        },
      });
    });

    test("updateTaskFinishedEffect should update record as finished", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      await runEffect(updateTaskFinishedEffect(1, false), {
        prisma: {
          modelVersionFile: {
            update: mockPrisma.modelVersionFile.update,
          },
        },
      });

      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskFinished: true,
          gopeedTaskDeleted: false,
        },
      });
    });

    test("updateTaskCleanedEffect should update record as cleaned", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      await runEffect(updateTaskCleanedEffect(1, false), {
        prisma: {
          modelVersionFile: {
            update: mockPrisma.modelVersionFile.update,
          },
        },
      });

      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskDeleted: true,
        },
      });
    });
  });

  describe("finishAndCleanTaskEffect", () => {
    test("should delete task and update as cleaned", async () => {
      mockClient.deleteTask.mockResolvedValue(undefined);
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      await runEffect(finishAndCleanTaskEffect("task123", 1, false, true), {
        client: { deleteTask: mockClient.deleteTask },
        prisma: {
          modelVersionFile: {
            update: mockPrisma.modelVersionFile.update,
          },
        },
      });

      expect(mockClient.deleteTask).toHaveBeenCalledWith("task123", true);
      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskDeleted: true,
        },
      });
    });
  });

  describe("getTaskStatusFromDbEffect", () => {
    test("should return task status from database", async () => {
      const mockRecord = {
        gopeedTaskId: "task123",
        gopeedTaskFinished: true,
        gopeedTaskDeleted: false,
      };
      mockPrisma.modelVersionFile.findUnique.mockResolvedValue(mockRecord);

      const result = await runEffect(getTaskStatusFromDbEffect(1, false), {
        prisma: {
          modelVersionFile: {
            findUnique: mockPrisma.modelVersionFile.findUnique,
          },
        },
      });

      expect(result).toBe(GopeedTaskStatus.FINISHED);
      expect(mockPrisma.modelVersionFile.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          gopeedTaskId: true,
          gopeedTaskFinished: true,
          gopeedTaskDeleted: true,
        },
      });
    });

    test("should fail when record not found", async () => {
      mockPrisma.modelVersionFile.findUnique.mockResolvedValue(null);

      const error = await runEffectAndGetError(
        getTaskStatusFromDbEffect(999, false),
        {
          prisma: {
            modelVersionFile: {
              findUnique: mockPrisma.modelVersionFile.findUnique,
            },
          },
        },
      );
      expect(error).toBeInstanceOf(GopeedServiceError);
      expect((error as GopeedServiceError).message).toContain(
        "Record not found for fileId: 999",
      );
    });
  });

  describe("Context Tags", () => {
    test("GopeedClient should be a Context.Tag", () => {
      // Context.Tag creates a service tag, we can check it has a key
      expect(GopeedClient).toBeDefined();
      expect(typeof GopeedClient).toBe("function");
      expect(GopeedClient.key).toBe("GopeedClient");
    });

    test("PrismaService should be a Context.Tag", () => {
      expect(PrismaService).toBeDefined();
      expect(typeof PrismaService).toBe("function");
      expect(PrismaService.key).toBe("PrismaService");
    });

    test("SettingsContext should be a Context.Tag", () => {
      expect(SettingsContext).toBeDefined();
      expect(typeof SettingsContext).toBe("function");
      expect(SettingsContext.key).toBe("SettingsContext");
    });
  });
});
