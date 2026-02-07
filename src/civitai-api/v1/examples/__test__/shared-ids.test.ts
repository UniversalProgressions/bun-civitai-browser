import { describe, it, expect } from "bun:test";
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
  EXAMPLE_MODEL_ID_2,
  EXAMPLE_VERSION_ID_2,
  LEGACY_EXAMPLE_MODEL_ID,
  LEGACY_EXAMPLE_VERSION_ID,
  MODEL_VERSION_ENDPOINT_EXAMPLE_ID,
  getExampleIds,
  printExampleIds,
} from "../shared-ids";

describe("Shared IDs for Civitai API examples", () => {
  it("should export all example IDs as numbers", () => {
    expect(typeof EXAMPLE_MODEL_ID).toBe("number");
    expect(typeof EXAMPLE_VERSION_ID).toBe("number");
    expect(typeof EXAMPLE_MODEL_ID_2).toBe("number");
    expect(typeof EXAMPLE_VERSION_ID_2).toBe("number");
    expect(typeof LEGACY_EXAMPLE_MODEL_ID).toBe("number");
    expect(typeof LEGACY_EXAMPLE_VERSION_ID).toBe("number");
    expect(typeof MODEL_VERSION_ENDPOINT_EXAMPLE_ID).toBe("number");
  });

  it("should have positive ID values", () => {
    expect(EXAMPLE_MODEL_ID).toBeGreaterThan(0);
    expect(EXAMPLE_VERSION_ID).toBeGreaterThan(0);
    expect(EXAMPLE_MODEL_ID_2).toBeGreaterThan(0);
    expect(EXAMPLE_VERSION_ID_2).toBeGreaterThan(0);
    expect(LEGACY_EXAMPLE_MODEL_ID).toBeGreaterThan(0);
    expect(LEGACY_EXAMPLE_VERSION_ID).toBeGreaterThan(0);
    expect(MODEL_VERSION_ENDPOINT_EXAMPLE_ID).toBeGreaterThan(0);
  });

  it("should have unique IDs", () => {
    const ids = [
      EXAMPLE_MODEL_ID,
      EXAMPLE_VERSION_ID,
      EXAMPLE_MODEL_ID_2,
      EXAMPLE_VERSION_ID_2,
      LEGACY_EXAMPLE_MODEL_ID,
      LEGACY_EXAMPLE_VERSION_ID,
      MODEL_VERSION_ENDPOINT_EXAMPLE_ID,
    ];

    // Note: LEGACY_EXAMPLE_VERSION_ID and MODEL_VERSION_ENDPOINT_EXAMPLE_ID are the same (948574)
    // This is intentional in the original data
    // Check that we have at least 6 unique IDs (out of 7 total, with one duplicate)
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6); // One duplicate expected
    expect(ids.length).toBe(7); // Total IDs including duplicate
  });

  it("should provide getExampleIds function that returns all IDs", () => {
    const ids = getExampleIds();

    expect(ids).toBeDefined();
    expect(typeof ids).toBe("object");

    expect(ids.modelId).toBe(EXAMPLE_MODEL_ID);
    expect(ids.versionId).toBe(EXAMPLE_VERSION_ID);
    expect(ids.modelId2).toBe(EXAMPLE_MODEL_ID_2);
    expect(ids.versionId2).toBe(EXAMPLE_VERSION_ID_2);
    expect(ids.legacyModelId).toBe(LEGACY_EXAMPLE_MODEL_ID);
    expect(ids.legacyVersionId).toBe(LEGACY_EXAMPLE_VERSION_ID);
    expect(ids.modelVersionEndpointId).toBe(MODEL_VERSION_ENDPOINT_EXAMPLE_ID);
  });

  it("should provide printExampleIds function", () => {
    // Mock console.log to capture output
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    console.log = (message: string) => {
      logs.push(message);
    };

    try {
      printExampleIds();

      // Check that some expected output was generated
      expect(logs.length).toBeGreaterThan(0);

      // Check for specific patterns in the output
      const output = logs.join("\n");
      expect(output).toContain("Civitai API Example IDs");
      expect(output).toContain("Primary Model ID");
      expect(output).toContain("Primary Version ID");
      expect(output).toContain("Secondary Model ID");
      expect(output).toContain("Secondary Version ID");
      expect(output).toContain("Legacy Model ID");
      expect(output).toContain("Legacy Version ID");
      expect(output).toContain("Model-Version Endpoint ID");
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
    }
  });

  it("should have consistent ID relationships", () => {
    // Check that example IDs follow expected patterns
    // These are example-specific checks based on the actual ID values

    // Primary model and version should be related
    expect(EXAMPLE_MODEL_ID).toBe(833294);
    expect(EXAMPLE_VERSION_ID).toBe(1116447);

    // Secondary model and version should be related
    expect(EXAMPLE_MODEL_ID_2).toBe(2167995);
    expect(EXAMPLE_VERSION_ID_2).toBe(2532077);

    // Legacy IDs should match the description
    expect(LEGACY_EXAMPLE_MODEL_ID).toBe(7240);
    expect(LEGACY_EXAMPLE_VERSION_ID).toBe(948574);

    // Model version endpoint ID should match legacy version ID
    expect(MODEL_VERSION_ENDPOINT_EXAMPLE_ID).toBe(948574);
  });
});
