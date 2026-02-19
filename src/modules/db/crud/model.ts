import { prisma as defaultPrisma } from "../service";
import { ModelsRequestSort } from "#civitai-api/v1/models";
import { findOrCreateOneCreator } from "./creator";
import { findOrCreateOneModelType } from "./modelType";
import type { ModelsRequestOptions, Model } from "#civitai-api/v1/models";
import type {
  ModelOrderByWithRelationInput,
  ModelWhereInput,
} from "../generated/models";
import { Model as ModelTypeboxSchema } from "../generated/typebox/Model";
import { Static } from "elysia";
import type { PrismaClient } from "../generated/client";

export type ModelWithAllRelations = Static<typeof ModelTypeboxSchema>;

export async function findOrCreateOneModel(
  model: Model,
  prisma: PrismaClient = defaultPrisma,
) {
  model.modelVersions = []; // These data will stored inside modelVersion.json field
  const creatorRecord = model.creator
    ? await findOrCreateOneCreator(model.creator, prisma)
    : undefined;
  const modelTypeRecord = await findOrCreateOneModelType(model.type, prisma);

  const record = await prisma.model.upsert({
    where: {
      id: model.id,
    },
    update: {
      json: model,
    },
    create: {
      id: model.id,
      name: model.name,
      creatorId: creatorRecord ? creatorRecord.id : undefined,
      typeId: modelTypeRecord.id,
      nsfw: model.nsfw,
      nsfwLevel: model.nsfwLevel,
      tags: {
        connectOrCreate: model.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
      json: model,
    },
  });
  return record;
}

function processCursorPaginationFindMany(
  params: ModelsRequestOptions,
): ModelWhereInput {
  return {
    name: {
      contains: params.query,
      // mode: 'insensitive', see sql migration "init", added "COLLATE NOCASE" to TEXT Field.
    },
    tags: {
      some: {
        name: { in: params.tag },
      },
    },
    creator: {
      username: params.username,
      // mode: 'insensitive', see sql migration "init", added "COLLATE NOCASE" to TEXT Field.
    },
    type: {
      name: { in: params.types },
    },
    nsfw: params.nsfw,
    modelVersions: {
      some: {
        baseModel: {
          name: { in: params.baseModels },
        },
      },
    },
  };
}

function processSort(
  sortType?: ModelsRequestSort,
): ModelOrderByWithRelationInput {
  switch (sortType) {
    case "Newest":
      return {
        id: "desc",
      };

    default: // defualt as Newest
      return {
        id: "desc",
      };
  }
}

export async function cursorPaginationQuery(params: ModelsRequestOptions) {
  const [records, totalCount] = await defaultPrisma.$transaction([
    defaultPrisma.model.findMany({
      take: 20,
      where: processCursorPaginationFindMany(params),
      include: {
        creator: true,
        modelVersions: true,
        tags: true,
        type: true,
      },
      orderBy: processSort(params.sort),
    }),
    defaultPrisma.model.count({
      where: processCursorPaginationFindMany(params),
    }),
  ]);

  return { records, totalCount };
}

export async function cursorPaginationNext(
  params: ModelsRequestOptions,
  modelIdAsCursor: number,
) {
  const records = await defaultPrisma.model.findMany({
    cursor: { id: modelIdAsCursor },
    take: 20,
    skip: 1,
    where: processCursorPaginationFindMany(params),
    include: {
      creator: true,
      modelVersions: true,
      tags: true,
      type: true,
    },
    orderBy: processSort(params.sort),
  });
  type test = typeof records;
  return records;
}

export async function simplePagination(params: ModelsRequestOptions) {
  // defaultPageSize
  if (params.limit === undefined) {
    params.limit = 20;
  }
  if (params.page === undefined || params.page < 1) {
    params.page = 1;
  }
  const [records, totalCount] = await defaultPrisma.$transaction([
    defaultPrisma.model.findMany({
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      where: processCursorPaginationFindMany(params),
      include: {
        creator: true,
        modelVersions: true,
        tags: true,
        type: true,
      },
      orderBy: processSort(params.sort),
    }),
    defaultPrisma.model.count({
      where: processCursorPaginationFindMany(params),
    }),
  ]);

  return { records, totalCount };
}
