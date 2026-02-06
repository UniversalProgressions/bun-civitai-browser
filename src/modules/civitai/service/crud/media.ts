import { prisma } from "../../../db/service";
import type { ModelId_ModelVersionImage } from "../../models/modelId_endpoint";
import type { ModelVersionImage } from "../../models/models_endpoint";
import { extractFilenameFromUrl, removeFileExtension } from "../sharedUtils";

export async function createOrConnectImagesByModelIdEndpointInfo(
  modelVersionId: number,
  mediaArray: Array<ModelId_ModelVersionImage>,
) {
  const mediaArrayWithId: Array<ModelVersionImage> = mediaArray.map((image) => {
    const imageFileName = extractFilenameFromUrl(image.url);
    const imageFileNameWithoutExt = removeFileExtension(imageFileName);
    return {
      id: Number(imageFileNameWithoutExt),
      ...image,
    };
  });
  const mvRecord = await prisma.modelVersion.update({
    where: {
      id: modelVersionId,
    },
    data: {
      images: {
        connectOrCreate: mediaArrayWithId.map((image) => ({
          where: { id: image.id },
          create: {
            id: image.id,
            url: image.url,
            nsfwLevel: image.nsfwLevel,
            width: image.width,
            height: image.height,
            hash: image.hash,
            type: image.type,
          },
        })),
      },
    },
    include: {
      images: true,
    },
  });
  return mvRecord.images;
}
