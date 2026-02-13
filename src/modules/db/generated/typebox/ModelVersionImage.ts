import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ModelVersionImagePlain = t.Object({
  id: t.Integer(),
  url: t.String(),
  nsfwLevel: t.Integer(),
  width: t.Integer(),
  height: t.Integer(),
  hash: t.String(),
  type: t.String(),
  modelVersionId: t.Integer(),
});

export const ModelVersionImageRelations = t.Object({
  modelVersion: t.Object({
    id: t.Integer(),
    modelId: t.Integer(),
    name: t.String(),
    baseModelId: t.Integer(),
    baseModelTypeId: __nullable__(t.Integer()),
    nsfwLevel: t.Integer(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
});

export const ModelVersionImagePlainInputCreate = t.Object({
  url: t.String(),
  nsfwLevel: t.Integer(),
  width: t.Integer(),
  height: t.Integer(),
  hash: t.String(),
  type: t.String(),
});

export const ModelVersionImagePlainInputUpdate = t.Object({
  url: t.Optional(t.String()),
  nsfwLevel: t.Optional(t.Integer()),
  width: t.Optional(t.Integer()),
  height: t.Optional(t.Integer()),
  hash: t.Optional(t.String()),
  type: t.Optional(t.String()),
});

export const ModelVersionImageRelationsInputCreate = t.Object({
  modelVersion: t.Object({
    connect: t.Object({
      id: t.Integer(),
    }),
  }),
});

export const ModelVersionImageRelationsInputUpdate = t.Partial(
  t.Object({
    modelVersion: t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
  }),
);

export const ModelVersionImageWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.Integer(),
          url: t.String(),
          nsfwLevel: t.Integer(),
          width: t.Integer(),
          height: t.Integer(),
          hash: t.String(),
          type: t.String(),
          modelVersionId: t.Integer(),
        },
        { additionalProperties: true },
      ),
    { $id: "ModelVersionImage" },
  ),
);

export const ModelVersionImageWhereUnique = t.Recursive(
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
            url: t.String(),
            nsfwLevel: t.Integer(),
            width: t.Integer(),
            height: t.Integer(),
            hash: t.String(),
            type: t.String(),
            modelVersionId: t.Integer(),
          }),
        ),
      ],
      { additionalProperties: true },
    ),
  { $id: "ModelVersionImage" },
);

export const ModelVersionImageSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    url: t.Boolean(),
    nsfwLevel: t.Boolean(),
    width: t.Boolean(),
    height: t.Boolean(),
    hash: t.Boolean(),
    type: t.Boolean(),
    modelVersionId: t.Boolean(),
    modelVersion: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const ModelVersionImageInclude = t.Partial(
  t.Object({ modelVersion: t.Boolean(), _count: t.Boolean() }),
);

export const ModelVersionImageOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    url: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    nsfwLevel: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    width: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    height: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    hash: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    type: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    modelVersionId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
  }),
);

export const ModelVersionImage = t.Composite([
  ModelVersionImagePlain,
  ModelVersionImageRelations,
]);

export const ModelVersionImageInputCreate = t.Composite([
  ModelVersionImagePlainInputCreate,
  ModelVersionImageRelationsInputCreate,
]);

export const ModelVersionImageInputUpdate = t.Composite([
  ModelVersionImagePlainInputUpdate,
  ModelVersionImageRelationsInputUpdate,
]);
