import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import SettingsRouter from "./settings";
import CivitAIRouter from "./civitai-deprecated/index/index";
import CivitaiV1Router from "./civitai";
import LocalModelsRouter from "./local-models";
import DbRouter from "./db";

export const app = new Elysia()
  .use(html())
  .use(cors())
  .use(openapi())
  .use(staticPlugin({ prefix: "/", assets: "public" }))
  .use(SettingsRouter)
  .use(CivitaiV1Router)
  .use(LocalModelsRouter)
  .use(DbRouter);
// .use(CivitAIRouter);
export type App = typeof app;
