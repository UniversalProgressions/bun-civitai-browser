import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import temporaryDirectory from "temp-dir";
import {
  updateGopeedTaskStatus,
  updateAllGopeedTaskStatus,
} from "./modelVersion";
import { PrismaClient } from "../generated/client";
import { PrismaBunSqlite } from "prisma-adapter-bun-sqlite";
// Create adapter factory
const adapter = new PrismaBunSqlite({
  url: `file:./db.sqlite3`,
  wal: {
    enabled: true,
    synchronous: "NORMAL", // 2-3x faster than FULL
    busyTimeout: 10000,
  },
}); // keep the name to be same as in schema.prisma

// Initialize Prisma with adapter
export const prisma = new PrismaClient({ adapter });

describe("updateGopeedTaskStatus", () => {
  // Clean up before and after tests
  beforeEach(async () => {
    // Mock getSettings to provide test configuration
    await mock.module("../../settings/service", () => ({
      getSettings: () => ({
        basePath: temporaryDirectory,
        civitai_api_token: "test-token",
        gopeed_api_host: "http://localhost:9999",
        gopeed_api_token: "",
      }),
    }));

    // Clean up any existing test data
    // Disable foreign key constraints for cleanup
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");

    // Delete in order of dependencies (most dependent first)
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.tag.deleteMany();

    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  });

  afterEach(async () => {
    // Clean up after tests
    // Disable foreign key constraints for cleanup
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");

    // Delete in order of dependencies (most dependent first)
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.tag.deleteMany();

    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  });

  test("should throw error for non-existent model version", async () => {
    await expect(
      updateGopeedTaskStatus(99999, undefined, prisma),
    ).rejects.toThrow("Model version 99999 not found");
  });

  // Note: We can't easily test the actual file existence checking without setting up
  // a full test environment with actual files, but we can test the database operations
  // and error handling
});

describe("updateAllGopeedTaskStatus", () => {
  beforeEach(async () => {
    // Mock getSettings to provide test configuration
    await mock.module("../../settings/service", () => ({
      getSettings: () => ({
        basePath: "/test/base/path",
        civitai_api_token: "test-token",
        gopeed_api_host: "http://localhost:9999",
        gopeed_api_token: "",
      }),
    }));

    // Clean up any existing test data
    // Disable foreign key constraints for cleanup
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");

    // Delete in order of dependencies (most dependent first)
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.tag.deleteMany();

    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  });

  afterEach(async () => {
    // Clean up after tests
    // Disable foreign key constraints for cleanup
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");

    // Delete in order of dependencies (most dependent first)
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.tag.deleteMany();

    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  });

  test("should handle empty database gracefully", async () => {
    const result = await updateAllGopeedTaskStatus(undefined, prisma);

    expect(result).toHaveProperty("totalModelVersions", 0);
    expect(result).toHaveProperty("totalUpdatedFiles", 0);
    expect(result).toHaveProperty("totalUpdatedImages", 0);
    expect(result).toHaveProperty("totalFilesExist", 0);
    expect(result).toHaveProperty("totalImagesExist", 0);
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details.length).toBe(0);
  });
});
