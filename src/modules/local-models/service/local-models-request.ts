import { type } from "arktype";
import {
  modelTypesSchema,
  baseModelsSchema,
} from "#civitai-api/v1/models/base-models/misc";

/**
 * Request options for querying local models
 */
export const localModelsRequestOptionsSchema = type({
  "limit?": "number.integer",
  "page?": "number.integer",
  "query?": "string",
  "tag?": "string[]",
  "username?": "string",
  "types?": modelTypesSchema.array(),
  "nsfw?": "boolean",
  "baseModels?": baseModelsSchema.array(),
});

export type LocalModelsRequestOptions =
  typeof localModelsRequestOptionsSchema.infer;
