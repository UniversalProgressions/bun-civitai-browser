import { ModelLayout } from "./file-layout";
import { describe, test, expect, mock, beforeAll, afterAll } from "bun:test";
import { join } from "node:path";
import filenamify from "filenamify";
import { last } from "es-toolkit/compat";
import type { Model } from "#civitai-api/v1/models/models";
import modelData from "./models_res.json" with { type: "json" };
import { extractIdFromImageUrl } from "#civitai-api/v1/utils";

// @ts-nocheck
// Note: We need to adapt the test data to match the new Model type
// For now, we'll cast it as Model
export const modelId1 = modelData.items[0] as unknown as Model;

// 模拟 settingsService
const mockSettingsService = {
  getSettings: () => ({
    basePath: "/test/base/path",
  }),
};

// 模拟 fast-glob
const mockFastGlob = {
  convertPathToPattern: (path: string) => {
    console.log(`[MOCK FAST-GLOB] convertPathToPattern called with: ${path}`);
    return path.replace(/\\/g, "/");
  },
  async: (pattern: string) => {
    console.log(`[MOCK FAST-GLOB] async called with pattern: ${pattern}`);
    // 返回一些模拟的safetensors文件路径
    return Promise.resolve([
      "/test/base/path/Checkpoint/123/456/files/model.safetensors",
      "/test/base/path/Checkpoint/789/101/files/model.safetensors",
    ]);
  },
};

// 设置模拟
beforeAll(() => {
  // 模拟 settingsService
  mock.module("../../settings/service", () => ({
    settingsService: mockSettingsService,
  }));

  // 模拟 fast-glob
  mock.module("fast-glob", () => mockFastGlob);
});

afterAll(() => {
  mock.restore();
});

describe("test layout class", () => {
  const basePath = __dirname;
  const milayout = new ModelLayout(basePath, modelId1);
  const mv = modelId1.modelVersions[0];

  test("test get modelId path", () => {
    expect(milayout.modelIdPath).toBe(
      join(basePath, modelId1.type, modelId1.id.toString()),
    );
  });

  test("test get modelVersion path", async () => {
    const mvlayout = await milayout.getModelVersionLayout(mv.id);
    expect(mvlayout.modelVersionPath).toBe(
      join(milayout.modelIdPath, mv.id.toString()),
    );
  });

  test("test get file path", async () => {
    const mvlayout = await milayout.getModelVersionLayout(mv.id);
    const mfile = mv.files[0];
    // New layout: {versionId}/files/{fileName}.xxx (no fileId_ prefix)
    expect(mvlayout.getFilePath(mfile.id)).toBe(
      join(mvlayout.filesDir, filenamify(mfile.name, { replacement: "_" })),
    );
  });

  test("test get image path", async () => {
    const mvlayout = await milayout.getModelVersionLayout(mv.id);
    const mimg = mv.images[0];
    // New layout: {versionId}/media/{imageId}.xxx
    // Extract image ID from URL since ModelImage no longer has id field
    const idResult = extractIdFromImageUrl(mimg.url);
    const imageId = idResult.isOk() ? idResult.value : 0;
    const filename = `${imageId}.${last(mimg.url.split("."))}`;
    expect(mvlayout.getMediaPath(imageId)).toBe(
      join(mvlayout.mediaDir, filename),
    );
  });

  test("test get files dir", async () => {
    const mvlayout = await milayout.getModelVersionLayout(mv.id);
    expect(mvlayout.filesDir).toBe(join(mvlayout.modelVersionPath, "files"));
  });

  test("test get media dir", async () => {
    const mvlayout = await milayout.getModelVersionLayout(mv.id);
    expect(mvlayout.mediaDir).toBe(join(mvlayout.modelVersionPath, "media"));
  });
});

test("how to use fastglob scan model file", async () => {
  // 重新导入以获取模拟的fast-glob
  const fg = await import("fast-glob");
  const { settingsService } = await import("../../settings/service");

  const expression =
    process.platform === "win32"
      ? `${fg.convertPathToPattern(settingsService.getSettings().basePath)}/**/*.safetensors`
      : `${settingsService.getSettings().basePath}/**/*.safetensors`;

  console.log(`[TEST] Scanning with expression: ${expression}`);

  const safetensors = await fg.async(expression);
  console.log(`[TEST] Found ${safetensors.length} safetensors files`);

  // 在我们的模拟中，应该返回2个文件
  expect(safetensors.length).toBe(2);
  expect(safetensors).toEqual([
    "/test/base/path/Checkpoint/123/456/files/model.safetensors",
    "/test/base/path/Checkpoint/789/101/files/model.safetensors",
  ]);
});
