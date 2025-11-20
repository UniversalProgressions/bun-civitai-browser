import { ModelLayout } from "./fileLayout";
import { describe, test, expect } from "bun:test";
import { join } from "node:path";
import sanitize from "sanitize-basename";
import { last } from "es-toolkit/compat";
import { Model, ModelsResponse, models_response } from "../models/models_endpoint";
import "dotenv/config";
import { getSettings } from "../../settings/service";
import fg from "fast-glob";
import modelData from "./models_res.json" with {type: "json"};

// @ts-nocheck
export const models_res = models_response(modelData) as ModelsResponse;
export const modelId1 = models_res.items[0];

describe("test layout class", () => {
  const basePath = __dirname;
  const milayout = new ModelLayout(basePath, modelId1 as Model);
  const mv = modelId1.modelVersions[0];
  const mvlayout = milayout.getModelVersionLayout(mv.id);
  const mfile = mv.files[0];
  const mimg = mv.images[0];
  test("test get media path", () => {
    expect(milayout.imgDir).toBe(join(basePath, "media"));
  });

  test("test get modelId path", () => {
    expect(milayout.modelIdPath).toBe(
      join(basePath, modelId1.type, modelId1.id.toString())
    );
  });

  test("test get modelVersion path", () => {
    expect(mvlayout.modelVersionPath).toBe(
      join(milayout.modelIdPath, mv.id.toString())
    );
  });

  test("test get file path", () => {
    expect(mvlayout.getFilePath(mfile.id)).toBe(
      join(mvlayout.modelVersionPath, `${mfile.id}_${sanitize(mfile.name)}`)
    );
  });

  test("test get image path", () => {
    expect(mvlayout.getMediaPath(mimg.id)).toBe(
      join(mvlayout.imgDir, `${mimg.id}.${last(mimg.url.split("."))}`)
    );
  });
});

test("how to use fastglob scan model file", async () => {
  const expression =
    process.platform === "win32"
      ? `${fg.convertPathToPattern(getSettings().basePath)}/**/*.safetensors`
      : `${getSettings().basePath}/**/*.safetensors`;
  const safetensors = await fg.async(expression);
  expect(safetensors.length > 0).toBe(true);
});
