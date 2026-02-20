import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { CivitaiClient } from "../client";
import type { CivitaiError } from "../errors";
import type { ModelVersionEndpointData } from "../../models/model-version";

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
  getByHash(
    hash: string,
  ): Promise<Result<ModelVersionEndpointData, CivitaiError>>;

  /**
   * Resolve file download URL to get the actual download URL
   * This method adds the token to the download URL and follows redirects
   * to get the final CDN URL for downloading the file
   */
  resolveFileDownloadUrl(
    fileDownloadUrl: string,
    token?: string,
  ): Promise<Result<string, CivitaiError>>;
}

/**
 * ModelVersions endpoint implementation
 */
export class ModelVersionsEndpointImpl implements ModelVersionsEndpoint {
  constructor(private readonly client: CivitaiClient) {}

  async getById(
    id: number,
  ): Promise<Result<ModelVersionEndpointData, CivitaiError>> {
    return this.client.get<ModelVersionEndpointData>(`model-versions/${id}`);
  }

  async getByHash(
    hash: string,
  ): Promise<Result<ModelVersionEndpointData, CivitaiError>> {
    return this.client.get<ModelVersionEndpointData>(
      `model-versions/by-hash/${hash}`,
    );
  }

  async resolveFileDownloadUrl(
    fileDownloadUrl: string,
    token?: string,
  ): Promise<Result<string, CivitaiError>> {
    // Use the client's download token if no token is provided
    const downloadToken =
      token ||
      this.client.getConfig().downloadToken ||
      this.client.getConfig().apiKey;

    if (!downloadToken) {
      // Create a simple error that matches CivitaiError structure
      const error: CivitaiError = {
        type: "UNAUTHORIZED",
        status: 401,
        message:
          "Download token is required to resolve file download URLs. Please provide apiKey or downloadToken in client configuration.",
        details: {
          suggestion:
            "Add your API key or download token to the client configuration",
        },
      };
      return err(error);
    }

    // Make a GET request with Authorization header to follow redirects and get the final URL
    // According to example.ts, we should use Authorization header, not token in URL
    try {
      const response = await fetch(fileDownloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${downloadToken}`,
        },
        redirect: "follow", // Ensure we follow redirects to get the final CDN URL
      });

      if (!response.ok) {
        if (response.status === 401) {
          const error: CivitaiError = {
            type: "UNAUTHORIZED",
            status: 401,
            message: `Unauthorized to access model file download URL: ${fileDownloadUrl}. You may need to purchase the model on Civitai.`,
            details: {
              suggestion:
                "Check if you have access to this model or if your API key is valid",
            },
          };
          return err(error);
        } else {
          const error: CivitaiError = {
            type: "NETWORK_ERROR",
            status: response.status,
            code: `HTTP_${response.status}`,
            message: `Failed to resolve model file download URL: ${fileDownloadUrl}. Status: ${response.status} ${response.statusText}`,
            originalError: new Error(
              `HTTP ${response.status}: ${response.statusText}`,
            ),
          };
          return err(error);
        }
      }

      // Return the final URL after following redirects
      // response.url contains the final URL after all redirects
      return ok(response.url);
    } catch (error) {
      // Handle network errors
      const networkError: CivitaiError = {
        type: "NETWORK_ERROR",
        status: 0,
        code: "NETWORK_ERROR",
        message: `Network error while resolving download URL: ${error instanceof Error ? error.message : String(error)}`,
        originalError: error,
      };
      return err(networkError);
    }
  }

  /**
   * Add token to model file download URL
   * This is the same logic as in the deprecated download module
   */
  private makeModelFileDownloadUrl(url: string, token: string): string {
    const urlObj = new URL(url);
    urlObj.searchParams.set("token", token);
    return urlObj.toString();
  }
}
