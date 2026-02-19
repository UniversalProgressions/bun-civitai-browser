import { Schema } from "effect";

export class SettingsNotFoundError extends Schema.TaggedError<SettingsNotFoundError>()(
  "SettingsNotFoundError",
  {
    message: Schema.String,
  },
) {}

export class SettingsValidationError extends Schema.TaggedError<SettingsValidationError>()(
  "SettingsValidationError",
  {
    message: Schema.String,
    summary: Schema.String,
  },
) {}

export class SettingsUpdateError extends Schema.TaggedError<SettingsUpdateError>()(
  "SettingsUpdateError",
  {
    message: Schema.String,
    summary: Schema.String,
  },
) {}
