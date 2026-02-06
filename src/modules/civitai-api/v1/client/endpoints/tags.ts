import type { Result } from 'neverthrow';
import type { CivitaiClient } from '../client';
import type { CivitaiError } from '../errors';

/**
 * Tags endpoint interface
 */
export interface TagsEndpoint {
  /**
   * Get tags list
   */
  list(options?: TagsRequestOptions): Promise<Result<TagsResponse, CivitaiError>>;
}

/**
 * Tags request options
 */
export interface TagsRequestOptions {
  limit?: number;
  page?: number;
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

  async list(options?: TagsRequestOptions): Promise<Result<TagsResponse, CivitaiError>> {
    return this.client.get<TagsResponse>('tags', {
      searchParams: options as Record<string, string | number | boolean | undefined>,
    });
  }
}
