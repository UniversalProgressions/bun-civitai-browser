import { Elysia } from "elysia";
import { type } from "arktype";
import { prisma } from "#modules/db/service";

const dbController = new Elysia({ prefix: "/db" }).get(
  `/tags`,
  async ({ query }) => {
    const records = await prisma.tag.findMany({
      where: {
        name: {
          contains: query.tagKeyword,
        },
      },
    });
    return records.map((tag) => tag.name);
  },
  {
    query: type({ tagKeyword: "string" }),
    response: type("string[]"),
  }
);

export default dbController;
