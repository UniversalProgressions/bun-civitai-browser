import { prisma as defaultPrisma } from "../service";
import type { Creator } from "#civitai-api/v1/models/creators";
import type { PrismaClient } from "../generated/client";

export async function upsertOneCreator(
  creator: Creator,
  prisma: PrismaClient = defaultPrisma,
) {
  const record = creator.username
    ? await prisma.creator.upsert({
        where: {
          username: creator.username,
        },
        update: {
          link: creator.link ? creator.link : undefined,
          image: creator.image ? creator.image : undefined,
        },
        create: {
          username: creator.username,
          link: creator.link ? creator.link : undefined,
          image: creator.image ? creator.image : undefined,
        },
      })
    : undefined;
  return record;
}

export async function findOrCreateOneCreator(
  creator: Creator,
  prisma: PrismaClient = defaultPrisma,
) {
  const record = creator.username
    ? await prisma.creator.upsert({
        where: {
          username: creator.username,
        },
        update: {},
        create: {
          username: creator.username,
          link: creator.link ? creator.link : undefined,
          image: creator.image ? creator.image : undefined,
        },
      })
    : undefined;
  return record;
}
