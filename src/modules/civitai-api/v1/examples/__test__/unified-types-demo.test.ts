import { describe, it, expect, beforeAll } from "bun:test";
import { createCivitaiClient } from "../../../v1/index";
import type {
  ModelVersionCore,
  ModelVersionAny,
  ModelCore,
  ModelAny,
} from "../../../v1/models/model-version-abstract";
import {
  toModelVersionCore,
  toModelCore,
  getModelId,
  getIndex,
  getAvailability,
  getPublishedAt,
  isModelsVersion,
  isModelByIdVersion,
  isModelVersionEndpoint,
  isModelsEndpointModel,
  isModelByIdEndpointModel,
  findModelVersion,
  findModel,
} from "../../../v1/models/model-version-abstract";
import { extractIdFromImageUrl } from "../../../v1/utils";
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
  EXAMPLE_MODEL_ID_2,
  EXAMPLE_VERSION_ID_2,
  LEGACY_EXAMPLE_MODEL_ID,
  LEGACY_EXAMPLE_VERSION_ID,
  MODEL_VERSION_ENDPOINT_EXAMPLE_ID,
} from "../shared-ids";

describe("Unified Types System", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeAll(() => {
    client = createCivitaiClient({
      timeout: 60000,
    });
  });

  it("should fetch data from different endpoints and demonstrate unified type system", async () => {
    // Fetch data from different endpoints
    const [modelsResult, modelByIdResult, modelVersionResult] =
      await Promise.all([
        client.models.list({ limit: 1 }),
        client.models.getById(EXAMPLE_MODEL_ID),
        client.modelVersions.getById(MODEL_VERSION_ENDPOINT_EXAMPLE_ID),
      ]);

    // Skip test if any endpoint fails (might be due to API availability)
    if (
      modelsResult.isErr() ||
      modelByIdResult.isErr() ||
      modelVersionResult.isErr()
    ) {
      console.log("Skipping unified types test due to API errors");
      return;
    }

    // Get ModelVersion data from different endpoints
    const modelsVersion = modelsResult.value.items[0]?.modelVersions[0];
    const modelByIdVersion = modelByIdResult.value.modelVersions[0];
    const modelVersionEndpoint = modelVersionResult.value;

    // Skip if we don't have all version data
    if (!modelsVersion || !modelByIdVersion || !modelVersionEndpoint) {
      console.log("Skipping unified types test due to missing version data");
      return;
    }

    // Create an array with ModelVersion from all endpoints
    const versions: ModelVersionAny[] = [
      modelsVersion,
      modelByIdVersion,
      modelVersionEndpoint,
    ];

    expect(versions).toHaveLength(3);

    // Process each version using unified type system
    versions.forEach((version, index) => {
      // Extract core fields (safe for all endpoints)
      const core: ModelVersionCore = toModelVersionCore(version);
      expect(core).toBeDefined();
      expect(core.id).toBeDefined();
      expect(typeof core.id).toBe("number");
      expect(core.name).toBeDefined();
      expect(typeof core.name).toBe("string");
      expect(core.baseModel).toBeDefined();
      expect(typeof core.baseModel).toBe("string");
      expect(core.files).toBeDefined();
      expect(Array.isArray(core.files)).toBe(true);
      expect(core.images).toBeDefined();
      expect(Array.isArray(core.images)).toBe(true);

      // Safely access endpoint-specific fields
      const modelId = getModelId(version);
      const indexValue = getIndex(version);
      const availability = getAvailability(version);
      const publishedAt = getPublishedAt(version);

      // Use type guards for conditional logic
      if (isModelsVersion(version)) {
        expect(version.index).toBeDefined();
        expect(version.availability).toBeDefined();
      } else if (isModelByIdVersion(version)) {
        expect(version.index).toBeDefined();
        expect(version.availability).toBeDefined();
      } else if (isModelVersionEndpoint(version)) {
        expect(version.modelId).toBeDefined();
      }
    });
  });

  it("should use findModelVersion utility", async () => {
    // Fetch some version data to test findModelVersion
    const modelVersionResult = await client.modelVersions.getById(
      MODEL_VERSION_ENDPOINT_EXAMPLE_ID,
    );

    if (modelVersionResult.isErr()) {
      console.log("Skipping findModelVersion test due to API error");
      return;
    }

    const modelVersionEndpoint = modelVersionResult.value;
    const versions: ModelVersionAny[] = [modelVersionEndpoint];

    // Find a specific version by ID
    const targetId = modelVersionEndpoint.id;
    const foundVersion = findModelVersion(versions, targetId);

    expect(foundVersion).toBeDefined();
    if (foundVersion) {
      const core = toModelVersionCore(foundVersion);
      expect(core.id).toBe(targetId);
      expect(core.name).toBeDefined();
      expect(core.baseModel).toBeDefined();
    }
  });

  it("should demonstrate practical use case: processing mixed data", async () => {
    // Fetch data to simulate processing
    const modelsResult = await client.models.list({ limit: 2 });

    if (modelsResult.isErr()) {
      console.log("Skipping mixed data processing test due to API error");
      return;
    }

    const models = modelsResult.value.items;
    if (models.length === 0) {
      console.log(
        "Skipping mixed data processing test due to no models returned",
      );
      return;
    }

    // Get versions from first model
    const versions = models[0]!.modelVersions.slice(0, 2);
    if (versions.length === 0) {
      console.log("Skipping mixed data processing test due to no versions");
      return;
    }

    // Simulate processing data from multiple sources
    const stats = {
      total: versions.length,
      fromModelsEndpoint: 0,
      fromModelByIdEndpoint: 0,
      fromModelVersionEndpoint: 0,
      totalFiles: 0,
      totalImages: 0,
    };

    versions.forEach((version) => {
      if (isModelsVersion(version)) {
        stats.fromModelsEndpoint++;
      } else if (isModelByIdVersion(version)) {
        stats.fromModelByIdEndpoint++;
      } else if (isModelVersionEndpoint(version)) {
        stats.fromModelVersionEndpoint++;
      }

      const core = toModelVersionCore(version);
      stats.totalFiles += core.files.length;
      stats.totalImages += core.images.length;
    });

    expect(stats.total).toBe(versions.length);
    expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
    expect(stats.totalImages).toBeGreaterThanOrEqual(0);
  });

  it("should demonstrate unified Model type system", async () => {
    // Fetch Model data from different endpoints
    const [modelsListResult, modelByIdResult] = await Promise.all([
      client.models.list({ limit: 1 }),
      client.models.getById(EXAMPLE_MODEL_ID),
    ]);

    // Skip test if any endpoint fails
    if (modelsListResult.isErr() || modelByIdResult.isErr()) {
      console.log("Skipping unified Model type system test due to API errors");
      return;
    }

    // Get Model data from different endpoints
    const modelsEndpointModel = modelsListResult.value.items[0];
    const modelByIdEndpointModel = modelByIdResult.value;

    // Skip if we don't have model data
    if (!modelsEndpointModel || !modelByIdEndpointModel) {
      console.log(
        "Skipping unified Model type system test due to missing model data",
      );
      return;
    }

    // Create an array with Model from all endpoints
    const models: ModelAny[] = [modelsEndpointModel, modelByIdEndpointModel];

    expect(models).toHaveLength(2);

    // Process each Model using unified type system
    models.forEach((model, index) => {
      // Extract core fields (safe for all endpoints)
      const core: ModelCore = toModelCore(model);
      expect(core).toBeDefined();
      expect(core.id).toBeDefined();
      expect(typeof core.id).toBe("number");
      expect(core.name).toBeDefined();
      expect(typeof core.name).toBe("string");
      expect(core.type).toBeDefined();
      expect(typeof core.type).toBe("string");
      expect(core.tags).toBeDefined();
      expect(Array.isArray(core.tags)).toBe(true);
      expect(core.modelVersions).toBeDefined();
      expect(Array.isArray(core.modelVersions)).toBe(true);

      // Use type guards for conditional logic
      if (isModelsEndpointModel(model)) {
        expect(model.modelVersions).toBeDefined();
      } else if (isModelByIdEndpointModel(model)) {
        expect(model.modelVersions).toBeDefined();
      }
    });
  });

  it("should use findModel utility", async () => {
    // Fetch model data to test findModel
    const modelByIdResult = await client.models.getById(EXAMPLE_MODEL_ID);

    if (modelByIdResult.isErr()) {
      console.log("Skipping findModel test due to API error");
      return;
    }

    const model = modelByIdResult.value;
    const models: ModelAny[] = [model];

    // Find a specific model by ID
    const targetModelId = EXAMPLE_MODEL_ID;
    const foundModel = findModel(models, targetModelId);

    expect(foundModel).toBeDefined();
    if (foundModel) {
      const core = toModelCore(foundModel);
      expect(core.id).toBe(targetModelId);
      expect(core.name).toBeDefined();
      expect(core.type).toBeDefined();
    }
  }, 60000); // Increased timeout for this test

  it("should demonstrate practical use case: processing mixed Model data", async () => {
    // Fetch models to simulate processing
    const modelsResult = await client.models.list({ limit: 2 });

    if (modelsResult.isErr()) {
      console.log("Skipping mixed Model data processing test due to API error");
      return;
    }

    const models = modelsResult.value.items;
    if (models.length === 0) {
      console.log(
        "Skipping mixed Model data processing test due to no models returned",
      );
      return;
    }

    const stats = {
      total: models.length,
      fromModelsEndpoint: 0,
      fromModelByIdEndpoint: 0,
      totalVersions: 0,
      totalTags: 0,
      totalDownloads: 0,
    };

    models.forEach((model) => {
      if (isModelsEndpointModel(model)) {
        stats.fromModelsEndpoint++;
      } else if (isModelByIdEndpointModel(model)) {
        stats.fromModelByIdEndpoint++;
      }

      const core = toModelCore(model);
      stats.totalVersions += core.modelVersions.length;
      stats.totalTags += core.tags.length;
      stats.totalDownloads += core.stats.downloadCount;
    });

    expect(stats.total).toBe(models.length);
    expect(stats.totalVersions).toBeGreaterThanOrEqual(0);
    expect(stats.totalTags).toBeGreaterThanOrEqual(0);
    expect(stats.totalDownloads).toBeGreaterThanOrEqual(0);
  });

  it("should extract ID from image URL", () => {
    // Test valid Civitai URL
    const url =
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/1743606.jpeg";
    const result = extractIdFromImageUrl(url);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(1743606);
    }

    // Test URL with query parameters
    const urlWithQuery =
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/6039981.jpeg?token=abc123";
    const result2 = extractIdFromImageUrl(urlWithQuery);
    expect(result2.isOk()).toBe(true);
    if (result2.isOk()) {
      expect(result2.value).toBe(6039981);
    }

    // Test URL without file extension
    const urlWithoutExtension =
      "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/cbe20dcf-7721-4f34-bc24-9ff14b96cab2/width=1024/123456";
    const result3 = extractIdFromImageUrl(urlWithoutExtension);
    expect(result3.isOk()).toBe(true);
    if (result3.isOk()) {
      expect(result3.value).toBe(123456);
    }

    // Test invalid URL
    const invalidUrl = "not-a-valid-url";
    const result4 = extractIdFromImageUrl(invalidUrl);
    expect(result4.isErr()).toBe(true);

    // Test URL without filename
    const urlWithoutFilename = "https://example.com/";
    const result5 = extractIdFromImageUrl(urlWithoutFilename);
    expect(result5.isErr()).toBe(true);

    // Test non-numeric filename
    const nonNumericUrl = "https://example.com/image.jpg";
    const result6 = extractIdFromImageUrl(nonNumericUrl);
    expect(result6.isErr()).toBe(true);
  });
});
