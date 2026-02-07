import { type } from "arktype";

export const creator = type({
    username: "string | null",
    "modelCount?": "number.integer",
    "link?": "string.url",
    image: "string | null",
});
export type Creator = typeof creator.infer;

export const creators_response = type({
    items: creator.array(),
    metadata: {
        totalItems: "number.integer",
        currentPage: "number.integer",
        pageSize: "number.integer",
        totalPages: "number.integer",
        "nextPage?": "string.url",
        "prevPage?": "string.url",
    },
});
export type CreatorsResponse = typeof creators_response.infer;

export const creators_request_opts = type({
    "limit?": "number.integer",
    "page?": "number.integer",
    "query?": "string",
});
export type CreatorsRequestOpts = typeof creators_request_opts.infer;
