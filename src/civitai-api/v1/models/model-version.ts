import { type } from "arktype";
import {
  modelFileSchema,
  modelImageSchema,
} from "./shared-types";

/**
 * Model version stats schema for the model-version endpoint
 * Note: This endpoint has different stats structure (no thumbsDownCount)
 */
export const modelVersionEndpointStatsSchema = type({
  downloadCount: "number.integer",
  "ratingCount?": "number.integer",
  "rating?": "number",
  thumbsUpCount: "number.integer",
  // thumbsDownCount is not present in this endpoint
});
export type ModelVersionEndpointStats = typeof modelVersionEndpointStatsSchema.infer;

/**
 * Model version schema for the model-version endpoint
 * Represents a specific model version with detailed information
 */
export const modelVersionEndpointDataSchema = type({
  id: "number.integer",
  modelId: "number.integer",
  // index: "number.integer", // the position in modelId.modelVersions array (not present in this endpoint)
  name: "string",
  baseModel: "string",
  baseModelType: "string | null",
  publishedAt: "string.date.iso", // ISO 8601
  // availability: "'EarlyAccess' | 'Public'", // not present in this endpoint
  nsfwLevel: "number.integer",
  description: "string | null", // html doc strings
  "trainedWords?": "string[]",
  stats: modelVersionEndpointStatsSchema,
  // covered: 'boolean', // have cover image or not
  files: modelFileSchema.array(),
  images: modelImageSchema.array(),
});
export type ModelVersionEndpointData = typeof modelVersionEndpointDataSchema.infer;
