import { prisma as defaultPrisma } from "../service";
import type { PrismaClient } from "../generated/client";

export async function findOrCreateOneBaseModelType(
  baseModelTypeString: string,
  baseModelId: number,
  prisma: PrismaClient = defaultPrisma,
) {
  const record = await prisma.baseModelType.upsert({
    where: {
      name: baseModelTypeString,
    },
    update: {},
    create: {
      name: baseModelTypeString,
      baseModelId: baseModelId,
    },
  });
  return record;
}
