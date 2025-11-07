import { Elysia } from "elysia";
import localModelRouter from "./local";
import dbRouter from "./db";
import civitaiApiMirror from "./civitai";

export default new Elysia({ prefix: "/civitai" })
  .use(localModelRouter)
  .use(civitaiApiMirror)
  .use(dbRouter);
