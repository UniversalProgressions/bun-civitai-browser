import { prisma as defaultPrisma } from "../service";
import type { PrismaClient } from "../generated/client";

export async function findOrCreateOneBaseModel(
  baseModelString: string,
  prisma: PrismaClient = defaultPrisma,
) {
  const record = await prisma.baseModel.upsert({
    where: {
      name: baseModelString,
    },
    update: {},
    create: {
      name: baseModelString,
    },
  });
  return record;
}
