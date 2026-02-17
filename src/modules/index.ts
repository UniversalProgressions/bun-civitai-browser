import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import SettingsRouter from "./settings";
import CivitaiV1Router from "./civitai";
import LocalModelsRouter from "./local-models";
import DbRouter from "./db";
import GopeedRouter from "./gopeed";

export const app = new Elysia()
  .use(html())
  .use(cors())
  .use(openapi())
  .use(staticPlugin({ prefix: "/", assets: "public" }))
  .use(SettingsRouter)
  .use(CivitaiV1Router)
  .use(LocalModelsRouter)
  .use(DbRouter)
  .use(GopeedRouter);
// .use(CivitAIRouter);
export type App = typeof app;
