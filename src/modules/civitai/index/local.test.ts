import LocalController from "./local";
import { type } from "arktype";
import { treaty } from '@elysiajs/eden'
import { describe, test, expect } from "bun:test";
import { model, model_version } from "../models/models_endpoint";
import { scanModelsAndSyncToDb } from "../service/crud/modelVersion";

const api = treaty(LocalController)

describe(`test local API`, () => {
  test(`test scan local models`, async () => {
    await scanModelsAndSyncToDb()
    // const result = await api.local.scanModels.head()
    // expect(result.data).toEqual(true)
    // const mi = model(await Bun.file(String.raw`D:\AI_Drawer\civitai_models\LORA\2104915\2104915.api-info.json`).json())
    // if (mi instanceof type.errors) {
    //   mi.throw()
    // }

    // const mv = model_version(await Bun.file(String.raw`D:\AI_Drawer\civitai_models\LORA\2104915\2381348\2381348.api-info.json`).json())
    // if (mv instanceof type.errors) {
    //   mv.throw()
    // }
  }, 120000)
})
