import { type } from "arktype";
import { map } from "es-toolkit/compat";

// https://www.jsondiff.com/ 找到共有属性名

type arkUnit = {
  unit: string;
};
type arkUnites = Array<arkUnit>;

export const model_types = type.enumerated(
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
export type ModelTypes = typeof model_types.infer;
export const ModelTypesArray = (() => {
  const modelTypeUnits = model_types.json as arkUnites;
  return map(modelTypeUnits, function (u) {
    return u.unit;
  });
})();

export const models_request_period = type(
  "'AllTime' | 'Day' | 'Week' | 'Month' | 'Year'"
);
export type ModelsRequestPeriod = typeof models_request_period.infer;
export const ModelsRequestPeriodArray = (() => {
  const modelsRequestPeriodUnits = models_request_period.json as arkUnites;
  return map(modelsRequestPeriodUnits, function (u) {
    return u.unit;
  });
})();

export const allow_commercial_use = type(
  "'Image' | 'RentCivit' | 'Rent' | 'Sell' | 'None'"
);
export type AllowCommercialUse = typeof allow_commercial_use.infer;

export const models_request_sort = type(
  "'Highest Rated' | 'Most Downloaded' | 'Newest'"
);
export type ModelsRequestSort = typeof models_request_sort.infer;
export const ModelsRequestSortArray = (() => {
  const ModelsRequestSortUnits = models_request_sort.json as arkUnites;
  return map(ModelsRequestSortUnits, function (u) {
    return u.unit;
  });
})();

export const nsfw_level = type("'None' | 'Soft' | 'Mature' | 'X' | 'Blocked'");
export type NsfwLevel = typeof nsfw_level.infer;

export const checkpoint_type = type("'Merge' | 'Trained'");
export type CheckpointType = typeof checkpoint_type.infer;
export const CheckPointTypeArray = (() => {
  const CheckPointTypeUnits = checkpoint_type.json as arkUnites;
  return map(CheckPointTypeUnits, function (u) {
    return u.unit;
  })
})()

export const base_models = type.enumerated(
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
  "SDXL Turbo",
  "SVD",
  "SVD XT",
  "Stable Cascade",
  "WAN Video"
);
export type BaseModels = typeof base_models.infer;
export const BaseModelsArray = (() => {
  const baseModelUnits = base_models.json as arkUnites;
  return map(baseModelUnits, function (u) {
    return u.unit;
  });
})();
