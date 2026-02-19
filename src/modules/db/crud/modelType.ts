import { prisma as defaultPrisma } from "../service";
import type { PrismaClient } from "../generated/client";

export async function findOrCreateOneModelType(
  modelTypeString: string,
  prisma: PrismaClient = defaultPrisma,
) {
  const record = await prisma.modelType.upsert({
    where: {
      name: modelTypeString,
    },
    update: {},
    create: {
      name: modelTypeString,
    },
  });
  return record;
}
