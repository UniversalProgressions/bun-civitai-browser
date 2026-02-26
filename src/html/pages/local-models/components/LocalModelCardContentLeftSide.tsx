import type {
  ModelVersion,
  ModelImageWithId,
} from "../../../../civitai-api/v1/models/models";
import { extractFilenameFromUrl } from "../../../../civitai-api/v1/utils";
import MediaGallery from "../../../components/gallery";

interface LocalModelCardContentLeftSideProps {
  modelVersion: ModelVersion;
  modelId: number;
  modelType: string;
  precomputedImageUrls?: string[]; // 预计算的媒体URL
}

export function LocalModelCardContentLeftSide({
  modelVersion,
  modelId,
  modelType,
  precomputedImageUrls,
}: LocalModelCardContentLeftSideProps) {
  const images = modelVersion.images || [];

  // 优先使用预计算的媒体URL
  let galleryItems: ModelImageWithId[] = [];

  if (precomputedImageUrls && precomputedImageUrls.length > 0) {
    // 使用预计算的URL
    galleryItems = images
      .map((image, index) => {
        const precomputedUrl = precomputedImageUrls[index];
        return {
          id: image.id || index,
          url: precomputedUrl || image.url, // 如果预计算URL不存在，回退到原始URL
          nsfwLevel: image.nsfwLevel,
          width: image.width,
          height: image.height,
          hash: image.hash,
          type: image.type,
        };
      })
      .filter((item) => item.url && item.url.trim() !== ""); // 过滤掉空URL
  } else {
    // 如果没有预计算URL，使用原始逻辑（向后兼容）
    // 注意：extractFilenameFromUrl 已经静态导入了

    galleryItems = images
      .map((image, index) => {
        const filenameResult = extractFilenameFromUrl(image.url);
        if (filenameResult.isErr()) {
          // 仅在开发环境中显示警告
          if (import.meta.env.DEV) {
            console.warn(
              `Failed to extract filename from URL: ${image.url}`,
              filenameResult.error,
            );
          }
          return null;
        }

        const filename = filenameResult.value;
        // 生成完整的URL，避免gallery.tsx中new URL()解析相对路径时出错
        const relativeUrl = `/local-models/media?modelId=${modelId}&versionId=${modelVersion.id}&modelType=${modelType}&filename=${encodeURIComponent(filename)}`;
        const url =
          typeof window !== "undefined"
            ? `${window.location.origin}${relativeUrl}`
            : relativeUrl;

        return {
          id: image.id || index,
          url,
          nsfwLevel: image.nsfwLevel,
          width: image.width,
          height: image.height,
          hash: image.hash,
          type: image.type,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  return (
    <div>
      {galleryItems.length > 0 ? (
        <MediaGallery items={galleryItems} />
      ) : (
        <img
          title="Have no preview"
          alt="No preview available"
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo preview%3C/text%3E%3C/svg%3E"
        />
      )}
    </div>
  );
}
