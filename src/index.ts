import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { html } from "@elysiajs/html";
import { staticPlugin } from "@elysiajs/static";
import SettingsRouter from "./modules/settings";
import CivitAIRouter from "./modules/civitai/index";
import frontend from "./html/index.html";

const app = new Elysia()
  .use(html())
  .use(cors())
  .use(openapi())
  .use(staticPlugin({ prefix: "/", assets: "public" }))
  .use(SettingsRouter)
  .use(CivitAIRouter)
  .listen(3000);
export type App = typeof app;

console.log(`🦊 Elysia is running at ${app.server?.url}`);
