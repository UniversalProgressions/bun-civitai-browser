import type { ModelVersion } from "../../../../civitai-api/v1/models/models";
import { extractFilenameFromUrl } from "../../../../civitai-api/v1/utils";
import MediaGallery from "../../../components/gallery";

interface LocalModelCardContentLeftSideProps {
  modelVersion: ModelVersion;
  modelId: number;
  modelType: string;
}

export function LocalModelCardContentLeftSide({
  modelVersion,
  modelId,
  modelType,
}: LocalModelCardContentLeftSideProps) {
  const images = modelVersion.images || [];

  // 过滤掉无法提取文件名的图片，避免空字符串src错误
  const galleryItems = images
    .map((i) => {
      const filenameResult = extractFilenameFromUrl(i.url);
      if (filenameResult.isErr()) {
        // 仅在开发环境中显示警告
        if (import.meta.env.DEV) {
          console.warn(
            `Failed to extract filename from URL: ${i.url}`,
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
      const id = parseInt(filename.split(".")[0], 10) || 0;

      return {
        id,
        url,
        nsfwLevel: i.nsfwLevel,
        width: i.width,
        height: i.height,
        hash: i.hash,
        type: i.type,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

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
