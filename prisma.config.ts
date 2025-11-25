import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: 'schema.prisma',
  migrations: {
    path: 'migrations',
    // seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: "file:./db.sqlite3" // env("db.sqlite3")
  }
});