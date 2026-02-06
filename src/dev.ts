import { app } from "./modules/index";

app.listen(3000);
console.log(`🦊 Elysia is running at ${app.server?.url}`);
