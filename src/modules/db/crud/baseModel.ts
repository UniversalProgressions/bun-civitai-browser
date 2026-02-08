import { prisma } from "../service";

export async function findOrCreateOneBaseModel(baseModelString: string) {
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
