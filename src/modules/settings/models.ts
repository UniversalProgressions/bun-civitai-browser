import { type } from "arktype";

// Settings - Start
export const _settingsValidator = type({
  basePath: "string",
  civitaiToken: "string",
  httpProxy: "string",
  gopeedHost: "string.url",
  gopeedToken: "string",
});
export type Settings = typeof _settingsValidator.infer;

export const defaultSettings: Settings = {
  basePath: "",
  civitaiToken: "",
  httpProxy: "",
  gopeedHost: "",
  gopeedToken: "",
};
