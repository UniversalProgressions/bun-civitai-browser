import type { Result } from 'neverthrow';
import type { CivitaiClient } from '../client';
import type { CivitaiError } from '../errors';
import type { CreatorsResponse, CreatorsRequestOptions } from '../../models/creators';

/**
 * Creators endpoint interface
 */
export interface CreatorsEndpoint {
  /**
   * Get creators list
   */
  list(options?: CreatorsRequestOptions): Promise<Result<CreatorsResponse, CivitaiError>>;
}

/**
 * Creators endpoint implementation
 */
export class CreatorsEndpointImpl implements CreatorsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async list(options?: CreatorsRequestOptions): Promise<Result<CreatorsResponse, CivitaiError>> {
    return this.client.get<CreatorsResponse>('creators', {
      searchParams: options,
    });
  }
}
