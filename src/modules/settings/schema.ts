import { type } from "arktype";

/**
 * Branded type helpers for creating branded string types
 * These provide type safety by distinguishing different string types at compile time
 */

// Base branded type utility
type Branded<T, Brand> = T & { readonly __brand: Brand };

// Factory function to create branded values
function brand<T extends string, Brand extends string>(
  value: T,
  brand: Brand,
): Branded<T, Brand> {
  return value as Branded<T, Brand>;
}

// Type guards for branded types
function isBranded<T extends string, Brand extends string>(
  value: string,
  brand: Brand,
): value is Branded<T, Brand> {
  return typeof value === "string";
}

// Branded type definitions
export type BasePath = Branded<string, "@App/BasePath">;
export type CivitaiApiToken = Branded<string, "@App/CivitaiApiToken">;
export type GopeedApiHost = Branded<string, "@App/GopeedApiHost">;
export type GopeedApiToken = Branded<string, "@App/GopeedApiToken">;
export type HttpProxy = Branded<string, "@App/HttpProxy">;

// Branded type constructors
export function createBasePath(value: string): BasePath {
  return brand(value, "@App/BasePath");
}

export function createCivitaiApiToken(value: string): CivitaiApiToken {
  return brand(value, "@App/CivitaiApiToken");
}

export function createGopeedApiHost(value: string): GopeedApiHost {
  return brand(value, "@App/GopeedApiHost");
}

export function createGopeedApiToken(value: string): GopeedApiToken {
  return brand(value, "@App/GopeedApiToken");
}

export function createHttpProxy(value: string): HttpProxy {
  return brand(value, "@App/HttpProxy");
}

/**
 * Settings schema using ArkType
 * Note: This schema uses underscore naming to match the existing settings model
 * The branded types are validated through runtime checks
 */
export const settingsSchema = type({
  // Required fields
  basePath: "string",
  civitai_api_token: "string",
  gopeed_api_host: "string",

  // Optional fields (default to undefined)
  "http_proxy?": "string",
  "gopeed_api_token?": "string",
}).onUndeclaredKey("reject");

// TypeScript type inferred from the settings schema
export type Settings = typeof settingsSchema.infer;

/**
 * Partial settings schema for updates
 * Allows updating individual fields without requiring all fields
 */
export const partialSettingsSchema = type({
  // All fields optional for partial updates
  "basePath?": "string",
  "civitai_api_token?": "string",
  "gopeed_api_host?": "string",
  "http_proxy?": "string",
  "gopeed_api_token?": "string",
});
export type PartialSettings = typeof partialSettingsSchema.infer;

/**
 * Environment variable configuration
 * Maps environment variables to settings with defaults
 */
export interface EnvConfig {
  basePath: string;
  civitaiApiToken: string;
  gopeedApiHost: string;
  gopeedApiToken?: string;
  httpProxy?: string;
}

/**
 * Load settings from environment variables
 * This replaces the Effect Config module
 */
export function loadConfigFromEnv(): EnvConfig {
  const basePath = process.env.BASE_PATH || "C:/civitai-models";
  const civitaiApiToken = process.env.CIVITAI_API_TOKEN || "";
  const gopeedApiHost = process.env.GOPEED_API_HOST || "http://localhost:9999";
  const gopeedApiToken = process.env.GOPEED_API_TOKEN;
  const httpProxy = process.env.HTTP_PROXY;

  // Create branded types
  return {
    basePath: createBasePath(basePath),
    civitaiApiToken: createCivitaiApiToken(civitaiApiToken),
    gopeedApiHost: createGopeedApiHost(gopeedApiHost),
    gopeedApiToken: gopeedApiToken
      ? createGopeedApiToken(gopeedApiToken)
      : undefined,
    httpProxy: httpProxy ? createHttpProxy(httpProxy) : undefined,
  };
}

/**
 * Convert environment config to settings object (with underscore naming)
 */
export function envConfigToSettings(config: EnvConfig): Settings {
  return {
    basePath: config.basePath,
    civitai_api_token: config.civitaiApiToken,
    gopeed_api_host: config.gopeedApiHost,
    http_proxy: config.httpProxy,
    gopeed_api_token: config.gopeedApiToken,
  };
}

/**
 * Complete settings configuration from environment variables
 * Returns validated settings or throws validation errors
 */
export function getSettingsFromEnv(): Settings {
  const envConfig = loadConfigFromEnv();
  const settings = envConfigToSettings(envConfig);

  const result = settingsSchema(settings);
  if (result instanceof type.errors) {
    throw new Error(`Invalid environment configuration: ${result.summary}`);
  }

  return result;
}
