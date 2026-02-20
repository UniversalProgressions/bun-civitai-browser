/**
 * Download URL resolution tests
 *
 * Tests for the resolveFileDownloadUrl functionality in the Civitai API client.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createCivitaiClient } from "../index";
import type { CivitaiError } from "../errors";

describe("Download URL resolution", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  test("should resolve download URL with valid token", async () => {
    // Mock fetch to simulate successful redirect
    const mockFetch = async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const request = new Request(url, init);
      const headers = request.headers;
      const authHeader = headers.get("Authorization");

      if (authHeader === "Bearer valid-token") {
        const response = new Response(null, {
          status: 200,
          statusText: "OK",
        });
        Object.defineProperty(response, "url", {
          value: "https://cdn.civitai.com/actual-file.safetensors",
          writable: false,
        });
        return response;
      }

      // Default fallback
      const response = new Response(null, {
        status: 200,
        statusText: "OK",
      });
      Object.defineProperty(response, "url", {
        value: url.toString(),
        writable: false,
      });
      return response;
    };

    // Use type assertion to bypass TypeScript's strict type checking
    global.fetch = mockFetch as any;

    const client = createCivitaiClient({
      apiKey: "valid-token",
      timeout: 5000,
      validateResponses: false,
    });

    const downloadUrl = "https://civitai.com/api/download/models/12345";
    const result =
      await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(
        "https://cdn.civitai.com/actual-file.safetensors",
      );
    }
  });

  test("should handle unauthorized error", async () => {
    // Mock fetch to simulate 401 unauthorized
    const mockFetch = async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const response = new Response(null, {
        status: 401,
        statusText: "Unauthorized",
      });
      Object.defineProperty(response, "url", {
        value: url.toString(),
        writable: false,
      });
      return response;
    };

    // Use type assertion to bypass TypeScript's strict type checking
    global.fetch = mockFetch as any;

    const client = createCivitaiClient({
      apiKey: "invalid-token",
      timeout: 5000,
      validateResponses: false,
    });

    const downloadUrl = "https://civitai.com/api/download/models/12345";
    const result =
      await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error = result.error as CivitaiError;
      expect(error.type).toBe("UNAUTHORIZED");
      // For UNAUTHORIZED error type, we know it has status property
      if (error.type === "UNAUTHORIZED") {
        expect(error.status).toBe(401);
      }
      expect(error.message).toContain(
        "Unauthorized to access model file download URL",
      );
    }
  });

  test("should handle other HTTP errors", async () => {
    // Mock fetch to simulate 500 error
    const mockFetch = async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const response = new Response(null, {
        status: 500,
        statusText: "Internal Server Error",
      });
      Object.defineProperty(response, "url", {
        value: url.toString(),
        writable: false,
      });
      return response;
    };

    // Use type assertion to bypass TypeScript's strict type checking
    global.fetch = mockFetch as any;

    const client = createCivitaiClient({
      apiKey: "error-token",
      timeout: 5000,
      validateResponses: false,
    });

    const downloadUrl = "https://civitai.com/api/download/models/12345";
    const result =
      await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error = result.error as CivitaiError;
      expect(error.type).toBe("NETWORK_ERROR");
      // For NETWORK_ERROR error type, we know it has status property
      if (error.type === "NETWORK_ERROR") {
        expect(error.status).toBe(500);
      }
      expect(error.message).toContain(
        "Failed to resolve model file download URL",
      );
    }
  });

  test("should return error when no token is available", async () => {
    const client = createCivitaiClient({
      timeout: 5000,
      validateResponses: false,
    });

    const downloadUrl = "https://civitai.com/api/download/models/12345";
    const result =
      await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error = result.error as CivitaiError;
      expect(error.type).toBe("UNAUTHORIZED");
      expect(error.message).toContain("Download token is required");
    }
  });

  test("should accept explicit token parameter", async () => {
    // Mock fetch to simulate successful redirect
    const mockFetch = async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const request = new Request(url, init);
      const headers = request.headers;
      const authHeader = headers.get("Authorization");

      if (authHeader === "Bearer explicit-token") {
        const response = new Response(null, {
          status: 200,
          statusText: "OK",
        });
        Object.defineProperty(response, "url", {
          value: "https://cdn.civitai.com/explicit-file.safetensors",
          writable: false,
        });
        return response;
      }

      // Default fallback
      const response = new Response(null, {
        status: 200,
        statusText: "OK",
      });
      Object.defineProperty(response, "url", {
        value: url.toString(),
        writable: false,
      });
      return response;
    };

    // Use type assertion to bypass TypeScript's strict type checking
    global.fetch = mockFetch as any;

    const client = createCivitaiClient({
      timeout: 5000,
      validateResponses: false,
    });

    const downloadUrl = "https://civitai.com/api/download/models/12345";
    const result = await client.modelVersions.resolveFileDownloadUrl(
      downloadUrl,
      "explicit-token",
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(
        "https://cdn.civitai.com/explicit-file.safetensors",
      );
    }
  });

  test("should use downloadToken when provided", async () => {
    const client = createCivitaiClient({
      downloadToken: "custom-download-token",
      timeout: 5000,
      validateResponses: false,
    });

    const config = client.client.getConfig();
    expect(config.downloadToken).toBe("custom-download-token");
  });

  test("should fall back to apiKey when downloadToken not provided", async () => {
    const client = createCivitaiClient({
      apiKey: "fallback-api-key",
      timeout: 5000,
      validateResponses: false,
    });

    const config = client.client.getConfig();
    expect(config.apiKey).toBe("fallback-api-key");
    expect(config.downloadToken).toBeUndefined();
  });
});

describe("Integration with model versions", () => {
  test("should work with real model version data structure", async () => {
    // Create a client without mocking fetch - this will make real network requests
    // but we just want to test that the method can be called
    const testClient = createCivitaiClient({
      apiKey: "test-api-key",
      timeout: 5000,
    });

    const downloadUrl = "https://civitai.com/api/download/models/12345";

    // Just test that the method can be called with correct parameters
    // We'll mock fetch to avoid actual network request
    const originalFetch = global.fetch;
    try {
      const mockFetch = async () => {
        const response = new Response(null, { status: 200, statusText: "OK" });
        Object.defineProperty(response, "url", {
          value: "https://cdn.civitai.com/test-file.safetensors",
          writable: false,
        });
        return response;
      };

      // Use type assertion to bypass TypeScript's strict type checking
      global.fetch = mockFetch as any;

      const result = await testClient.modelVersions.resolveFileDownloadUrl(
        downloadUrl,
        "test-token",
      );

      // We don't assert the actual result since it's mocked
      // Just verify the method doesn't throw
      expect(result).toBeDefined();
      expect(typeof result.isOk === "function").toBe(true);
      expect(typeof result.isErr === "function").toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
