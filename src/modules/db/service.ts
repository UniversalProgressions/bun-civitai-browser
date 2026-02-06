import { PrismaClient } from "../../../generated/client";
import { BunSQLiteAdapter } from "@abcx3/prisma-bun-adapter";

// Create adapter factory
const adapter = new BunSQLiteAdapter({ filename: "./db.sqlite3" }); // keep the name to be same as in schema.prisma

// Initialize Prisma with adapter
export const prisma = new PrismaClient({ adapter });

// Prisma ORM client
// export const prisma = new PrismaClient()

// Use Prisma as usual
// const users = await prisma.user.findMany()
