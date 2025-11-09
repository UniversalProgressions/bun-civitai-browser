import { prisma } from "../../../db/service";
import { ModelsRequestSort } from "../../models/baseModels/misc";
import { findOrCreateOneCreator } from "./creator";
import { findOrCreateOneModelType } from "./modelType";
import type { ModelsRequestOpts, Model } from "../../models/models_endpoint";
import type { ModelOrderByWithRelationInput, ModelWhereInput } from "../../../../../generated/models";
import { Model as ModelTypeboxSchema } from "../../../../../generated/typebox/Model";
import { Static } from "elysia";
import { extractFilenameFromUrl } from "../sharedUtils";

export type ModelWithAllRelations = Static<typeof ModelTypeboxSchema>

export async function findOrCreateOneModelId(modelId: Model) {
  const creatorRecord = modelId.creator
    ? await findOrCreateOneCreator(modelId.creator)
    : undefined;
  const modelTypeRecord = await findOrCreateOneModelType(modelId.type);

  const record = await prisma.model.upsert({
    where: {
      id: modelId.id,
    },
    update: {},
    create: {
      id: modelId.id,
      name: modelId.name,
      creatorId: creatorRecord ? creatorRecord.id : undefined,
      typeId: modelTypeRecord.id,
      nsfw: modelId.nsfw,
      nsfwLevel: modelId.nsfwLevel,
      tags: {
        connectOrCreate: modelId.tags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
      previewFile: modelId.modelVersions[0]?.images[0]?.url ? extractFilenameFromUrl(modelId.modelVersions[0]?.images[0]?.url) : undefined
    },
  });
  return record;
}

function processCursorPaginationFindMany(params: ModelsRequestOpts): ModelWhereInput {
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
  }
}

function processSort(sortType?: ModelsRequestSort): ModelOrderByWithRelationInput {
  switch (sortType) {
    case "Newest":
      return {
        id: 'desc'
      }

    default: // defualt as Newest
      return {
        id: 'desc'
      }
  }
}

export async function cursorPaginationQuery(params: ModelsRequestOpts) {
  const [records, totalCount] = await prisma.$transaction([
    prisma.model.findMany({
      take: 20,
      where: processCursorPaginationFindMany(params),
      include: {
        creator: true,
        modelVersions: true,
        tags: true,
        type: true,
      },
      orderBy: processSort(params.sort)
    }),
    prisma.model.count({
      where: processCursorPaginationFindMany(params),
    }),
  ])

  return { records, totalCount }
}

export async function cursorPaginationNext(params: ModelsRequestOpts, modelIdAsCursor: number) {
  const records = await prisma.model.findMany({
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
    orderBy: processSort(params.sort)
  })
  type test = typeof records
  return records
}

export async function simplePagination(params: ModelsRequestOpts) {
  // defaultPageSize
  if (params.limit === undefined) {
    params.limit = 20
  }
  if (params.page === undefined || params.page < 1) {
    params.page = 1
  }
  const [records, totalCount] = await prisma.$transaction([
    prisma.model.findMany({
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      where: processCursorPaginationFindMany(params),
      include: {
        creator: true,
        modelVersions: true,
        tags: true,
        type: true,
      },
      orderBy: processSort(params.sort)
    }),
    prisma.model.count({
      where: processCursorPaginationFindMany(params),
    }),
  ])

  return { records, totalCount }
}