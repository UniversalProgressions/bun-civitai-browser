import { PrismaClient } from "./generated/client";
import { PrismaBunSqlite } from "prisma-adapter-bun-sqlite";
// Create adapter factory
const adapter = new PrismaBunSqlite({
  url: `file:./db.sqlite3`,
  wal: {
    enabled: true,
    synchronous: "NORMAL", // 2-3x faster than FULL
    busyTimeout: 10000,
  },
}); // keep the name to be same as in schema.prisma

// Initialize Prisma with adapter
export const prisma = new PrismaClient({ adapter });

// Prisma ORM client
// export const prisma = new PrismaClient()

// Use Prisma as usual
// const users = await prisma.user.findMany()
