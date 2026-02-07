import { describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import { treaty } from "@elysiajs/eden";
import ElysiaCivi from "./index/index";

const app = new Elysia().use(ElysiaCivi);

const api = treaty(app);

describe("Civitai Elysia Module Test", () => {
  test("test models endpoint", async () => {
    const { data, error } = await api.civitai.api.v1.models.get();
    // example of how to handle errors in frontend
    if (error) {
      // error handle
      switch (error.status) {
        // case 422:
        //   console.error("Bad Request:", error);
        //   break;
        default:
          // handle unexpected errors
          console.error(error.status);
          console.warn(error.value);
          break;
      }
    }
    expect(data!.items.length > 0).toBeTrue();
    expect(typeof data?.metadata.nextPage).toBe("string");

    const nextPage = data?.metadata.nextPage!;
    const { data: nextPageData, error: nextPageError } =
      await api.civitai.api.v1.models.nextPage.get({
        query: { nextPage },
      });
    expect(nextPageData!.items.length > 0).toBeTrue();
  });
});
