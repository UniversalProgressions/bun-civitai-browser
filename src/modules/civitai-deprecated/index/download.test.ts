import indexRouter from "./index";
import { modelId2Model } from "#modules/civitai-deprecated/service/sharedUtils.js";
import { describe, test, expect } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { getGopeedClient } from "./download";

const api = treaty(indexRouter);

describe("civitai download function test.", () => {
  test(`test Gopeed API`, async () => {
    // Gopeed API went error, waiting for further test.
    const gopeed = getGopeedClient();
    const result = await gopeed.createTask({
      req: { url: `http://127.0.0.1:3000/civitai/local/media/57320036.jpeg` },
      opt: { path: `C:\\Users\\APboi\\Downloads\\test` },
    });
    expect(result).toBeTypeOf("string");
  });
  test(`test download function.`, async () => {
    const modelId = 2104915;
    const modelVersionId = 2381348;
    const { data } = await api.civitai.api.v1.modelById.post({ modelId });
    // console.log(model)

    const result = await api.civitai.download.modelVersion.post({
      model: modelId2Model(data!),
      modelVersionId,
    });
    expect(result.data);
  }, 120000);
});
