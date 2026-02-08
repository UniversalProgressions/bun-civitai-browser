import { prisma } from "../service";

export async function findOrCreateOneBaseModelType(
  baseModelTypeString: string,
  baseModelId: number,
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
