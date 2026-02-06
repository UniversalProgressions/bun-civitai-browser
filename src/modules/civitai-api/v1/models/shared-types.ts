import { type } from "arktype";

/**
 * Shared type definitions used across multiple Civitai API endpoints
 * This file contains common structures to avoid duplication
 */

// File hashes information
export const fileHashesSchema = type({
  "SHA256?": "string",
  "CRC32?": "string",
  "BLAKE3?": "string",
  "AutoV3?": "string",
  "AutoV2?": "string",
  "AutoV1?": "string",
});
export type FileHashes = typeof fileHashesSchema.infer;

// Model file information
export const modelFileSchema = type({
  id: "number.integer",
  sizeKB: "number",
  name: "string",
  type: "string",
  metadata: {
    "fp?": "string | null", // '"fp8" | "fp16" | "fp32"',
    "size?": "string | null", // '"full" | "pruned"',
    "format?": "string", // '"SafeTensor" | "PickleTensor" | "Other" | "Diffusers" | "GGUF"',
  },
  "scannedAt?": "string.date.iso", // ISO 8601
  "hashes?": fileHashesSchema,
  downloadUrl: "string.url",
});
export type ModelFile = typeof modelFileSchema.infer;

// Model image information
export const modelImageSchema = type({
  id: "number.integer | null", // Some endpoints don't include id
  url: "string",
  nsfwLevel: "number.integer",
  width: "number.integer",
  height: "number.integer",
  hash: "string",
  type: "'image' | 'video'",
});
export type ModelImage = typeof modelImageSchema.infer;

// Model version statistics
export const modelVersionStatsSchema = type({
  downloadCount: "number.integer",
  "ratingCount?": "number.integer",
  "rating?": "number",
  thumbsUpCount: "number.integer",
  "thumbsDownCount?": "number.integer",
});
export type ModelVersionStats = typeof modelVersionStatsSchema.infer;

// Model statistics
export const modelStatsSchema = type({
  downloadCount: "number.integer",
  "favoriteCount?": "number.integer",
  thumbsUpCount: "number.integer",
  thumbsDownCount: "number.integer",
  commentCount: "number.integer",
  "ratingCount?": "number.integer",
  "rating?": "number",
  tippedAmountCount: "number.integer",
});
export type ModelStats = typeof modelStatsSchema.infer;

// Pagination metadata
export const paginationMetadataSchema = type({
  totalItems: "number.integer",
  currentPage: "number.integer",
  pageSize: "number.integer",
  totalPages: "number.integer",
  "nextPage?": "string.url",
  "prevPage?": "string.url",
});
export type PaginationMetadata = typeof paginationMetadataSchema.infer;
