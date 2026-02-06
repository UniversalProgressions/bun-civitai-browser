// We need to define minimal interfaces since arktype types have issues with TypeScript
// These interfaces capture the essential structure we need

export interface ModelFileUnified {
  id: number;
  sizeKB: number;
  name: string;
  type: string;
  metadata: {
    fp?: string | null;
    size?: string | null;
    format?: string;
  };
  scannedAt?: string;
  hashes?: Record<string, string>;
  downloadUrl: string;
}

// if id is null, we could get id from url. "url":"https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg",
export interface ModelImageUnified {
  id: number | null;
  url: string;
  nsfwLevel: number;
  width: number;
  height: number;
  hash: string;
  type: string;
}

// Import types from arktype schemas
import type { ModelTypes } from "./base-models/misc";
import type { Creator } from "./creators";
import type { ModelStats } from "./shared-types";

/**
 * Core ModelVersion interface that contains only the fields present in ALL endpoints
 * This is the minimal common interface that can be safely used across all endpoints
 * Note: publishedAt is NOT included because it has different nullability across endpoints
 */
export interface ModelVersionCore {
  // Fields present in ALL endpoints
  id: number;
  name: string;
  baseModel: string;
  baseModelType: string | null;
  nsfwLevel: number;
  description: string | null | undefined;
  files: ModelFileUnified[];
  images: ModelImageUnified[];
}

/**
 * Core Model interface that contains only the fields present in ALL endpoints
 * This is the minimal common interface that can be safely used across all endpoints
 */
export interface ModelCore {
  // Fields present in ALL endpoints
  id: number;
  name: string;
  description: string | null;
  type: ModelTypes;
  poi: boolean;
  nsfw: boolean;
  nsfwLevel: number;
  creator?: Creator;
  stats: ModelStats;
  tags: string[];
  modelVersions: ModelVersionAny[];
}

/**
 * Minimal interface for models endpoint version
 */
export interface ModelsVersionUnified {
  id: number;
  name: string;
  baseModel: string;
  baseModelType: string | null;
  publishedAt: string | null;
  availability: 'EarlyAccess' | 'Public';
  index: number;
  nsfwLevel: number;
  description: string | null;
  files: ModelFileUnified[];
  images: ModelImageUnified[];
  stats: any;
  trainedWords?: string[];
}

/**
 * Minimal interface for model-id endpoint version
 */
export interface ModelByIdVersionUnified {
  id: number;
  name: string;
  baseModel: string;
  baseModelType: string | null;
  publishedAt?: string;
  availability: 'EarlyAccess' | 'Public';
  index: number;
  nsfwLevel: number;
  description?: string | null;
  files: ModelFileUnified[];
  images: ModelImageUnified[];
  stats: any;
  trainedWords?: string[];
}

/**
 * Minimal interface for model-version endpoint version
 */
export interface ModelVersionEndpointUnified {
  id: number;
  modelId: number;
  name: string;
  baseModel: string;
  baseModelType: string | null;
  publishedAt: string;
  nsfwLevel: number;
  description: string | null;
  files: ModelFileUnified[];
  images: ModelImageUnified[];
  stats: any;
  trainedWords?: string[];
}

/**
 * Minimal interface for models endpoint model
 */
export interface ModelsEndpointModelUnified {
  id: number;
  name: string;
  description: string | null;
  type: ModelTypes;
  poi: boolean;
  nsfw: boolean;
  nsfwLevel: number;
  creator?: Creator;
  stats: ModelStats;
  tags: string[];
  modelVersions: ModelsVersionUnified[];
}

/**
 * Minimal interface for model-id endpoint model
 */
export interface ModelByIdEndpointModel {
  id: number;
  name: string;
  description: string | null;
  type: ModelTypes;
  poi: boolean;
  nsfw: boolean;
  nsfwLevel: number;
  creator?: Creator;
  stats: ModelStats;
  tags: string[];
  modelVersions: ModelByIdVersionUnified[];
}

/**
 * Union type of all possible ModelVersion types from different endpoints
 * Use this when you need to accept any ModelVersion type
 */
export type ModelVersionAny = ModelsVersionUnified | ModelByIdVersionUnified | ModelVersionEndpointUnified;

/**
 * Union type of all possible Model types from different endpoints
 * Use this when you need to accept any Model type
 */
export type ModelAny = ModelsEndpointModelUnified | ModelByIdEndpointModel;

/**
 * Type guard to check if a value is from the models endpoint
 */
export function isModelsVersion(version: ModelVersionAny): version is ModelsVersionUnified {
  const v = version as any;
  return v.index !== undefined && v.availability !== undefined;
}

/**
 * Type guard to check if a value is from the model-id endpoint
 */
export function isModelByIdVersion(version: ModelVersionAny): version is ModelByIdVersionUnified {
  const v = version as any;
  return v.index !== undefined && v.availability !== undefined;
}

/**
 * Type guard to check if a value is from the model-version endpoint
 */
export function isModelVersionEndpoint(version: ModelVersionAny): version is ModelVersionEndpointUnified {
  const v = version as any;
  return v.modelId !== undefined;
}

/**
 * Type guard to check if a value is from the models endpoint
 */
export function isModelsEndpointModel(model: ModelAny): model is ModelsEndpointModelUnified {
  const m = model as any;
  // Check if modelVersions array exists and has at least one element
  if (!m.modelVersions || !Array.isArray(m.modelVersions) || m.modelVersions.length === 0) {
    return false;
  }
  // Check the first version to determine endpoint type
  const firstVersion = m.modelVersions[0];
  return isModelsVersion(firstVersion);
}

/**
 * Type guard to check if a value is from the model-id endpoint
 */
export function isModelByIdEndpointModel(model: ModelAny): model is ModelByIdEndpointModel {
  const m = model as any;
  // Check if modelVersions array exists and has at least one element
  if (!m.modelVersions || !Array.isArray(m.modelVersions) || m.modelVersions.length === 0) {
    return false;
  }
  // Check the first version to determine endpoint type
  const firstVersion = m.modelVersions[0];
  return isModelByIdVersion(firstVersion);
}

/**
 * Extract the core fields from any ModelVersion type
 * This is safe to use with any endpoint's ModelVersion
 */
export function toModelVersionCore(version: ModelVersionAny): ModelVersionCore {
  return {
    id: version.id,
    name: version.name,
    baseModel: version.baseModel,
    baseModelType: version.baseModelType,
    nsfwLevel: version.nsfwLevel,
    description: version.description,
    files: version.files,
    images: version.images,
  };
}

/**
 * Extract the core fields from any Model type
 * This is safe to use with any endpoint's Model
 */
export function toModelCore(model: ModelAny): ModelCore {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    type: model.type,
    poi: model.poi,
    nsfw: model.nsfw,
    nsfwLevel: model.nsfwLevel,
    creator: model.creator,
    stats: model.stats,
    tags: model.tags,
    modelVersions: model.modelVersions,
  };
}

/**
 * Safely get the modelId from any ModelVersion type
 * Returns undefined if the endpoint doesn't provide modelId
 */
export function getModelId(version: ModelVersionAny): number | undefined {
  if (isModelVersionEndpoint(version)) {
    return version.modelId;
  }
  return undefined;
}

/**
 * Safely get the index from any ModelVersion type
 * Returns undefined if the endpoint doesn't provide index
 */
export function getIndex(version: ModelVersionAny): number | undefined {
  if (isModelsVersion(version) || isModelByIdVersion(version)) {
    return (version as ModelsVersionUnified | ModelByIdVersionUnified).index;
  }
  return undefined;
}

/**
 * Safely get the availability from any ModelVersion type
 * Returns undefined if the endpoint doesn't provide availability
 */
export function getAvailability(version: ModelVersionAny): 'EarlyAccess' | 'Public' | undefined {
  if (isModelsVersion(version) || isModelByIdVersion(version)) {
    return (version as ModelsVersionUnified | ModelByIdVersionUnified).availability;
  }
  return undefined;
}

/**
 * Safely get the publishedAt from any ModelVersion type
 * Handles different nullability across endpoints
 */
export function getPublishedAt(version: ModelVersionAny): string | null | undefined {
  if (isModelsVersion(version)) {
    const v = version as ModelsVersionUnified;
    // Return as string | null | undefined to satisfy TypeScript
    return v.publishedAt as string | null | undefined;
  }
  if (isModelByIdVersion(version)) {
    const v = version as ModelByIdVersionUnified;
    return v.publishedAt; // string | undefined
  }
  if (isModelVersionEndpoint(version)) {
    const v = version as ModelVersionEndpointUnified;
    return v.publishedAt; // string
  }
  return undefined;
}

/**
 * Find a ModelVersion by ID in a Model's versions array
 * Works with any Model type that has a modelVersions array
 */
export function findModelVersion<T extends ModelVersionAny>(
  versions: T[],
  versionId: number
): T | undefined {
  return versions.find(v => v.id === versionId);
}

/**
 * Type-safe version of findModelVersion that returns the correct type
 * based on the input array type
 */
export function findModelVersionTyped<T extends ModelVersionAny>(
  versions: T[],
  versionId: number
): T | undefined {
  return versions.find(v => v.id === versionId);
}

/**
 * Find a Model by ID in an array of models
 * Works with any Model type
 */
export function findModel<T extends ModelAny>(
  models: T[],
  modelId: number
): T | undefined {
  return models.find(m => m.id === modelId);
}

/**
 * Type-safe version of findModel that returns the correct type
 * based on the input array type
 */
export function findModelTyped<T extends ModelAny>(
  models: T[],
  modelId: number
): T | undefined {
  return models.find(m => m.id === modelId);
}

import type { Result } from "neverthrow";
import { ok, err } from "neverthrow";
import { extractIdFromImageUrl } from "../utils";

/**
 * Extract image ID from ModelImage URL when id is null
 * Civitai API sometimes returns null for image.id, but the ID can be extracted
 * from the URL filename (filename without extension)
 * 
 * Example URL: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg"
 * Extracted ID: 1743606
 * 
 * @param image ModelImage object (may have null id)
 * @returns Result<number, Error> - Success with ID or Error if extraction fails
 */
export function getImageId(image: ModelImageUnified): Result<number, Error> {
  // If id is already present and not null, return it
  if (image.id !== null && image.id !== undefined) {
    return ok(image.id);
  }
  
  // Use the utility function from utils.ts
  return extractIdFromImageUrl(image.url);
}

/**
 * Process an array of ModelImages to ensure all have valid IDs
 * Extracts IDs from URLs for images with null ids
 * 
 * @param images Array of ModelImage objects
 * @returns Result<ModelImage[], Error> - Success with processed images or Error if extraction fails
 */
export function ensureImageIds(images: ModelImageUnified[]): Result<ModelImageUnified[], Error> {
  const processedImages: ModelImageUnified[] = [];
  
  for (const image of images) {
    if (image.id !== null && image.id !== undefined) {
      processedImages.push(image);
      continue;
    }
    
    const idResult = getImageId(image);
    if (idResult.isErr()) {
      return err(idResult.error);
    }
    
    processedImages.push({
      ...image,
      id: idResult.value
    });
  }
  
  return ok(processedImages);
}
