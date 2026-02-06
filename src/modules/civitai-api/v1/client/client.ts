import ky, { type Options as KyOptions, type KyInstance } from 'ky';
import { type Result, err, ok } from 'neverthrow';
import { type } from 'arktype';

import type { ClientConfig } from './config';
import { mergeConfig } from './config';
import type { CivitaiError, ValidationError } from './errors';
import { createNetworkError, createBadRequestError, createUnauthorizedError, createNotFoundError, createValidationError } from './errors';

// Import schema definitions
import { modelsResponseSchema } from '../models/models';
import { creatorsResponseSchema } from '../models/creators';
import { modelVersionEndpointDataSchema } from '../models/model-version';

/**
 * Civitai API Client Core Class
 * Provides basic HTTP request and error handling functionality
 */
export class CivitaiClient {
  private readonly config: ClientConfig & { baseUrl: string; timeout: number; validateResponses: boolean };
  private kyInstance: typeof ky;

  constructor(config: ClientConfig = {}) {
    this.config = mergeConfig(config);
    this.kyInstance = this.createKyInstance();
  }

  /**
   * Create Ky instance
   */
  private createKyInstance(): KyInstance {
    const options: KyOptions = {
      prefixUrl: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      hooks: {
        beforeRequest: [
          (request) => {
            // Add API key authentication
            if (this.config.apiKey) {
              request.headers.set('Authorization', `Bearer ${this.config.apiKey}`);
            }
          },
        ],
      },
    };

    // Add proxy configuration
    if (this.config.proxy) {
      // Ky uses fetch API, proxy needs to be configured via environment variables in Node.js
      // Here we only log a warning, actual proxy needs to be configured externally
      console.warn('Proxy configuration is not directly supported by Ky. Please set HTTP_PROXY/HTTPS_PROXY environment variables.');
    }

    return ky.extend(options);
  }

  /**
   * Execute GET request
   */
  async get<T>(
    path: string,
    options?: {
      searchParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      validateResponse?: boolean;
    }
  ): Promise<Result<T, CivitaiError>> {
    return this.request<T>('GET', path, options);
  }

  /**
   * Execute POST request
   */
  async post<T>(
    path: string,
    options?: {
      json?: unknown;
      searchParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      validateResponse?: boolean;
    }
  ): Promise<Result<T, CivitaiError>> {
    return this.request<T>('POST', path, options);
  }

  /**
   * Execute PUT request
   */
  async put<T>(
    path: string,
    options?: {
      json?: unknown;
      searchParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      validateResponse?: boolean;
    }
  ): Promise<Result<T, CivitaiError>> {
    return this.request<T>('PUT', path, options);
  }

  /**
   * Execute DELETE request
   */
  async delete<T>(
    path: string,
    options?: {
      searchParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      validateResponse?: boolean;
    }
  ): Promise<Result<T, CivitaiError>> {
    return this.request<T>('DELETE', path, options);
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options?: {
      json?: unknown;
      searchParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      validateResponse?: boolean;
    }
  ): Promise<Result<T, CivitaiError>> {
    try {
      const kyOptions: KyOptions = {};

      if (options?.searchParams) {
        kyOptions.searchParams = this.cleanSearchParams(options.searchParams);
      }

      if (options?.headers) {
        kyOptions.headers = options.headers;
      }

      if (options?.json !== undefined) {
        kyOptions.json = options.json;
      }

      const response = await this.kyInstance(path, {
        method,
        ...kyOptions,
      });

      const data = await response.json();

      // Validate response (if enabled)
      const shouldValidate = options?.validateResponse ?? this.config.validateResponses;
      if (shouldValidate) {
        const validationResult = await this.validateResponse<T>(path, data);
        if (validationResult.isErr()) {
          return err(validationResult.error);
        }
        return ok(validationResult.value);
      }

      return ok(data as T);
    } catch (error) {
      return err(this.handleRequestError(error));
    }
  }

  /**
   * Clean search parameters, remove undefined values
   */
  private cleanSearchParams(params: Record<string, string | number | boolean | undefined>): Record<string, string> {
    const cleaned: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleaned[key] = String(value);
      }
    }

    return cleaned;
  }

  /**
   * Get schema for a specific API path
   */
  private getSchemaForPath(path: string): any | null {
    // Define path patterns and their corresponding schemas
    const pathSchemaMap: Record<string, any> = {
      // Models endpoints
      '/models': modelsResponseSchema,
      '/models/': modelsResponseSchema, // For paths starting with /models/
      
      // Creators endpoints
      '/creators': creatorsResponseSchema,
      '/creators/': creatorsResponseSchema,
      
      // Model versions endpoints - pattern matching
      '/model-versions/': modelVersionEndpointDataSchema,
    };

    // Check for exact match first
    if (pathSchemaMap[path]) {
      return pathSchemaMap[path];
    }

    // Check for pattern matches
    for (const [pattern, schema] of Object.entries(pathSchemaMap)) {
      if (pattern.endsWith('/') && path.startsWith(pattern)) {
        return schema;
      }
    }

    // No schema found for this path
    return null;
  }

  /**
   * Validate response data using arktype schemas
   */
  private async validateResponse<T>(path: string, data: unknown): Promise<Result<T, ValidationError>> {
    try {
      // Get schema for the path
      const schema = this.getSchemaForPath(path);
      
      if (!schema) {
        // No schema defined for this path, skip validation
        return ok(data as T);
      }

      // Perform validation using arktype
      const validationResult = schema(data);

      // Check if validation failed
      if (validationResult instanceof type.errors) {
        // Create validation error with arktype's detailed error information
        return err(createValidationError(
          `Response validation failed for path: ${path}`,
          validationResult
        ));
      }

      // Validation successful, return validated data
      return ok(validationResult as T);
    } catch (error) {
      // Handle unexpected errors during validation
      // Create a simple error object that matches ArkErrors structure
      const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        summary: `Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`,
        problems: []
      };
      
      return err(createValidationError(
        `Unexpected error during validation for path ${path}: ${error instanceof Error ? error.message : String(error)}`,
        errorDetails
      ));
    }
  }

  /**
   * Handle request error
   */
  private handleRequestError(error: unknown): CivitaiError {
    if (error instanceof Error) {
      // Ky error
      if ('response' in error) {
        const kyError = error as any;
        const response = kyError.response as Response | undefined;

        if (response) {
          const status = response.status;
          const statusText = response.statusText;

          if (status === 400) {
            // Bad Request error
            return createBadRequestError(
              `Bad Request: ${statusText}`,
              { status, statusText }
            );
          }

          if (status === 401) {
            // Unauthorized error - missing or invalid HTTP Auth Header
            return createUnauthorizedError(
              `Unauthorized: ${statusText}. Please provide a valid API key.`,
              { suggestion: 'Add your API key to the client configuration' }
            );
          }

          if (status === 404) {
            // Not Found error - resource does not exist
            return createNotFoundError(
              `Not Found: ${statusText}. The requested resource does not exist.`,
              { status, statusText }
            );
          }

          // Other HTTP errors
          return createNetworkError(
            status,
            `HTTP_${status}`,
            `HTTP Error ${status}: ${statusText}`,
            error
          );
        }
      }

      // Network error (timeout, connection failure, etc.)
      return createNetworkError(
        0,
        'NETWORK_ERROR',
        `Network error: ${error.message}`,
        error
      );
    }

    // Unknown error
    return createNetworkError(
      0,
      'UNKNOWN_ERROR',
      'Unknown error occurred',
      error
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): ClientConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ClientConfig>): void {
    Object.assign(this.config, newConfig);
    this.kyInstance = this.createKyInstance();
  }
}
