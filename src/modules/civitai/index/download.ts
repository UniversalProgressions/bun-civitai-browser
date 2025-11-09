import { Client } from "@gopeed/rest";
import { Elysia } from "elysia";
import { type } from "arktype";
import { getSettings } from "#modules/settings/service";

export class GopeedHostNotSpecifiedError extends Error {
  constructor(
    public message: string,
  ) {
    super(message);
    this.name = "GopeedHostNotSpecifiedError";
  }
}

export function getGopeedClient() {
  const settings = getSettings()
  if (!settings.gopeedHost) {
    throw new GopeedHostNotSpecifiedError(`Please specify gopeed API address to use model downloading feature.`)
  }
  const client = new Client({ host: settings.gopeedHost, token: settings.gopeedToken });
}
