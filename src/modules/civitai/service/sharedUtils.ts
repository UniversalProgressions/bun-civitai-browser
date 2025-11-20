import { find } from "es-toolkit/compat";
import { type ModelId_ModelId, modelId_model } from "#modules/civitai/models/modelId_endpoint";
import { type Model, model, ModelVersion } from "#modules/civitai/models/models_endpoint";
import { type } from "arktype";

export function modelId2Model(data: ModelId_ModelId): Model {
  try {
    data.modelVersions.map((mv) => {
      // update images[]
      mv.images.map((i) => {
        // @ts-ignore
        i.id = Number.parseInt(
          removeFileExtension(extractFilenameFromUrl(i.url)),
        );
      });
      mv.files.map((f) => {
        // Only UTC date format is valid!
        // @ts-ignore
        f.scannedAt = f.scannedAt ? (new Date(f.scannedAt as string)).toISOString() : null;
      });
      mv.description = mv.description ?? null;
      // @ts-ignore
      mv.publishedAt = mv.publishedAt ? (new Date(mv.publishedAt as string)).toISOString() : null;
    });
    const out = model(data);
    if (out instanceof type.errors) {
      console.error(`convert ModelId to Model error!`);
      console.log(out.summary)
      out.throw();
      throw out;
    }
    return out;
  } catch (e) {
    console.error(`convert ModelId to Model error!`);
    console.error(e);
    const out = modelId_model(data);
    if (out instanceof type.errors) {
      console.error(`convert ModelId to Model error!`);
      console.log(out.summary)
      console.log(data)
      out.throw();
      throw out;
    }
    throw e;
  }
}

export function findModelVersion(
  modelId: Model,
  modelVersionId: number
): ModelVersion {
  const modelVersion = find(modelId.modelVersions, function (mv) {
    return mv.id === modelVersionId;
  });
  if (modelVersion === undefined) {
    throw new Error(`model have no version id: ${modelVersionId}`);
  }
  return modelVersion;
}

/**
 * Extracts the filename from a valid URL
 * @param url The URL string to process
 * @returns The filename portion of the URL
 * @throws {Error} If the input is not a valid URL
 */
export function extractFilenameFromUrl(url: string): string {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    throw new Error("Invalid URL provided");
  }

  // Get the pathname and split by slashes
  const pathParts = parsedUrl.pathname
    .split("/")
    .filter((part) => part.trim() !== "");

  // If no path parts exist, return empty string
  if (pathParts.length === 0) return "";

  // Get the last part (filename)
  const filenameWithParams = pathParts[pathParts.length - 1];

  // Remove any query parameters from the filename
  const filename = filenameWithParams.split(/[?#]/)[0];

  return filename;
}

/**
 * remove suffix from a filename（ext name）
 * @param filename complete filename（could contain path info）
 * @returns filename which excluded suffix name.
 */
export function removeFileExtension(filename: string): string {
  // 处理路径分隔符（兼容Windows和Unix）
  const lastSeparatorIndex = Math.max(
    filename.lastIndexOf("/"),
    filename.lastIndexOf("\\")
  );

  // 获取最后一个点号的位置（在最后一个路径分隔符之后）
  const lastDotIndex = filename.lastIndexOf(".");

  // 如果没有点号，或者点号在路径分隔符之前（表示是隐藏文件或没有扩展名），返回原文件名
  if (lastDotIndex === -1 || lastDotIndex < lastSeparatorIndex) {
    return filename;
  }

  // 返回去掉后缀的部分
  return filename.substring(0, lastDotIndex);
}

export function obj2UrlSearchParams(params: object) {
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((v) => urlSearchParams.append(key, String(v)));
    } else {
      urlSearchParams.append(key, String(value));
    }
  }
  return urlSearchParams;
}
