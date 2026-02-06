import { Elysia } from "elysia";
import V1 from "./v1";

export default new Elysia({ prefix: `/civitai_api` }).use(V1);
