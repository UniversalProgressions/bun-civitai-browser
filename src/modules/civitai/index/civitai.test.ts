import civitai from "./civitai";
import { describe, expect, test } from "bun:test";
import { treaty } from '@elysiajs/eden'

const api = treaty(civitai)

describe("civitai", () => {
  test("submit hash and return modelversion data", async () => {
    const data = await api.api.v1.modelVersionByHash({ hash: `F9BBCB411CD16EA1F368FCADA3E781207AAB9EFAF2C9A77702236ABE5393FD08` }).get()
    expect(data.data?.id).toBeTypeOf("number")
  })
  test("submit versionId and return modelversion data", async () => {
    const data = await api.api.v1.modelVersionById.post({ modelVersionId: 2372422 })
    expect(data.data?.id).toBeTypeOf("number")
  })
  test("submit modelId and return modelversion data", async () => {
    const data = await api.api.v1.modelById.post({ modelId: 2087743 })
    expect(data.data?.id).toBeTypeOf("number")
  })
})