import { type ModelById } from "./models/model-id";
import { type Model, modelSchema } from "./models/models";
import { type } from "arktype";
import { type Result, err, ok } from "neverthrow";

export function modelId2Model(data: ModelById): Result<Model, Error> {
  // Create a deep copy to avoid mutating the original data
  const processedData = JSON.parse(JSON.stringify(data)) as ModelById;
  
  // Process all images and collect any errors
  const imageErrors: Error[] = [];
  
  processedData.modelVersions.forEach((mv) => {
    // Process images
    mv.images.forEach((i) => {
      const filenameResult = extractFilenameFromUrl(i.url);
      if (filenameResult.isErr()) {
        imageErrors.push(filenameResult.error);
        // @ts-ignore
        i.id = 0;
      } else {
        // @ts-ignore
        i.id = Number.parseInt(
          removeFileExtension(filenameResult.value),
        );
      }
    });
    
    // Process files
    mv.files.forEach((f) => {
      // Only UTC date format is valid!
      // @ts-ignore
      f.scannedAt = f.scannedAt ? (new Date(f.scannedAt as string)).toISOString() : null;
    });
    
    // Ensure description is null if undefined
    mv.description = mv.description ?? null;
    
    // Process publishedAt
    // @ts-ignore
    mv.publishedAt = mv.publishedAt ? (new Date(mv.publishedAt as string)).toISOString() : null;
  });

  // If there were errors processing images, return the first error
  if (imageErrors.length > 0) {
    const errorMessages = imageErrors.map(e => e.message).join('; ');
    return err(new Error(`Failed to process model images: ${errorMessages}`));
  }

  // Validate with model schema
  const validationResult = modelSchema(processedData);
  if (validationResult instanceof type.errors) {
    return err(new Error(
      `Failed to convert ModelId to Model. Validation errors: ${validationResult.summary}`
    ));
  }

  return ok(validationResult);
}

export function findModelVersion(
  modelId: Model,
  modelVersionId: number
): Result<Model["modelVersions"][0], Error> {
  const modelVersion = modelId.modelVersions.find((mv) => mv.id === modelVersionId);
  if (modelVersion === undefined) {
    return err(new Error(`model have no version id: ${modelVersionId}`));
  }
  return ok(modelVersion);
}

/**
 * Extracts the filename from a valid URL
 * @param url The URL string to process
 * @returns The filename portion of the URL wrapped in a Result
 */
export function extractFilenameFromUrl(url: string): Result<string, Error> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return err(new Error(`Invalid URL provided: ${url}`));
  }

  // Get the pathname and split by slashes
  const pathParts = parsedUrl.pathname
    .split("/")
    .filter((part) => part.trim() !== "");

  // If no path parts exist, return error
  if (pathParts.length === 0) {
    return err(new Error(`URL path is empty, cannot extract filename from: ${url}`));
  }

  // Get the last part (filename)
  const filenameWithParams = pathParts[pathParts.length - 1];
  if (!filenameWithParams) {
    return err(new Error(`Cannot extract filename from URL path: ${url}`));
  }

  // Remove any query parameters from the filename
  const filename = filenameWithParams.split(/[?#]/)[0];
  if (!filename) {
    return err(new Error(`Filename is empty after removing query parameters from: ${url}`));
  }

  return ok(filename);
}

/**
 * Remove file extension from a filename
 * @param filename Complete filename (could contain path info)
 * @returns Filename without the extension
 */
export function removeFileExtension(filename: string): string {
  // Handle path separators (compatible with Windows and Unix)
  const lastSeparatorIndex = Math.max(
    filename.lastIndexOf("/"),
    filename.lastIndexOf("\\")
  );

  // Get the position of the last dot (after the last path separator)
  const lastDotIndex = filename.lastIndexOf(".");

  // If no dot found, or dot is before the last separator (hidden file or no extension), return original filename
  if (lastDotIndex === -1 || lastDotIndex < lastSeparatorIndex) {
    return filename;
  }

  // Return the part without the extension
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

export function getFileType(filename: string) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop()!.toLowerCase();

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'avif'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'unknown';
}

// // Example usage:
// console.log(getFileType('photo.jpg'));   // => "image"
// console.log(getFileType('clip.mp4'));    // => "video"
// console.log(getFileType('doc.pdf'));     // => "unknown"

/**
 * Extract numeric ID from Civitai image URL
 * Civitai image URLs typically follow this pattern:
 * https://image.civitai.com/{path}/{width}/{imageId}.{extension}
 * 
 * Example: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg"
 * Extracted ID: 1743606
 * 
 * @param url The Civitai image URL
 * @returns Result<number, Error> - Success with ID or Error if extraction fails
 */
export function extractIdFromImageUrl(url: string): Result<number, Error> {
  // Extract filename from URL
  const filenameResult = extractFilenameFromUrl(url);
  if (filenameResult.isErr()) {
    return err(filenameResult.error);
  }
  
  // Remove file extension
  const filenameWithoutExt = removeFileExtension(filenameResult.value);
  
  // Parse as integer
  const id = parseInt(filenameWithoutExt, 10);
  if (isNaN(id)) {
    return err(new Error(`Cannot parse ID from filename: ${filenameWithoutExt} (URL: ${url})`));
  }
  
  return ok(id);
}

/**
 * Efficiently replace URL parameters using regular expressions.
 * Default usage: process image URLs to restore low-resolution images for faster loading.
 * @param urlString Original URL string
 * @param paramName Parameter name (default 'original')
 * @param paramValue Parameter value (default 'false')
 * @returns Modified URL string
 */
export function replaceUrlParam(
  urlString: string,
  paramName: string = "original",
  paramValue: string = "false",
): string {
  // Escape special characters for regex
  const escapedParamName = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match paramName=any_value
  const regex = new RegExp(`(${escapedParamName}=)[^&/]+`, "gi");

  // If match found, replace directly
  if (regex.test(urlString)) {
    return urlString.replace(regex, `$1${paramValue}`);
  }

  // If not found, add parameter before the last /
  const lastSlashIndex = urlString.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    const beforeSlash = urlString.substring(0, lastSlashIndex);
    const afterSlash = urlString.substring(lastSlashIndex);
    return `${beforeSlash}/${paramName}=${paramValue}${afterSlash}`;
  }

  return urlString;
}