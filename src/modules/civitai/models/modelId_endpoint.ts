import {
  model_types,
} from "./baseModels/misc";
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

export const modelId_modelVersion_file = type({
  id: "number.integer",
  sizeKB: "number",
  name: "string",
  type: "string",
  metadata: {
    "fp?": "string | null", // '"fp8" | "fp16" | "fp32"',
    "size?": "string | null", // '"full" | "pruned"',
    "format?": "string", // '"SafeTensor" | "PickleTensor" | "Other" | "Diffusers" | "GGUF"',
  },
  scannedAt: "string.date.iso", //ISO 8061
  "hashes?": modelVersion_file_hashes,
  downloadUrl: "string.url",
});
export type ModelId_ModelVersionFile = typeof modelId_modelVersion_file.infer;

export const modelId_modelVersion_image = type({
  //   id: "number.integer", // have no id field in modelId api response, but have in modelVersion image filename in url.
  url: "string",
  nsfwLevel: "number.integer",
  width: "number.integer",
  height: "number.integer",
  hash: "string",
  type: "string",
});
export type ModelId_ModelVersionImage = typeof modelId_modelVersion_image.infer;

export const modelId_model_version = type({
  id: "number.integer",
  index: "number.integer", // the position in modelId.modelVersions array.
  name: "string",
  baseModel: "string",
  baseModelType: "string | null", // "baseModelType?": "string | null",
  "publishedAt?": "string.date.iso", // ISO 8061
  availability: "'EarlyAccess' | 'Public'",
  nsfwLevel: "number.integer",
  "description?": "string | null", // html doc strings // "description?": "string | null", //html doc strings
  trainedWords: "string[]", // "trainedWords?": "string[]",
  stats: {
    downloadCount: "number.integer",
    ratingCount: "number.integer",
    rating: "number",
    thumbsUpCount: "number.integer",
    thumbsDownCount: "number.integer",
  },
  // covered: 'boolean', // have cover image or not
  files: modelId_modelVersion_file.array(),
  images: modelId_modelVersion_image.array(),
});
export type ModelId_ModelVersion = typeof modelId_model_version.infer;

import { creator } from "./creators_endpoint";
// https://www.jsondiff.com/ 找到共有属性名

export const modelId_model = type({
  id: "number.integer",
  name: "string",
  description: "string | null",
  // allowNoCredit: 'boolean',
  // allowCommercialUse: allowCommercialUse.array(),
  // allowDerivatives: 'boolean',
  // allowDifferentLicense: 'boolean',
  type: model_types,
  poi: "boolean",
  nsfw: "boolean",
  nsfwLevel: "number.integer",
  // cosmetic: "null",
  "creator?": creator, // sometimes the user might deleted their account, left this field be null.
  stats: {
    downloadCount: "number.integer",
    favoriteCount: "number.integer",
    thumbsUpCount: "number.integer",
    thumbsDownCount: "number.integer",
    commentCount: "number.integer",
    ratingCount: "number.integer",
    rating: "number",
    tippedAmountCount: "number.integer",
  },
  tags: "string[]",
  modelVersions: modelId_model_version.array(),
});
export type ModelId_ModelId = typeof modelId_model.infer;


export const existedModelversions = type({ versionId: "number.integer", filesOnDisk: "number.integer[]" }).array()
export type ExistedModelversions = typeof existedModelversions.infer
