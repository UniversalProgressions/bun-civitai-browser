import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ModelPlain = t.Object({
  id: t.Integer(),
  name: t.String(),
  creatorId: __nullable__(t.Integer()),
  typeId: t.Integer(),
  nsfw: t.Boolean(),
  nsfwLevel: t.Integer(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const ModelRelations = t.Object({
  modelVersions: t.Array(
    t.Object({
      id: t.Integer(),
      modelId: t.Integer(),
      name: t.String(),
      baseModelId: t.Integer(),
      baseModelTypeId: __nullable__(t.Integer()),
      nsfwLevel: t.Integer(),
      createdAt: t.Date(),
      updatedAt: t.Date(),
    }),
    { additionalProperties: true },
  ),
  tags: t.Array(t.Object({ id: t.Integer(), name: t.String() }), {
    additionalProperties: true,
  }),
  creator: __nullable__(
    t.Object({
      id: t.Integer(),
      username: t.String(),
      link: __nullable__(t.String()),
      image: __nullable__(t.String()),
    }),
  ),
  type: t.Object({ id: t.Integer(), name: t.String() }),
});

export const ModelPlainInputCreate = t.Object({
  name: t.String(),
  nsfw: t.Boolean(),
  nsfwLevel: t.Integer(),
});

export const ModelPlainInputUpdate = t.Object({
  name: t.Optional(t.String()),
  nsfw: t.Optional(t.Boolean()),
  nsfwLevel: t.Optional(t.Integer()),
});

export const ModelRelationsInputCreate = t.Object({
  modelVersions: t.Optional(
    t.Object({
      connect: t.Array(
        t.Object({
          id: t.Integer(),
        }),
        { additionalProperties: true },
      ),
    }),
  ),
  tags: t.Optional(
    t.Object({
      connect: t.Array(
        t.Object({
          id: t.Integer(),
        }),
        { additionalProperties: true },
      ),
    }),
  ),
  creator: t.Optional(
    t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
  ),
  type: t.Object({
    connect: t.Object({
      id: t.Integer(),
    }),
  }),
});

export const ModelRelationsInputUpdate = t.Partial(
  t.Object({
    modelVersions: t.Partial(
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
    tags: t.Partial(
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
    creator: t.Partial(
      t.Object({
        connect: t.Object({
          id: t.Integer(),
        }),
        disconnect: t.Boolean(),
      }),
    ),
    type: t.Object({
      connect: t.Object({
        id: t.Integer(),
      }),
    }),
  }),
);

export const ModelWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.Integer(),
          name: t.String(),
          creatorId: t.Integer(),
          typeId: t.Integer(),
          nsfw: t.Boolean(),
          nsfwLevel: t.Integer(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: true },
      ),
    { $id: "Model" },
  ),
);

export const ModelWhereUnique = t.Recursive(
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
            name: t.String(),
            creatorId: t.Integer(),
            typeId: t.Integer(),
            nsfw: t.Boolean(),
            nsfwLevel: t.Integer(),
            createdAt: t.Date(),
            updatedAt: t.Date(),
          }),
        ),
      ],
      { additionalProperties: true },
    ),
  { $id: "Model" },
);

export const ModelSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    name: t.Boolean(),
    creatorId: t.Boolean(),
    typeId: t.Boolean(),
    nsfw: t.Boolean(),
    nsfwLevel: t.Boolean(),
    modelVersions: t.Boolean(),
    tags: t.Boolean(),
    createdAt: t.Boolean(),
    updatedAt: t.Boolean(),
    creator: t.Boolean(),
    type: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const ModelInclude = t.Partial(
  t.Object({
    modelVersions: t.Boolean(),
    tags: t.Boolean(),
    creator: t.Boolean(),
    type: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const ModelOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    name: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    creatorId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    typeId: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    nsfw: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const Model = t.Composite([ModelPlain, ModelRelations]);

export const ModelInputCreate = t.Composite([
  ModelPlainInputCreate,
  ModelRelationsInputCreate,
]);

export const ModelInputUpdate = t.Composite([
  ModelPlainInputUpdate,
  ModelRelationsInputUpdate,
]);
