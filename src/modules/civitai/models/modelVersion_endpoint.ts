import { type } from "arktype";

export const modelVersion_file_hashes = type({
  "SHA256?": "string",
  "CRC32?": "string",
  "BLAKE3?": "string",
  "AutoV3?": "string",
  "AutoV2?": "string",
  "AutoV1?": "string",
});
export type ModelVersionFileHashes = typeof modelVersion_file_hashes.infer;

export const modelVersion_file = type({
  id: "number.integer",
  sizeKB: "number",
  name: "string",
  type: "string",
  metadata: {
    "fp?": "string | null", // '"fp8" | "fp16" | "fp32"',
    "size?": "string | null", // '"full" | "pruned"',
    "format?": "string", // '"SafeTensor" | "PickleTensor" | "Other" | "Diffusers" | "GGUF"',
  },
  "scannedAt?": "string.date.iso", //ISO 8061
  "hashes?": modelVersion_file_hashes,
  downloadUrl: "string.url",
});
export type ModelVersion_ModelVersionFile = typeof modelVersion_file.infer;

export const modelVersion_image = type({
  //   id: "number.integer", // have no id field in modelId api response, but have in modelVersion image filename in url.
  url: "string",
  nsfwLevel: "number.integer",
  width: "number.integer",
  height: "number.integer",
  hash: "string",
  type: "string",
});
export type ModelVersion_ModelVersionImage = typeof modelVersion_image.infer;

export const modelVersion_model_version = type({
  id: "number.integer",
  modelId: "number.integer",
  // index: "number.integer", // the position in modelId.modelVersions array.
  name: "string",
  baseModel: "string",
  baseModelType: "string | null", // "baseModelType?": "string | null",
  publishedAt: "string.date.iso", // ISO 8061
  // availability: "'EarlyAccess' | 'Public'",
  nsfwLevel: "number.integer",
  description: "string | null", // html doc strings // "description?": "string | null", //html doc strings
  "trainedWords?": "string[]", // "trainedWords?": "string[]",
  stats: {
    downloadCount: "number.integer",
    ratingCount: "number.integer",
    rating: "number",
    thumbsUpCount: "number.integer",
    // thumbsDownCount: "number.integer",
  },
  // covered: 'boolean', // have cover image or not
  files: modelVersion_file.array(),
  images: modelVersion_image.array(),
});
export type ModelVersion_ModelVersion = typeof modelVersion_model_version.infer;
