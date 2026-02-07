import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import SettingsRouter from "./settings";
import CivitAIRouter from "./civitai-deprecated/index/index";

export const app = new Elysia()
  .use(html())
  .use(cors())
  .use(openapi())
  .use(staticPlugin({ prefix: "/", assets: "public" }))
  .use(SettingsRouter);
// .use(CivitAIRouter);
export type App = typeof app;
