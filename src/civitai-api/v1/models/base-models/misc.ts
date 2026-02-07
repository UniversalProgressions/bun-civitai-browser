import { type } from "arktype";

// https://www.jsondiff.com/ Find common property names

type arkUnit = {
  unit: string;
};
type arkUnites = Array<arkUnit>;

/**
 * Model types schema
 */
export const modelTypesSchema = type.enumerated(
  "Checkpoint",
  "TextualInversion",
  "Hypernetwork",
  "AestheticGradient",
  "LORA",
  "Controlnet",
  "Poses",
  "LoCon",
  "DoRA",
  "Other",
  "MotionModule",
  "Upscaler",
  "VAE",
  "Wildcards",
  "Workflows",
  "Detection"
);
export type ModelTypes = typeof modelTypesSchema.infer;
export const ModelTypesArray = (() => {
  const modelTypeUnits = modelTypesSchema.json as arkUnites;
  return modelTypeUnits.map(function (u: arkUnit) {
    return u.unit;
  });
})();

/**
 * Models request period schema
 */
export const modelsRequestPeriodSchema = type(
  "'AllTime' | 'Day' | 'Week' | 'Month' | 'Year'"
);
export type ModelsRequestPeriod = typeof modelsRequestPeriodSchema.infer;
export const ModelsRequestPeriodArray = (() => {
  const modelsRequestPeriodUnits = modelsRequestPeriodSchema.json as arkUnites;
  return modelsRequestPeriodUnits.map(function (u: arkUnit) {
    return u.unit;
  });
})();

/**
 * Allow commercial use schema
 */
export const allowCommercialUseSchema = type(
  "'Image' | 'RentCivit' | 'Rent' | 'Sell' | 'None'"
);
export type AllowCommercialUse = typeof allowCommercialUseSchema.infer;

/**
 * Models request sort schema
 */
export const modelsRequestSortSchema = type(
  "'Highest Rated' | 'Most Downloaded' | 'Newest'"
);
export type ModelsRequestSort = typeof modelsRequestSortSchema.infer;
export const ModelsRequestSortArray = (() => {
  const ModelsRequestSortUnits = modelsRequestSortSchema.json as arkUnites;
  return ModelsRequestSortUnits.map(function (u: arkUnit) {
    return u.unit;
  });
})();

/**
 * NSFW level schema
 */
export const nsfwLevelSchema = type("'None' | 'Soft' | 'Mature' | 'X' | 'Blocked'");
export type NsfwLevel = typeof nsfwLevelSchema.infer;

/**
 * Checkpoint type schema
 */
export const checkpointTypeSchema = type("'Merge' | 'Trained'");
export type CheckpointType = typeof checkpointTypeSchema.infer;
export const CheckpointTypeArray = (() => {
  const CheckpointTypeUnits = checkpointTypeSchema.json as arkUnites;
  return CheckpointTypeUnits.map(function (u: arkUnit) {
    return u.unit;
  });
})();

/**
 * Base models schema
 */
export const baseModelsSchema = type.enumerated(
  "Aura Flow",
  "CogVideoX",
  "Flux .1 D",
  "Flux .1 S",
  "HiDream",
  "Hunyuan 1",
  "Hunyuan Video",
  "Illustrious",
  "Kolors",
  "LTXV",
  "Lumina",
  "Mochi",
  "NoobAI",
  "ODOR",
  "Open AI",
  "Other",
  "PixArt E",
  "PixArt a",
  "Playground v2",
  "Pony",
  "SD 1.4",
  "SD 1.5",
  "SD 1.5 Hyper",
  "SD 1.5 LCM",
  "SD 2.0",
  "SD 2.0 768",
  "SD 2.1",
  "SD 2.1 768",
  "SD 2.1 Unclip",
  "SD 3",
  "SD 3.5",
  "SD 3.5 Large",
  "SD 3.5 Large Turbo",
  "SD 3.5 Medium",
  "SDXL 0.9",
  "SDXL 1.0",
  "SDXL 1.0 LCM",
  "SDXL Distilled",
  "SDXL Hyper",
  "SDXL Lightning",
  "SDXL Turbo",
  "SVD",
  "SVD XT",
  "Stable Cascade",
  "WAN Video"
);
export type BaseModels = typeof baseModelsSchema.infer;
export const BaseModelsArray = (() => {
  const baseModelUnits = baseModelsSchema.json as arkUnites;
  return baseModelUnits.map(function (u: arkUnit) {
    return u.unit;
  });
})();
