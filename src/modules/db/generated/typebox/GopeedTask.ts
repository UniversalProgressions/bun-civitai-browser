import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const GopeedTaskPlain = t.Object({
  id: t.String(),
  isFinished: t.Boolean(),
  fileId: t.Integer(),
  isMedia: t.Boolean(),
  modelVersionId: t.Integer(),
});

export const GopeedTaskRelations = t.Object({
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

export const GopeedTaskPlainInputCreate = t.Object({
  isFinished: t.Boolean(),
  isMedia: t.Boolean(),
});

export const GopeedTaskPlainInputUpdate = t.Object({
  isFinished: t.Optional(t.Boolean()),
  isMedia: t.Optional(t.Boolean()),
});

export const GopeedTaskRelationsInputCreate = t.Object({
  modelVersion: t.Object({
    connect: t.Object({
      id: t.Integer(),
    }),
  }),
});

export const GopeedTaskRelationsInputUpdate = t.Partial(
  t.Object({
    modelVersion: t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
  }),
);

export const GopeedTaskWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.String(),
          isFinished: t.Boolean(),
          fileId: t.Integer(),
          isMedia: t.Boolean(),
          modelVersionId: t.Integer(),
        },
        { additionalProperties: true },
      ),
    { $id: "GopeedTask" },
  ),
);

export const GopeedTaskWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              fileId: t.Integer(),
              modelVersionId: t.Integer(),
            },
            { additionalProperties: true },
          ),
          { additionalProperties: true },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({ fileId: t.Integer() }),
            t.Object({ modelVersionId: t.Integer() }),
          ],
          { additionalProperties: true },
        ),
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
            id: t.String(),
            isFinished: t.Boolean(),
            fileId: t.Integer(),
            isMedia: t.Boolean(),
            modelVersionId: t.Integer(),
          }),
        ),
      ],
      { additionalProperties: true },
    ),
  { $id: "GopeedTask" },
);

export const GopeedTaskSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    isFinished: t.Boolean(),
    fileId: t.Boolean(),
    isMedia: t.Boolean(),
    modelVersionId: t.Boolean(),
    modelVersion: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const GopeedTaskInclude = t.Partial(
  t.Object({ modelVersion: t.Boolean(), _count: t.Boolean() }),
);

export const GopeedTaskOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    isFinished: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    fileId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    isMedia: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    modelVersionId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
  }),
);

export const GopeedTask = t.Composite([GopeedTaskPlain, GopeedTaskRelations]);

export const GopeedTaskInputCreate = t.Composite([
  GopeedTaskPlainInputCreate,
  GopeedTaskRelationsInputCreate,
]);

export const GopeedTaskInputUpdate = t.Composite([
  GopeedTaskPlainInputUpdate,
  GopeedTaskRelationsInputUpdate,
]);
