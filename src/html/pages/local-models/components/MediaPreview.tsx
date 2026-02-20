import {
  extractFilenameFromUrl,
  getFileType,
} from "../../../../civitai-api/v1/utils";
import type { Model } from "../../../../civitai-api/v1/models/models";

export function MediaPreview({
  fileName,
  model,
  version,
}: {
  fileName: string;
  model?: Model;
  version?: { id: number; images: Array<{ url: string }> };
}) {
  const fileType = getFileType(fileName);

  // 检查文件名是否有效
  if (!fileName || fileName.trim() === "") {
    // 返回一个占位符图片，避免空字符串src
    return (
      <img
        alt="No preview available"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo preview%3C/text%3E%3C/svg%3E"
      />
    );
  }

  // 构建新的媒体URL
  let srcPath: string;

  if (model && version) {
    // 从URL中提取modelType，假设URL格式包含类型信息
    // 如果无法从URL提取，可以默认使用'Checkpoint'
    let modelType = "Checkpoint";
    if (model.type) {
      modelType = model.type;
    }

    srcPath = `/local-models/media?modelId=${model.id}&versionId=${version.id}&modelType=${modelType}&filename=${encodeURIComponent(fileName)}`;
  } else {
    // 向后兼容：使用旧的URL格式
    srcPath = `${location.origin}/civitai/local/media/preview?previewFile=${fileName}`;
  }

  if (fileType === "video") {
    return <video src={srcPath} autoPlay loop muted></video>;
  } else if (fileType === "image") {
    return <img src={srcPath} alt={`Preview image: ${fileName}`} />;
  } else {
    // 对于未知文件类型，也使用占位符图片
    return (
      <img
        alt={`File type not supported: ${fileName}`}
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='10'%3E${encodeURIComponent(fileName)}%3C/text%3E%3C/svg%3E"
      />
    );
  }
}

/**
 * 获取模型的预览文件（第一个版本的第一个图片）
 */
export function getPreviewFile(model: Model): {
  fileName: string | null;
  versionId?: number;
} {
  if (model.modelVersions && model.modelVersions.length > 0) {
    // 使用第一个版本
    const firstVersion = model.modelVersions[0];
    if (firstVersion.images && firstVersion.images.length > 0) {
      const firstImage = firstVersion.images[0];
      const filenameResult = extractFilenameFromUrl(firstImage.url);
      if (filenameResult.isOk()) {
        return { fileName: filenameResult.value, versionId: firstVersion.id };
      }
    }
  }
  return { fileName: null };
}
