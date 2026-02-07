import { prisma } from "../../../db/service";
import type { Creator } from "../../models/creators_endpoint";

export async function upsertOneCreator(creator: Creator) {
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

export async function findOrCreateOneCreator(creator: Creator) {
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
