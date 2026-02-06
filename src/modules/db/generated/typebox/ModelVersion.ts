import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ModelVersionPlain = t.Object({
  id: t.Integer(),
  modelId: t.Integer(),
  name: t.String(),
  baseModelId: t.Integer(),
  baseModelTypeId: __nullable__(t.Integer()),
  publishedAt: __nullable__(t.Date()),
  nsfwLevel: t.Integer(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const ModelVersionRelations = t.Object({
  model: t.Object({
    id: t.Integer(),
    name: t.String(),
    creatorId: __nullable__(t.Integer()),
    typeId: t.Integer(),
    nsfw: t.Boolean(),
    nsfwLevel: t.Integer(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
    previewFile: __nullable__(t.String()),
  }),
  baseModel: t.Object({ id: t.Integer(), name: t.String() }),
  baseModelType: __nullable__(
    t.Object({ id: t.Integer(), name: t.String(), baseModelId: t.Integer() }),
  ),
  files: t.Array(
    t.Object({
      id: t.Integer(),
      sizeKB: t.Number(),
      name: t.String(),
      type: t.String(),
      downloadUrl: t.String(),
      modelVersionId: t.Integer(),
    }),
    { additionalProperties: true },
  ),
  images: t.Array(
    t.Object({
      id: t.Integer(),
      url: t.String(),
      nsfwLevel: t.Integer(),
      width: t.Integer(),
      height: t.Integer(),
      hash: t.String(),
      type: t.String(),
      modelVersionId: t.Integer(),
    }),
    { additionalProperties: true },
  ),
});

export const ModelVersionPlainInputCreate = t.Object({
  name: t.String(),
  publishedAt: t.Optional(__nullable__(t.Date())),
  nsfwLevel: t.Integer(),
});

export const ModelVersionPlainInputUpdate = t.Object({
  name: t.Optional(t.String()),
  publishedAt: t.Optional(__nullable__(t.Date())),
  nsfwLevel: t.Optional(t.Integer()),
});

export const ModelVersionRelationsInputCreate = t.Object({
  model: t.Object({
    connect: t.Object({
      id: t.Integer(),
    }),
  }),
  baseModel: t.Object({
    connect: t.Object({
      id: t.Integer(),
    }),
  }),
  baseModelType: t.Optional(
    t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
  ),
  files: t.Optional(
    t.Object({
      connect: t.Array(
        t.Object({
          id: t.Integer(),
        }),
        { additionalProperties: true },
      ),
    }),
  ),
  images: t.Optional(
    t.Object({
      connect: t.Array(
        t.Object({
          id: t.Integer(),
        }),
        { additionalProperties: true },
      ),
    }),
  ),
});

export const ModelVersionRelationsInputUpdate = t.Partial(
  t.Object({
    model: t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
    baseModel: t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
    baseModelType: t.Partial(
      t.Object({
        connect: t.Object({
          id: t.Integer(),
        }),
        disconnect: t.Boolean(),
      }),
    ),
    files: t.Partial(
      t.Object({
        connect: t.Array(
          t.Object({
            id: t.Integer(),
          }),
          { additionalProperties: true },
        ),
        disconnect: t.Array(
          t.Object({
            id: t.Integer(),
          }),
          { additionalProperties: true },
        ),
      }),
    ),
    images: t.Partial(
      t.Object({
        connect: t.Array(
          t.Object({
            id: t.Integer(),
          }),
          { additionalProperties: true },
        ),
        disconnect: t.Array(
          t.Object({
            id: t.Integer(),
          }),
          { additionalProperties: true },
        ),
      }),
    ),
  }),
);

export const ModelVersionWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.Integer(),
          modelId: t.Integer(),
          name: t.String(),
          baseModelId: t.Integer(),
          baseModelTypeId: t.Integer(),
          publishedAt: t.Date(),
          nsfwLevel: t.Integer(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: true },
      ),
    { $id: "ModelVersion" },
  ),
);

export const ModelVersionWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object({ id: t.Integer() }, { additionalProperties: true }),
          { additionalProperties: true },
        ),
        t.Union([t.Object({ id: t.Integer() })], {
          additionalProperties: true,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
            NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
            OR: t.Array(Self, { additionalProperties: true }),
          }),
          { additionalProperties: true },
        ),
        t.Partial(
          t.Object({
            id: t.Integer(),
            modelId: t.Integer(),
            name: t.String(),
            baseModelId: t.Integer(),
            baseModelTypeId: t.Integer(),
            publishedAt: t.Date(),
            nsfwLevel: t.Integer(),
            createdAt: t.Date(),
            updatedAt: t.Date(),
          }),
        ),
      ],
      { additionalProperties: true },
    ),
  { $id: "ModelVersion" },
);

export const ModelVersionSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    modelId: t.Boolean(),
    name: t.Boolean(),
    baseModelId: t.Boolean(),
    baseModelTypeId: t.Boolean(),
    publishedAt: t.Boolean(),
    nsfwLevel: t.Boolean(),
    createdAt: t.Boolean(),
    updatedAt: t.Boolean(),
    model: t.Boolean(),
    baseModel: t.Boolean(),
    baseModelType: t.Boolean(),
    files: t.Boolean(),
    images: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const ModelVersionInclude = t.Partial(
  t.Object({
    model: t.Boolean(),
    baseModel: t.Boolean(),
    baseModelType: t.Boolean(),
    files: t.Boolean(),
    images: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const ModelVersionOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    modelId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    name: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    baseModelId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    baseModelTypeId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    publishedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    nsfwLevel: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
  }),
);

export const ModelVersion = t.Composite([
  ModelVersionPlain,
  ModelVersionRelations,
]);

export const ModelVersionInputCreate = t.Composite([
  ModelVersionPlainInputCreate,
  ModelVersionRelationsInputCreate,
]);

export const ModelVersionInputUpdate = t.Composite([
  ModelVersionPlainInputUpdate,
  ModelVersionRelationsInputUpdate,
]);
