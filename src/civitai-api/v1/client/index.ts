import type { ClientConfig } from './config';
import { CivitaiClient } from './client';
import type { CreatorsEndpoint } from './endpoints/creators';
import { CreatorsEndpointImpl } from './endpoints/creators';
import type { ModelsEndpoint } from './endpoints/models';
import { ModelsEndpointImpl } from './endpoints/models';
import type { ModelVersionsEndpoint } from './endpoints/model-versions';
import { ModelVersionsEndpointImpl } from './endpoints/model-versions';
import type { TagsEndpoint } from './endpoints/tags';
import { TagsEndpointImpl } from './endpoints/tags';

/**
 * Civitai API Client main interface
 * Provides all available API endpoints
 */
export interface CivitaiApiClient {
  /**
   * Core HTTP client
   */
  readonly client: CivitaiClient;
  
  /**
   * Creators related API
   */
  readonly creators: CreatorsEndpoint;
  
  /**
   * Models related API
   */
  readonly models: ModelsEndpoint;
  
  /**
   * Model versions related API
   */
  readonly modelVersions: ModelVersionsEndpoint;
  
  /**
   * Tags related API
   */
  readonly tags: TagsEndpoint;
  
  /**
   * Get current configuration
   */
  getConfig(): ClientConfig;
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<ClientConfig>): void;
}

/**
 * Civitai API Client implementation
 */
export class CivitaiApiClientImpl implements CivitaiApiClient {
  readonly client: CivitaiClient;
  readonly creators: CreatorsEndpoint;
  readonly models: ModelsEndpoint;
  readonly modelVersions: ModelVersionsEndpoint;
  readonly tags: TagsEndpoint;

  constructor(config: ClientConfig = {}) {
    this.client = new CivitaiClient(config);
    this.creators = new CreatorsEndpointImpl(this.client);
    this.models = new ModelsEndpointImpl(this.client);
    this.modelVersions = new ModelVersionsEndpointImpl(this.client);
    this.tags = new TagsEndpointImpl(this.client);
  }

  getConfig(): ClientConfig {
    return this.client.getConfig();
  }

  updateConfig(config: Partial<ClientConfig>): void {
    this.client.updateConfig(config);
  }
}

/**
 * Create Civitai API Client
 */
export function createCivitaiClient(config: ClientConfig = {}): CivitaiApiClient {
  return new CivitaiApiClientImpl(config);
}

/**
 * Default export
 */
export default createCivitaiClient;

// Export all types
export type { ClientConfig } from './config';
export type {
  CivitaiError,
  NetworkError,
  ValidationError,
  BadRequestError,
} from './errors';

export type {
  CreatorsRequestOptions,
  CreatorsResponse,
} from '../models/creators';

export type {
  ModelsRequestOptions,
  ModelsResponse,
  Model,
  ModelVersion as ModelVersionInList,
} from '../models/models';

export type {
  ModelById,
} from '../models/model-id';

export type {
  ModelVersionEndpointData as ModelVersion,
} from '../models/model-version';