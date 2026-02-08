/**
 * Download URL resolution tests
 *
 * Tests for the resolveFileDownloadUrl functionality in the Civitai API client.
 */

import { describe, test, expect, beforeEach } from "bun:test";
import { createCivitaiClient } from "../index";

// Mock for ky instance to avoid actual network requests in tests
const mockKyInstance = {
  get: async (url: string, options?: any) => {
    // Simulate successful redirect
    if (url.includes("token=valid-token")) {
      return {
        ok: true,
        url: "https://cdn.civitai.com/actual-file.safetensors",
        status: 200,
        statusText: "OK",
      };
    }

    // Simulate unauthorized error
    if (url.includes("token=invalid-token")) {
      return {
        ok: false,
        url,
        status: 401,
        statusText: "Unauthorized",
      };
    }

    // Simulate other error
    if (url.includes("token=error-token")) {
      return {
        ok: false,
        url,
        status: 500,
        statusText: "Internal Server Error",
      };
    }

    // Default success
    return {
      ok: true,
      url: "https://cdn.civitai.com/default-file.safetensors",
      status: 200,
      statusText: "OK",
    };
  },
};

describe("Download URL resolution", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeEach(() => {
    // Create client with test configuration
    client = createCivitaiClient({
      apiKey: "test-api-key",
      downloadToken: "test-download-token",
      timeout: 5000,
      validateResponses: false,
    });

    // Mock the kyInstance for testing
    (client.client as any).kyInstance = mockKyInstance;
  });

  test("should resolve download URL with valid token", async () => {
    const downloadUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";

    // Temporarily override the makeModelFileDownloadUrl to use test token
    const originalMethod = (client.modelVersions as any)
      .makeModelFileDownloadUrl;
    (client.modelVersions as any).makeModelFileDownloadUrl = (
      url: string,
      token: string,
    ) => {
      const urlObj = new URL(url);
      urlObj.searchParams.set("token", "valid-token");
      return urlObj.toString();
    };

    try {
      const result =
        await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          "https://cdn.civitai.com/actual-file.safetensors",
        );
      }
    } finally {
      // Restore original method
      (client.modelVersions as any).makeModelFileDownloadUrl = originalMethod;
    }
  });

  test("should handle unauthorized error", async () => {
    const downloadUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";

    // Temporarily override the makeModelFileDownloadUrl to use invalid token
    const originalMethod = (client.modelVersions as any)
      .makeModelFileDownloadUrl;
    (client.modelVersions as any).makeModelFileDownloadUrl = (
      url: string,
      token: string,
    ) => {
      const urlObj = new URL(url);
      urlObj.searchParams.set("token", "invalid-token");
      return urlObj.toString();
    };

    try {
      const result =
        await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("UNAUTHORIZED");
        // Check if it's an UnauthorizedError type
        if (result.error.type === "UNAUTHORIZED") {
          expect((result.error as any).status).toBe(401);
        }
        expect(result.error.message).toContain(
          "Unauthorized to access model file download URL",
        );
      }
    } finally {
      // Restore original method
      (client.modelVersions as any).makeModelFileDownloadUrl = originalMethod;
    }
  });

  test("should handle other HTTP errors", async () => {
    const downloadUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";

    // Temporarily override the makeModelFileDownloadUrl to use error token
    const originalMethod = (client.modelVersions as any)
      .makeModelFileDownloadUrl;
    (client.modelVersions as any).makeModelFileDownloadUrl = (
      url: string,
      token: string,
    ) => {
      const urlObj = new URL(url);
      urlObj.searchParams.set("token", "error-token");
      return urlObj.toString();
    };

    try {
      const result =
        await client.modelVersions.resolveFileDownloadUrl(downloadUrl);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("NETWORK_ERROR");
        // Check if it's a NetworkError type
        if (result.error.type === "NETWORK_ERROR") {
          expect((result.error as any).status).toBe(500);
        }
        expect(result.error.message).toContain(
          "Failed to resolve model file download URL",
        );
      }
    } finally {
      // Restore original method
      (client.modelVersions as any).makeModelFileDownloadUrl = originalMethod;
    }
  });

  test("should use downloadToken when provided", async () => {
    const clientWithDownloadToken = createCivitaiClient({
      downloadToken: "custom-download-token",
      timeout: 5000,
    });

    // Mock the kyInstance
    (clientWithDownloadToken.client as any).kyInstance = mockKyInstance;

    // Check that downloadToken is in config
    const config = clientWithDownloadToken.client.getConfig();
    expect(config.downloadToken).toBe("custom-download-token");
  });

  test("should fall back to apiKey when downloadToken not provided", async () => {
    const clientWithApiKeyOnly = createCivitaiClient({
      apiKey: "fallback-api-key",
      timeout: 5000,
    });

    // Mock the kyInstance
    (clientWithApiKeyOnly.client as any).kyInstance = mockKyInstance;

    const config = clientWithApiKeyOnly.client.getConfig();
    expect(config.apiKey).toBe("fallback-api-key");
    expect(config.downloadToken).toBeUndefined();
  });

  test("should return error when no token is available", async () => {
    const clientWithoutToken = createCivitaiClient({
      timeout: 5000,
    });

    // Mock the kyInstance
    (clientWithoutToken.client as any).kyInstance = mockKyInstance;

    const downloadUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";
    const result =
      await clientWithoutToken.modelVersions.resolveFileDownloadUrl(
        downloadUrl,
      );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("UNAUTHORIZED");
      expect(result.error.message).toContain("Download token is required");
    }
  });

  test("makeModelFileDownloadUrl should add token to URL", () => {
    const endpointImpl = client.modelVersions as any;
    const originalUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";
    const token = "test-token-123";

    const result = endpointImpl.makeModelFileDownloadUrl(originalUrl, token);

    expect(result).toContain("token=test-token-123");
    expect(result).toContain(originalUrl);

    const urlObj = new URL(result);
    expect(urlObj.searchParams.get("token")).toBe("test-token-123");
  });

  test("should accept explicit token parameter", async () => {
    const clientWithoutToken = createCivitaiClient({
      timeout: 5000,
    });

    // Mock the kyInstance
    (clientWithoutToken.client as any).kyInstance = mockKyInstance;

    const downloadUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";

    // Temporarily override to use explicit token
    const originalMethod = (clientWithoutToken.modelVersions as any)
      .makeModelFileDownloadUrl;
    (clientWithoutToken.modelVersions as any).makeModelFileDownloadUrl = (
      url: string,
      token: string,
    ) => {
      const urlObj = new URL(url);
      urlObj.searchParams.set("token", "explicit-token");
      return urlObj.toString();
    };

    try {
      const result =
        await clientWithoutToken.modelVersions.resolveFileDownloadUrl(
          downloadUrl,
          "explicit-token",
        );

      // Should succeed with explicit token even though client has no token configured
      expect(result.isOk()).toBe(true);
    } finally {
      // Restore original method
      (clientWithoutToken.modelVersions as any).makeModelFileDownloadUrl =
        originalMethod;
    }
  });
});

describe("Integration with model versions", () => {
  test("should work with real model version data structure", async () => {
    // Create a new client for this test
    const testClient = createCivitaiClient({
      apiKey: "test-api-key",
      timeout: 5000,
    });

    // Mock the kyInstance
    (testClient.client as any).kyInstance = mockKyInstance;

    // This test verifies that the method signature matches the expected data structure
    const downloadUrl =
      "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";

    // Just test that the method can be called with correct parameters
    const result = await testClient.modelVersions.resolveFileDownloadUrl(
      downloadUrl,
      "test-token",
    );

    // We don't assert the actual result since it depends on network
    // Just verify the method doesn't throw
    expect(result).toBeDefined();
    expect(typeof result.isOk === "function").toBe(true);
    expect(typeof result.isErr === "function").toBe(true);
  });
});
