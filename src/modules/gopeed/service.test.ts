import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { Client, ApiError } from "@gopeed/rest";
import { prisma } from "../db/service";
import type { Settings } from "../settings/model";
import {
  GopeedTaskStatus,
  GopeedServiceError,
  ModelVersionNotFoundError,
  TaskDuplicateError,
  TaskAlreadyFinishedError,
  getGopeedTaskStatus,
} from "./errors";
import {
  createGopeedTask,
  createMediaTask,
  createFileTask,
  getTask,
  pauseTask,
  continueTask,
  deleteTask,
  updateTaskFailed,
  updateTaskCreated,
  updateTaskFinished,
  updateTaskCleaned,
  finishAndCleanTask,
  getTaskStatusFromDb,
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
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
    });

    test("ModelVersionNotFoundError should have message", () => {
      const error = new ModelVersionNotFoundError("Not found");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Not found");
    });

    test("TaskDuplicateError should have message and gopeedTaskId", () => {
      const error = new TaskDuplicateError("Duplicate task", "task123");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Duplicate task");
      expect(error.gopeedTaskId).toBe("task123");
    });

    test("TaskAlreadyFinishedError should have message", () => {
      const error = new TaskAlreadyFinishedError("Already finished");
      expect(error).toBeInstanceOf(Error);
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

  describe("createGopeedTask", () => {
    test("should fail when task options lack path or name", async () => {
      const result = await createGopeedTask(
        mockClient as any,
        mockPrisma as any,
        { req: { url: "http://example.com" }, opts: {} } as any,
        1,
        false,
      );

      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error).toBeInstanceOf(GopeedServiceError);
      expect(
        result.isErr() && (result.error as GopeedServiceError).message,
      ).toBe("Task options must include path and name");
    });

    test("should fail when file already exists on disk", async () => {
      // Mock Bun.file().exists() to return true
      const originalBunFile = Bun.file;
      (Bun as any).file = () => ({
        exists: () => Promise.resolve(true),
      });

      try {
        const result = await createGopeedTask(
          mockClient as any,
          mockPrisma as any,
          {
            req: { url: "http://example.com" },
            opts: { path: "/test", name: "test.jpg" },
          } as any,
          1,
          false,
        );

        expect(result.isErr()).toBe(true);
        expect(result.isErr() && result.error).toBeInstanceOf(
          TaskAlreadyFinishedError,
        );
        expect(
          result.isErr() && (result.error as TaskAlreadyFinishedError).message,
        ).toBe("the file test.jpg has been downloaded on disk.");
      } finally {
        (Bun as any).file = originalBunFile;
      }
    });

    test("should fail when task already exists in database", async () => {
      mockPrisma.modelVersionFile.findFirst.mockResolvedValue({
        gopeedTaskId: "existing-task",
      });

      const result = await createGopeedTask(
        mockClient as any,
        mockPrisma as any,
        {
          req: { url: "http://example.com" },
          opts: { path: "/test", name: "test.jpg" },
        } as any,
        1,
        false,
      );

      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error).toBeInstanceOf(TaskDuplicateError);
      expect(
        result.isErr() && (result.error as TaskDuplicateError).message,
      ).toBe("The task already existed!");
      expect(
        result.isErr() && (result.error as TaskDuplicateError).gopeedTaskId,
      ).toBe("existing-task");
    });

    test("should create task successfully", async () => {
      mockPrisma.modelVersionFile.findFirst.mockResolvedValue(null);
      mockClient.createTask.mockResolvedValue("new-task-id");

      const result = await createGopeedTask(
        mockClient as any,
        mockPrisma as any,
        {
          req: { url: "http://example.com" },
          opts: { path: "/test", name: "test.jpg" },
        } as any,
        1,
        false,
      );

      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value).toBe("new-task-id");
      expect(mockClient.createTask).toHaveBeenCalledTimes(1);
    });
  });

  describe("Task Management Functions", () => {
    test("getTask should retrieve task", async () => {
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
      } as any;
      mockClient.getTask.mockResolvedValue(mockTask);

      const result = await getTask(mockClient as any, "task123");

      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value).toEqual(mockTask);
      expect(mockClient.getTask).toHaveBeenCalledWith("task123");
    });

    test("pauseTask should pause task", async () => {
      mockClient.pauseTask.mockResolvedValue(undefined);

      const result = await pauseTask(mockClient as any, "task123");

      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value).toBe(true);
      expect(mockClient.pauseTask).toHaveBeenCalledWith("task123");
    });

    test("continueTask should continue task", async () => {
      mockClient.continueTask.mockResolvedValue(undefined);

      const result = await continueTask(mockClient as any, "task123");

      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value).toBe(true);
      expect(mockClient.continueTask).toHaveBeenCalledWith("task123");
    });

    test("deleteTask should delete task", async () => {
      mockClient.deleteTask.mockResolvedValue(undefined);

      const result = await deleteTask(mockClient as any, "task123", true);

      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value).toBe(true);
      expect(mockClient.deleteTask).toHaveBeenCalledWith("task123", true);
    });
  });

  describe("Task Update Functions", () => {
    test("updateTaskFailed should update record as failed", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      const result = await updateTaskFailed(mockPrisma as any, 1, false);

      expect(result.isOk()).toBe(true);
      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskId: null,
          gopeedTaskFinished: false,
          gopeedTaskDeleted: false,
        },
      });
    });

    test("updateTaskCreated should update record as created", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      const result = await updateTaskCreated(
        mockPrisma as any,
        1,
        "task123",
        false,
      );

      expect(result.isOk()).toBe(true);
      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskId: "task123",
          gopeedTaskFinished: false,
          gopeedTaskDeleted: false,
        },
      });
    });

    test("updateTaskFinished should update record as finished", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      const result = await updateTaskFinished(mockPrisma as any, 1, false);

      expect(result.isOk()).toBe(true);
      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskFinished: true,
          gopeedTaskDeleted: false,
        },
      });
    });

    test("updateTaskCleaned should update record as cleaned", async () => {
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      const result = await updateTaskCleaned(mockPrisma as any, 1, false);

      expect(result.isOk()).toBe(true);
      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskDeleted: true,
        },
      });
    });
  });

  describe("finishAndCleanTask", () => {
    test("should delete task and update as cleaned", async () => {
      mockClient.deleteTask.mockResolvedValue(undefined);
      mockPrisma.modelVersionFile.update.mockResolvedValue({});

      const result = await finishAndCleanTask(
        mockClient as any,
        mockPrisma as any,
        "task123",
        1,
        false,
        true,
      );

      expect(result.isOk()).toBe(true);
      expect(mockClient.deleteTask).toHaveBeenCalledWith("task123", true);
      expect(mockPrisma.modelVersionFile.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          gopeedTaskDeleted: true,
        },
      });
    });
  });

  describe("getTaskStatusFromDb", () => {
    test("should return task status from database", async () => {
      const mockRecord = {
        gopeedTaskId: "task123",
        gopeedTaskFinished: true,
        gopeedTaskDeleted: false,
      };
      mockPrisma.modelVersionFile.findUnique.mockResolvedValue(mockRecord);

      const result = await getTaskStatusFromDb(mockPrisma as any, 1, false);

      expect(result.isOk()).toBe(true);
      expect(result.isOk() && result.value).toBe(GopeedTaskStatus.FINISHED);
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

      const result = await getTaskStatusFromDb(mockPrisma as any, 999, false);

      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error).toBeInstanceOf(GopeedServiceError);
      expect(
        result.isErr() && (result.error as GopeedServiceError).message,
      ).toContain("Record not found for fileId: 999");
    });
  });
});
