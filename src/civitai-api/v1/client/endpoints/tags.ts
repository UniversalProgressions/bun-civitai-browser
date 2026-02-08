import type { Result } from "neverthrow";
import type { CivitaiClient } from "../client";
import type { CivitaiError } from "../errors";
import { obj2UrlSearchParams } from "../../utils";

/**
 * Tags endpoint interface
 */
export interface TagsEndpoint {
  /**
   * Get tags list
   */
  list(
    options?: TagsRequestOptions,
  ): Promise<Result<TagsResponse, CivitaiError>>;
}

/**
 * Tags request options
 */
export interface TagsRequestOptions {
  limit?: number;
  // page?: number; // Civitai API does not accept page parameter with query search. Use cursor-based pagination.
  query?: string;
}

/**
 * Tags response
 */
export interface TagsResponse {
  items: TagItem[];
  metadata: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    nextPage?: string;
    prevPage?: string;
  };
}

/**
 * Tag item
 */
export interface TagItem {
  name: string;
  modelCount: number;
  link: string;
}

/**
 * Tags endpoint implementation
 */
export class TagsEndpointImpl implements TagsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async list(
    options?: TagsRequestOptions,
  ): Promise<Result<TagsResponse, CivitaiError>> {
    const searchParams = options ? obj2UrlSearchParams(options) : undefined;

    return this.client.get<TagsResponse>("tags", {
      searchParams,
    });
  }
}
