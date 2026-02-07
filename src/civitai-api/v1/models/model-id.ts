import { modelTypesSchema } from "./base-models/misc";
import { type } from "arktype";
import { creatorSchema } from "./creators";
import {
  modelFileSchema,
  modelImageSchema,
  modelVersionStatsSchema,
  modelStatsSchema,
} from "./shared-types";

/**
 * Model version schema for the model-id endpoint
 * Represents a version of a specific model
 */
export const modelByIdVersionSchema = type({
  id: "number.integer",
  index: "number.integer", // the position in modelId.modelVersions array.
  name: "string",
  baseModel: "string",
  baseModelType: "string | null",
  "publishedAt?": "string.date.iso", // ISO 8601
  availability: "'EarlyAccess' | 'Public'",
  nsfwLevel: "number.integer",
  "description?": "string | null", // html doc strings
  "trainedWords?": "string[]",
  stats: modelVersionStatsSchema,
  // covered: 'boolean', // have cover image or not
  files: modelFileSchema.array(),
  images: modelImageSchema.array(),
});
export type ModelByIdVersion = typeof modelByIdVersionSchema.infer;

/**
 * Model schema for the model-id endpoint
 * Represents a specific model with all its versions
 */
export const modelByIdSchema = type({
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
  modelVersions: modelByIdVersionSchema.array(),
});
export type ModelById = typeof modelByIdSchema.infer;

/**
 * Schema for tracking existing model versions on disk
 */
export const existedModelVersionsSchema = type({
  versionId: "number.integer",
  filesOnDisk: "number.integer[]",
}).array();
export type ExistedModelVersions = typeof existedModelVersionsSchema.infer;
