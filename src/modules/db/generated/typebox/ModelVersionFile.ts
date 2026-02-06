import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ModelVersionFilePlain = t.Object({
  id: t.Integer(),
  sizeKB: t.Number(),
  name: t.String(),
  type: t.String(),
  downloadUrl: t.String(),
  modelVersionId: t.Integer(),
});

export const ModelVersionFileRelations = t.Object({
  modelVersion: t.Object({
    id: t.Integer(),
    modelId: t.Integer(),
    name: t.String(),
    baseModelId: t.Integer(),
    baseModelTypeId: __nullable__(t.Integer()),
    publishedAt: __nullable__(t.Date()),
    nsfwLevel: t.Integer(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
});

export const ModelVersionFilePlainInputCreate = t.Object({
  sizeKB: t.Number(),
  name: t.String(),
  type: t.String(),
  downloadUrl: t.String(),
});

export const ModelVersionFilePlainInputUpdate = t.Object({
  sizeKB: t.Optional(t.Number()),
  name: t.Optional(t.String()),
  type: t.Optional(t.String()),
  downloadUrl: t.Optional(t.String()),
});

export const ModelVersionFileRelationsInputCreate = t.Object({
  modelVersion: t.Object({
    connect: t.Object({
      id: t.Integer(),
    }),
  }),
});

export const ModelVersionFileRelationsInputUpdate = t.Partial(
  t.Object({
    modelVersion: t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
  }),
);

export const ModelVersionFileWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.Integer(),
          sizeKB: t.Number(),
          name: t.String(),
          type: t.String(),
          downloadUrl: t.String(),
          modelVersionId: t.Integer(),
        },
        { additionalProperties: true },
      ),
    { $id: "ModelVersionFile" },
  ),
);

export const ModelVersionFileWhereUnique = t.Recursive(
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
            sizeKB: t.Number(),
            name: t.String(),
            type: t.String(),
            downloadUrl: t.String(),
            modelVersionId: t.Integer(),
          }),
        ),
      ],
      { additionalProperties: true },
    ),
  { $id: "ModelVersionFile" },
);

export const ModelVersionFileSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    sizeKB: t.Boolean(),
    name: t.Boolean(),
    type: t.Boolean(),
    downloadUrl: t.Boolean(),
    modelVersionId: t.Boolean(),
    modelVersion: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const ModelVersionFileInclude = t.Partial(
  t.Object({ modelVersion: t.Boolean(), _count: t.Boolean() }),
);

export const ModelVersionFileOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    sizeKB: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    name: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    type: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    downloadUrl: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    modelVersionId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
  }),
);

export const ModelVersionFile = t.Composite([
  ModelVersionFilePlain,
  ModelVersionFileRelations,
]);

export const ModelVersionFileInputCreate = t.Composite([
  ModelVersionFilePlainInputCreate,
  ModelVersionFileRelationsInputCreate,
]);

export const ModelVersionFileInputUpdate = t.Composite([
  ModelVersionFilePlainInputUpdate,
  ModelVersionFileRelationsInputUpdate,
]);
