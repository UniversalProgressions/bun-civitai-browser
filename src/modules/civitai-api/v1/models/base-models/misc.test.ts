import { baseModelsSchema, BaseModelsArray } from "./misc.js";
import { type } from "arktype";
import { test, expect } from "bun:test";

test("test enumerated type in runtime", () => {
  const out = baseModelsSchema("Illustrious");

  let result = ``;

  if (out instanceof type.errors) {
    result = "error";
  } else {
    result = `${typeof out}`;
  }

  expect(result).toBe("string");
});

test("test baseModelsArray is a Array<string> type", () => {
  const ref = BaseModelsArray;

  expect(BaseModelsArray.length > 10).toBe(true);
  expect(BaseModelsArray[0]).toBeTypeOf("string");
});
