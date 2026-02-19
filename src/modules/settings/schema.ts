import { Config, Schema } from "effect";

// Branded path type for better type safety
export const BasePath = Schema.String.pipe(Schema.brand("@App/BasePath"));
export type BasePath = Schema.Schema.Type<typeof BasePath>;

export const CivitaiApiToken = Schema.String.pipe(
  Schema.brand("@App/CivitaiApiToken"),
);
export type CivitaiApiToken = Schema.Schema.Type<typeof CivitaiApiToken>;

export const GopeedApiHost = Schema.String.pipe(
  Schema.brand("@App/GopeedApiHost"),
);
export type GopeedApiHost = Schema.Schema.Type<typeof GopeedApiHost>;

export const GopeedApiToken = Schema.String.pipe(
  Schema.brand("@App/GopeedApiToken"),
);
export type GopeedApiToken = Schema.Schema.Type<typeof GopeedApiToken>;

export const HttpProxy = Schema.String.pipe(Schema.brand("@App/HttpProxy"));
export type HttpProxy = Schema.Schema.Type<typeof HttpProxy>;

// Settings schema using Effect Schema
export const Settings = Schema.Struct({
  basePath: BasePath,
  civitaiApiToken: CivitaiApiToken,
  gopeedApiHost: GopeedApiHost,
  gopeedApiToken: Schema.optional(GopeedApiToken),
  httpProxy: Schema.optional(HttpProxy),
});
export type Settings = Schema.Schema.Type<typeof Settings>;

// Partial settings for updates
export const PartialSettings = Schema.partial(Settings);
export type PartialSettings = Schema.Schema.Type<typeof PartialSettings>;

// Config for environment variables
export const SettingsConfig = Config.all({
  basePath: Config.string("BASE_PATH").pipe(
    Config.withDefault("C:/civitai-models"),
  ),
  civitaiApiToken: Config.redacted("CIVITAI_API_TOKEN"),
  gopeedApiHost: Config.string("GOPEED_API_HOST").pipe(
    Config.withDefault("http://localhost:9999"),
  ),
  gopeedApiToken: Config.redacted("GOPEED_API_TOKEN").pipe(Config.option),
  httpProxy: Config.string("HTTP_PROXY").pipe(Config.option),
});
