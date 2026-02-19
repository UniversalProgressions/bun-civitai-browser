import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { prisma } from "../service";
import {
  updateGopeedTaskStatus,
  updateAllGopeedTaskStatus,
} from "./modelVersion";

describe("updateGopeedTaskStatus", () => {
  // Clean up before and after tests
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.tag.deleteMany();
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.tag.deleteMany();
  });

  test("should throw error for non-existent model version", async () => {
    await expect(updateGopeedTaskStatus(99999)).rejects.toThrow(
      "Model version 99999 not found",
    );
  });

  // Note: We can't easily test the actual file existence checking without setting up
  // a full test environment with actual files, but we can test the database operations
  // and error handling
});

describe("updateAllGopeedTaskStatus", () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.tag.deleteMany();
  });

  afterEach(async () => {
    // Clean up after tests
    await prisma.modelVersionImage.deleteMany();
    await prisma.modelVersionFile.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.model.deleteMany();
    await prisma.creator.deleteMany();
    await prisma.modelType.deleteMany();
    await prisma.baseModel.deleteMany();
    await prisma.baseModelType.deleteMany();
    await prisma.tag.deleteMany();
  });

  test("should handle empty database gracefully", async () => {
    const result = await updateAllGopeedTaskStatus();

    expect(result).toHaveProperty("totalModelVersions", 0);
    expect(result).toHaveProperty("totalUpdatedFiles", 0);
    expect(result).toHaveProperty("totalUpdatedImages", 0);
    expect(result).toHaveProperty("totalFilesExist", 0);
    expect(result).toHaveProperty("totalImagesExist", 0);
    expect(Array.isArray(result.details)).toBe(true);
    expect(result.details.length).toBe(0);
  });
});
