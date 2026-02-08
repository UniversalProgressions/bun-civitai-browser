import { ModelLayout } from "./file-layout";
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import filenamify from "filenamify";
import { last } from "es-toolkit/compat";
import type { Model } from "#civitai-api/v1/models/models";
import { settingsService } from "#modules/settings/service";
import fg from "fast-glob";
import modelData from "./models_res.json" with { type: "json" };
import { extractIdFromImageUrl } from "#civitai-api/v1/utils";

// @ts-nocheck
// Note: We need to adapt the test data to match the new Model type
// For now, we'll cast it as Model
export const modelId1 = modelData.items[0] as unknown as Model;

describe("test layout class", () => {
  const basePath = __dirname;
  const milayout = new ModelLayout(basePath, modelId1);
  const mv = modelId1.modelVersions[0];
  const mvlayout = milayout.getModelVersionLayout(mv.id);
  const mfile = mv.files[0];
  const mimg = mv.images[0];

  test("test get modelId path", () => {
    expect(milayout.modelIdPath).toBe(
      join(basePath, modelId1.type, modelId1.id.toString()),
    );
  });

  test("test get modelVersion path", () => {
    expect(mvlayout.modelVersionPath).toBe(
      join(milayout.modelIdPath, mv.id.toString()),
    );
  });

  test("test get file path", () => {
    // New layout: {versionId}/files/{fileName}.xxx (no fileId_ prefix)
    expect(mvlayout.getFilePath(mfile.id)).toBe(
      join(mvlayout.filesDir, filenamify(mfile.name, { replacement: "_" })),
    );
  });

  test("test get image path", () => {
    // New layout: {versionId}/media/{imageId}.xxx
    // Extract image ID from URL since ModelImage no longer has id field
    const idResult = extractIdFromImageUrl(mimg.url);
    const imageId = idResult.isOk() ? idResult.value : 0;
    const filename = `${imageId}.${last(mimg.url.split("."))}`;
    expect(mvlayout.getMediaPath(imageId)).toBe(
      join(mvlayout.mediaDir, filename),
    );
  });

  test("test get files dir", () => {
    expect(mvlayout.filesDir).toBe(join(mvlayout.modelVersionPath, "files"));
  });

  test("test get media dir", () => {
    expect(mvlayout.mediaDir).toBe(join(mvlayout.modelVersionPath, "media"));
  });
});

test("how to use fastglob scan model file", async () => {
  const expression =
    process.platform === "win32"
      ? `${fg.convertPathToPattern(settingsService.getSettings().basePath)}/**/*.safetensors`
      : `${settingsService.getSettings().basePath}/**/*.safetensors`;
  const safetensors = await fg.async(expression);
  expect(safetensors.length > 0).toBe(true);
});
