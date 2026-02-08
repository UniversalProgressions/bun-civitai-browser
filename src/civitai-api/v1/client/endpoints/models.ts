import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { CivitaiClient } from "../client";
import type { CivitaiError, ValidationError } from "../errors";
import { createValidationError } from "../errors";
import type {
  ModelsResponse,
  ModelsRequestOptions,
  Model,
} from "../../models/models";
import type { ModelById } from "../../models/model-id";
import { modelId2Model } from "../../utils";

/**
 * Models endpoint interface
 */
export interface ModelsEndpoint {
  /**
   * Get models list
   */
  list(
    options?: ModelsRequestOptions,
  ): Promise<Result<ModelsResponse, CivitaiError>>;

  /**
   * Get single model details
   */
  getById(id: number): Promise<Result<ModelById, CivitaiError>>;

  /**
   * Get single model details and convert to Model type
   */
  getModel(id: number): Promise<Result<Model, CivitaiError>>;

  /**
   * Get next page of models list
   * @param nextPageUrl - The next page URL from metadata.nextPage
   * @returns Promise with paginated models response
   */
  nextPage(nextPageUrl: string): Promise<Result<ModelsResponse, CivitaiError>>;
}

/**
 * Models endpoint implementation
 */
export class ModelsEndpointImpl implements ModelsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  /**
   * Get next page of models list
   * @param nextPageUrl - The next page URL from metadata.nextPage
   * @returns Promise with paginated models response
   * @example
   * ```typescript
   * // First, get initial page
   * const firstPage = await client.models.list({ limit: 10 });
   * if (firstPage.isOk() && firstPage.value.metadata.nextPage) {
   *   // Then get next page
   *   const nextPage = await client.models.nextPage(firstPage.value.metadata.nextPage);
   * }
   * ```
   */
  nextPage(nextPageUrl: string): Promise<Result<ModelsResponse, CivitaiError>> {
    if (!nextPageUrl || typeof nextPageUrl !== "string") {
      throw new Error("nextPageUrl must be a non-empty string");
    }
    return this.client.get<ModelsResponse>(nextPageUrl);
  }

  async list(
    options?: ModelsRequestOptions,
  ): Promise<Result<ModelsResponse, CivitaiError>> {
    // Convert array-type parameters to query string format
    const searchParams = this.prepareSearchParams(options);

    return this.client.get<ModelsResponse>("models", {
      searchParams,
    });
  }

  async getById(id: number): Promise<Result<ModelById, CivitaiError>> {
    return this.client.get<ModelById>(`models/${id}`);
  }

  async getModel(id: number): Promise<Result<Model, CivitaiError>> {
    const result = await this.getById(id);

    return result.andThen((modelById) => {
      const conversionResult = modelId2Model(modelById);

      if (conversionResult.isErr()) {
        // Convert Error to ValidationError
        return err(
          createValidationError(
            `Failed to convert model data: ${conversionResult.error.message}`,
            conversionResult.error,
          ),
        );
      }

      return ok(conversionResult.value);
    });
  }

  /**
   * Prepare search parameters, handle array-type fields
   */
  private prepareSearchParams(
    options?: ModelsRequestOptions,
  ): Record<string, string | number | boolean | undefined> {
    if (!options) return {};

    const result: Record<string, string | number | boolean | undefined> = {};

    for (const [key, value] of Object.entries(options)) {
      if (value === undefined) continue;

      if (Array.isArray(value)) {
        // Array-type parameters need to be converted to comma-separated strings
        result[key] = value.join(",");
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
