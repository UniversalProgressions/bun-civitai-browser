import { Elysia } from "elysia";
import { settingsSchema } from "./model";
import { settingsService } from "./service";

// Create a nullable version of the settings schema for GET response
const nullableSettingsSchema = settingsSchema.or("null");

const settingsApi = new Elysia({ prefix: "/api" })
  .get(
    "/settings",
    async () => {
      try {
        return settingsService.getSettings();
      } catch (error) {
        // If settings are not configured, return null instead of throwing
        if (
          error instanceof Error &&
          error.message === "Settings not configured"
        ) {
          return null;
        }
        throw error;
      }
    },
    {
      response: nullableSettingsSchema,
    },
  )
  .post(
    "/settings",
    ({ body }) => {
      settingsService.updateSettings(body);
      return settingsService.getSettings();
    },
    {
      response: settingsSchema,
      body: settingsSchema,
    },
  );
export default new Elysia({ prefix: "/settings" }).use(settingsApi);
