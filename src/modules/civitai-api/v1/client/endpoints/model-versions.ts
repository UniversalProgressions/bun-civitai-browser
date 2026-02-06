import type { Result } from 'neverthrow';
import type { CivitaiClient } from '../client';
import type { CivitaiError } from '../errors';
import type { ModelVersionEndpointData } from '../../models/model-version';

/**
 * ModelVersions endpoint interface
 */
export interface ModelVersionsEndpoint {
  /**
   * Get model version details
   */
  getById(id: number): Promise<Result<ModelVersionEndpointData, CivitaiError>>;
  
  /**
   * Get model version by hash
   */
  getByHash(hash: string): Promise<Result<ModelVersionEndpointData, CivitaiError>>;
}

/**
 * ModelVersions endpoint implementation
 */
export class ModelVersionsEndpointImpl implements ModelVersionsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async getById(id: number): Promise<Result<ModelVersionEndpointData, CivitaiError>> {
    return this.client.get<ModelVersionEndpointData>(`model-versions/${id}`);
  }

  async getByHash(hash: string): Promise<Result<ModelVersionEndpointData, CivitaiError>> {
    return this.client.get<ModelVersionEndpointData>(`model-versions/by-hash/${hash}`);
  }
}
