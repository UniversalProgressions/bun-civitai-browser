import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const BaseModelPlain = t.Object({ id: t.Integer(), name: t.String() });

export const BaseModelRelations = t.Object({
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
  baseModelTypes: t.Array(
    t.Object({ id: t.Integer(), name: t.String(), baseModelId: t.Integer() }),
    { additionalProperties: true },
  ),
});

export const BaseModelPlainInputCreate = t.Object({ name: t.String() });

export const BaseModelPlainInputUpdate = t.Object({
  name: t.Optional(t.String()),
});

export const BaseModelRelationsInputCreate = t.Object({
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
  baseModelTypes: t.Optional(
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

export const BaseModelRelationsInputUpdate = t.Partial(
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
    baseModelTypes: t.Partial(
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

export const BaseModelWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: true })]),
          OR: t.Array(Self, { additionalProperties: true }),
          id: t.Integer(),
          name: t.String(),
        },
        { additionalProperties: true },
      ),
    { $id: "BaseModel" },
  ),
);

export const BaseModelWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.Integer(), name: t.String() },
            { additionalProperties: true },
          ),
          { additionalProperties: true },
        ),
        t.Union(
          [t.Object({ id: t.Integer() }), t.Object({ name: t.String() })],
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
        t.Partial(t.Object({ id: t.Integer(), name: t.String() })),
      ],
      { additionalProperties: true },
    ),
  { $id: "BaseModel" },
);

export const BaseModelSelect = t.Partial(
  t.Object({
    id: t.Boolean(),
    name: t.Boolean(),
    modelVersions: t.Boolean(),
    baseModelTypes: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const BaseModelInclude = t.Partial(
  t.Object({
    modelVersions: t.Boolean(),
    baseModelTypes: t.Boolean(),
    _count: t.Boolean(),
  }),
);

export const BaseModelOrderBy = t.Partial(
  t.Object({
    id: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
    name: t.Union([t.Literal("asc"), t.Literal("desc")], {
      additionalProperties: true,
    }),
  }),
);

export const BaseModel = t.Composite([BaseModelPlain, BaseModelRelations]);

export const BaseModelInputCreate = t.Composite([
  BaseModelPlainInputCreate,
  BaseModelRelationsInputCreate,
]);

export const BaseModelInputUpdate = t.Composite([
  BaseModelPlainInputUpdate,
  BaseModelRelationsInputUpdate,
]);
