import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const CreatorPlain = t.Object({
  id: t.Integer(),
  username: t.String(),
  link: __nullable__(t.String()),
  image: __nullable__(t.String()),
});

export const CreatorRelations = t.Object({
  models: t.Array(
    t.Object({
      id: t.Integer(),
      name: t.String(),
      creatorId: __nullable__(t.Integer()),
      typeId: t.Integer(),
      nsfw: t.Boolean(),
      nsfwLevel: t.Integer(),
      json: t.Any(),
      createdAt: t.Date(),
      updatedAt: t.Date(),
    }),
    { additionalProperties: true },
  ),
});

export const CreatorPlainInputCreate = t.Object({
  username: t.String(),
  link: t.Optional(__nullable__(t.String())),
  image: t.Optional(__nullable__(t.String())),
});

export const CreatorPlainInputUpdate = t.Object({
  username: t.Optional(t.String()),
  link: t.Optional(__nullable__(t.String())),
  image: t.Optional(__nullable__(t.String())),
});

export const CreatorRelationsInputCreate = t.Object({
  models: t.Optional(
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

export const CreatorRelationsInputUpdate = t.Partial(
  t.Object({
    models: t.Partial(
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

export const CreatorWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.Integer(),
          username: t.String(),
          link: t.String(),
          image: t.String(),
        },
        { additionalProperties: true },
      ),
    { $id: "Creator" },
  ),
);

export const CreatorWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.Integer(), username: t.String() },
            { additionalProperties: true },
          ),
          { additionalProperties: true },
        ),
        t.Union(
          [t.Object({ id: t.Integer() }), t.Object({ username: t.String() })],
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
            id: t.Integer(),
            username: t.String(),
            link: t.String(),
            image: t.String(),
          }),
        ),
      ],
      { additionalProperties: true },
    ),
  { $id: "Creator" },
);

export const CreatorSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    username: t.Boolean(),
    link: t.Boolean(),
    image: t.Boolean(),
    models: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const CreatorInclude = t.Partial(
  t.Object({ models: t.Boolean(), _count: t.Boolean() }),
);

export const CreatorOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    username: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    link: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    image: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
  }),
);

export const Creator = t.Composite([CreatorPlain, CreatorRelations]);

export const CreatorInputCreate = t.Composite([
  CreatorPlainInputCreate,
  CreatorRelationsInputCreate,
]);

export const CreatorInputUpdate = t.Composite([
  CreatorPlainInputUpdate,
  CreatorRelationsInputUpdate,
]);
