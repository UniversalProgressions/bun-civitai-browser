import {
  model_types,
  allow_commercial_use,
  models_request_sort,
  models_request_period,
  base_models,
  checkpoint_type,
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
  scannedAt: "string | null", //ISO 8061
  "hashes?": modelVersion_file_hashes,
  downloadUrl: "string.url",
});
export type ModelVersionFile = typeof modelVersion_file.infer;

export const modelVersion_image = type({
  id: "number.integer",
  url: "string",
  nsfwLevel: "number.integer",
  width: "number.integer",
  height: "number.integer",
  hash: "string",
  type: "string",
});
export type ModelVersionImage = typeof modelVersion_image.infer;

export const model_version = type({
  id: "number.integer",
  index: "number.integer", // the position in modelId.modelVersions array.
  name: "string",
  baseModel: "string",
  baseModelType: "string | null",
  publishedAt: "string.date | null", //ISO 8061
  availability: "'EarlyAccess' | 'Public'",
  nsfwLevel: "number.integer",
  description: "string | null", //html doc strings
  trainedWords: "string[]",
  stats: {
    downloadCount: "number.integer",
    ratingCount: "number.integer",
    rating: "number",
    thumbsUpCount: "number.integer",
    thumbsDownCount: "number.integer",
  },
  // covered: 'boolean', // have cover image or not
  files: modelVersion_file.array(),
  images: modelVersion_image.array(),
});
export type ModelVersion = typeof model_version.infer;

import { creator } from "./creators_endpoint";
// https://www.jsondiff.com/ 找到共有属性名

export const model = type({
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
  modelVersions: model_version.array(),
});
export type Model = typeof model.infer;

export const models_response = type({
  items: model.array(),
  metadata: {
    "totalItems?": "number.integer",
    "currentPage?": "number.integer",
    "pageSize?": "number.integer",
    "totalPages?": "number.integer",
    "nextPage?": "string.url",
    "prevPage?": "string.url",
  },
});
export type ModelsResponse = typeof models_response.infer;

export const models_request_opts = type({
  "limit?": "number.integer", // The number of results to be returned per page. This can be a number between 1 and 100. By default, each page will return 100 results
  "page?": "number.integer", // The page from which to start fetching models
  "query?": "string", // Search query to filter models by name
  "tag?": "string[]", // Search query to filter models by tag
  "username?": "string", // Search query to filter models by user
  "types?": model_types.array(), // The type of model you want to filter with. If none is specified, it will return all types
  "sort?": models_request_sort, // The order in which you wish to sort the results
  "period?": models_request_period, // The time frame in which the models will be sorted
  "rating?": "number.integer", // The rating you wish to filter the models with. If none is specified, it will return models with any rating
  "favorites?": "boolean", // (AUTHED) Filter to favorites of the authenticated user (this requires an API token or session cookie)
  "hidden?": "boolean", // (AUTHED) Filter to hidden models of the authenticated user (this requires an API token or session cookie)
  "primaryFileOnly?": "boolean", // Only include the primary file for each model (This will use your preferred format options if you use an API token or session cookie)
  "allowNoCredit?": "boolean", // Filter to models that require or don't require crediting the creator
  "allowDerivatives?": "boolean", // Filter to models that allow or don't allow creating derivatives
  "allowDifferentLicenses?": "boolean", // Filter to models that allow or don't allow derivatives to have a different license
  "allowCommercialUse?": allow_commercial_use.array(), // Filter to models based on their commercial permissions
  "nsfw?": "boolean", // If false, will return safer images and hide models that don't have safe images
  "supportsGeneration?": "boolean", // If true, will return models that support generation
  "checkpointType?": checkpoint_type,
  "baseModels?": base_models.array(),
  "token?": "string", // required for search models
});
export type ModelsRequestOpts = typeof models_request_opts.infer;
