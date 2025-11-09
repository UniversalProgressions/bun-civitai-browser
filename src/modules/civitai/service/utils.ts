import ky, { KyResponse } from "ky";
import { getSettings } from "../../settings/service";

export function getRequester() {
  const settingsInfo = getSettings();
  return ky.extend({
    // pass proxy info to Bun's fetch('xxx',{proxy:'http://...'}) by ignoring the ky's type error
    // @ts-ignore
    proxy: settingsInfo.httpProxy,
    headers: { Authorization: `Bearer ${settingsInfo.civitaiToken}` },
    timeout: 120000,
  });
}