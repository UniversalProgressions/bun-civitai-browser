import { prisma } from "../service";

export async function searchTag(tag: string) {
  const result = await prisma.tag.findMany({
    where: {
      name: {
        contains: tag,
      },
    },
  });
  return result;
}
