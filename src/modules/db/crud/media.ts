import { prisma } from "../service";
import type { ModelImage } from "#civitai-api/v1/models";
import { extractIdFromImageUrl } from "#civitai-api/v1/utils";

export async function createOrConnectImagesByModelIdEndpointInfo(
  modelVersionId: number,
  mediaArray: Array<ModelImage>,
) {
  const mediaArrayWithId = mediaArray.map((image) => {
    // Extract image ID from URL since ModelImage no longer has id field
    const idResult = extractIdFromImageUrl(image.url);
    if (idResult.isErr()) {
      throw new Error(
        `Failed to extract image ID from URL: ${image.url}, error: ${idResult.error.message}`,
      );
    }
    const id = idResult.value;

    return {
      id,
      url: image.url,
      nsfwLevel: image.nsfwLevel,
      width: image.width,
      height: image.height,
      hash: image.hash,
      type: image.type,
    };
  });

  // upsert images
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
            gopeedTaskFinished: false, // Add required field
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
