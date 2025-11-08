import Conf from "conf";
import { _settingsValidator, type Settings } from "./models";

export const settings = new Conf({
  projectName: "civitai-model-downloader",
  schema: {
    basePath: {
      type: "string",
      default: "",
    },
    civitaiToken: {
      type: "string",
      default: "",
    },
    httpProxy: {
      type: "string",
      default: "",
    },
    gopeedHost: {
      type: "string",
      default: ""
    },
    gopeedToken: {
      type: "string",
      default: ""
    }
  },
  projectVersion: "1.0.0",
  configName: "settings",
});


export function getSettings() {
  return settings.store as Settings
}

export function setSettings(newSettings: Partial<Settings>) {
  settings.set(newSettings);
}

