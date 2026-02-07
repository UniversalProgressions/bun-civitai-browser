import { type } from "arktype";
import { paginationMetadataSchema } from "./shared-types";

/**
 * Creator schema for Civitai API
 * Represents a user/creator on the platform
 */
export const creatorSchema = type({
    username: "string | null",
    "modelCount?": "number.integer",
    "link?": "string.url",
    image: "string | null",
});
export type Creator = typeof creatorSchema.infer;

/**
 * Response schema for the creators endpoint
 */
export const creatorsResponseSchema = type({
    items: creatorSchema.array(),
    metadata: paginationMetadataSchema,
});
export type CreatorsResponse = typeof creatorsResponseSchema.infer;

/**
 * Request options for the creators endpoint
 */
export const creatorsRequestOptionsSchema = type({
    "limit?": "number.integer",
    "page?": "number.integer",
    "query?": "string",
});
export type CreatorsRequestOptions = typeof creatorsRequestOptionsSchema.infer;
