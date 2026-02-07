import {
  modelTypesSchema,
  allowCommercialUseSchema,
  modelsRequestSortSchema,
  modelsRequestPeriodSchema,
  baseModelsSchema,
  checkpointTypeSchema,
} from "./base-models/misc";
import { type } from "arktype";
import { creatorSchema } from "./creators";
import {
  modelFileSchema,
  modelImageSchema,
  modelVersionStatsSchema,
  modelStatsSchema,
  paginationMetadataSchema,
} from "./shared-types";

/**
 * Model version schema for the models endpoint
 * Represents a version of a model in search results
 */
export const modelVersionSchema = type({
  id: "number.integer",
  index: "number.integer", // the position in modelId.modelVersions array.
  name: "string",
  baseModel: "string",
  baseModelType: "string | null",
  publishedAt: "string.date.iso | null", // ISO 8601
  availability: "'EarlyAccess' | 'Public'",
  nsfwLevel: "number.integer",
  description: "string | null", // html doc strings
  "trainedWords?": "string[]",
  stats: modelVersionStatsSchema,
  // covered: 'boolean', // have cover image or not
  files: modelFileSchema.array(),
  images: modelImageSchema.array(),
});
export type ModelVersion = typeof modelVersionSchema.infer;

/**
 * Model schema for the models endpoint
 * Represents a model in search results
 */
export const modelSchema = type({
  id: "number.integer",
  name: "string",
  description: "string | null",
  // allowNoCredit: 'boolean',
  // allowCommercialUse: allowCommercialUse.array(),
  // allowDerivatives: 'boolean',
  // allowDifferentLicense: 'boolean',
  type: modelTypesSchema,
  poi: "boolean",
  nsfw: "boolean",
  nsfwLevel: "number.integer",
  // cosmetic: "null",
  "creator?": creatorSchema, // sometimes the user might deleted their account, left this field be null.
  stats: modelStatsSchema,
  tags: "string[]",
  modelVersions: modelVersionSchema.array(),
});
export type Model = typeof modelSchema.infer;

/**
 * Response schema for the models endpoint
 */
export const modelsResponseSchema = type({
  items: modelSchema.array(),
  metadata: paginationMetadataSchema,
});
export type ModelsResponse = typeof modelsResponseSchema.infer;

/**
 * Request options for the models endpoint
 */
export const modelsRequestOptionsSchema = type({
  "limit?": "number.integer", // The number of results to be returned per page. This can be a number between 1 and 100. By default, each page will return 100 results
  "page?": "number.integer", // The page from which to start fetching models
  "query?": "string", // Search query to filter models by name
  "tag?": "string[]", // Search query to filter models by tag
  "username?": "string", // Search query to filter models by user
  "types?": modelTypesSchema.array(), // The type of model you want to filter with. If none is specified, it will return all types
  "sort?": modelsRequestSortSchema, // The order in which you wish to sort the results
  "period?": modelsRequestPeriodSchema, // The time frame in which the models will be sorted
  "rating?": "number.integer", // The rating you wish to filter the models with. If none is specified, it will return models with any rating
  "favorites?": "boolean", // (AUTHED) Filter to favorites of the authenticated user (this requires an API token or session cookie)
  "hidden?": "boolean", // (AUTHED) Filter to hidden models of the authenticated user (this requires an API token or session cookie)
  "primaryFileOnly?": "boolean", // Only include the primary file for each model (This will use your preferred format options if you use an API token or session cookie)
  "allowNoCredit?": "boolean", // Filter to models that require or don't require crediting the creator
  "allowDerivatives?": "boolean", // Filter to models that allow or don't allow creating derivatives
  "allowDifferentLicenses?": "boolean", // Filter to models that allow or don't allow derivatives to have a different license
  "allowCommercialUse?": allowCommercialUseSchema.array(), // Filter to models based on their commercial permissions
  "nsfw?": "boolean", // If false, will return safer images and hide models that don't have safe images
  "supportsGeneration?": "boolean", // If true, will return models that support generation
  "checkpointType?": checkpointTypeSchema,
  "baseModels?": baseModelsSchema.array(),
  "token?": "string", // required for search models
});
export type ModelsRequestOptions = typeof modelsRequestOptionsSchema.infer;
