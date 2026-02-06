import { type } from "arktype";

/**
 * Settings schema definition using ArkType
 * This defines the structure and validation rules for application settings
 */
export const settingsSchema = type({
  // Required fields
  basePath: "string",  // Previously models_folder, renamed for backward compatibility
  civitai_api_token: "string",
  gopeed_api_host: "string",
  
  // Optional fields (default to undefined)
  "http_proxy?": "string",
  "gopeed_api_token?": "string"
}).onUndeclaredKey("reject");

/**
 * TypeScript type inferred from the settings schema
 * This provides full type safety for settings throughout the application
 */
export type Settings = typeof settingsSchema.infer;
