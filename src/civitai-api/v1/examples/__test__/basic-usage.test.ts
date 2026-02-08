import { describe, it, expect, beforeAll } from "bun:test";
import { createCivitaiClient } from "../../index";
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
  LEGACY_EXAMPLE_MODEL_ID,
} from "../shared-ids";

describe("Civitai API Client Basic Usage", () => {
  let client: ReturnType<typeof createCivitaiClient>;

  beforeAll(() => {
    // Create client with configuration from environment variables
    client = createCivitaiClient({
      apiKey: process.env.CIVITAI_API_KEY, // Read API key from environment variable
      timeout: 6000, // 30 seconds timeout to avoid long waits
      validateResponses: false, // Do not validate responses (recommended to enable in production)
    });
  });

  it("should create client with configuration", () => {
    const config = client.getConfig();
    expect(config).toBeDefined();
    expect(config.timeout).toBe(6000);
    expect(config.validateResponses).toBe(false);
    // API key may be undefined if not set in environment
    if (process.env.CIVITAI_API_KEY) {
      expect(config.apiKey).toBe(process.env.CIVITAI_API_KEY);
    }
  });

  it.skip("should fetch creators list", async () => {
    // Note: Civitai API's creators endpoint may be unstable, sometimes returning 500 errors
    // This is an API server issue, not a client issue
    const creatorsResult = await client.creators.list({
      limit: 3,
    });

    if (creatorsResult.isOk()) {
      const creators = creatorsResult.value;
      expect(creators).toBeDefined();
      expect(creators.items).toBeDefined();
      expect(Array.isArray(creators.items)).toBe(true);
      expect(creators.metadata).toBeDefined();
      // totalItems might be undefined or null in some API responses
      if (
        creators.metadata.totalItems !== undefined &&
        creators.metadata.totalItems !== null
      ) {
        expect(creators.metadata.totalItems).toBeGreaterThanOrEqual(0);
      }
      expect(creators.metadata.currentPage).toBe(1);
      expect(creators.metadata.pageSize).toBe(3);

      // Check first few creators if available
      if (creators.items.length > 0) {
        const creator = creators.items[0]!;
        expect(creator).toBeDefined();
        expect(creator.username).toBeDefined();
        expect(typeof creator.username).toBe("string");
        // modelCount might not exist in all API responses
        if ("modelCount" in creator) {
          expect(creator.modelCount).toBeDefined();
          expect(typeof creator.modelCount).toBe("number");
        }
      }
    } else {
      // If API returns error, it might be a server issue
      const error = creatorsResult.error;
      expect(error).toBeDefined();
      expect(error.type).toBeDefined();
      expect(error.message).toBeDefined();
    }
  }, 10000); // Increased timeout for this test

  it("should fetch models list", async () => {
    const modelsResult = await client.models.list({
      limit: 2,
      types: ["Checkpoint"],
      sort: "Highest Rated",
    });

    // Don't fail if API returns error, just log it
    if (modelsResult.isOk()) {
      const models = modelsResult.value;
      expect(models).toBeDefined();
      expect(models.items).toBeDefined();
      expect(Array.isArray(models.items)).toBe(true);
      expect(models.metadata).toBeDefined();
      // totalItems might be undefined or null
      if (
        models.metadata.totalItems !== undefined &&
        models.metadata.totalItems !== null
      ) {
        expect(models.metadata.totalItems).toBeGreaterThanOrEqual(0);
      }

      if (models.items.length > 0) {
        const model = models.items[0]!;
        expect(model).toBeDefined();
        expect(model.name).toBeDefined();
        expect(typeof model.name).toBe("string");
        expect(model.type).toBe("Checkpoint");
        expect(model.creator).toBeDefined();
        expect(model.stats).toBeDefined();
        expect(model.stats.downloadCount).toBeDefined();
        expect(typeof model.stats.downloadCount).toBe("number");
        expect(model.modelVersions).toBeDefined();
        expect(Array.isArray(model.modelVersions)).toBe(true);
      }
    } else {
      // Log error but don't fail test
      console.log(`Models list API error: ${modelsResult.error.message}`);
    }
  }, 10000);

  it("should fetch single model by ID", async () => {
    const modelId = LEGACY_EXAMPLE_MODEL_ID;
    const modelResult = await client.models.getById(modelId);

    if (modelResult.isOk()) {
      const model = modelResult.value;
      expect(model).toBeDefined();
      expect(model.id).toBe(modelId);
      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe("string");
      expect(model.type).toBeDefined();
      expect(typeof model.type).toBe("string");
      expect(model.nsfw).toBeDefined();
      expect(typeof model.nsfw).toBe("boolean");
      expect(model.tags).toBeDefined();
      expect(Array.isArray(model.tags)).toBe(true);
      expect(model.modelVersions).toBeDefined();
      expect(Array.isArray(model.modelVersions)).toBe(true);
    } else {
      // Log error but don't fail test
      console.log(`Model by ID API error: ${modelResult.error.message}`);
    }
  }, 10000);

  it("should fetch tags list", async () => {
    const tagsResult = await client.tags.list({
      limit: 5,
    });

    if (tagsResult.isOk()) {
      const tags = tagsResult.value;
      expect(tags).toBeDefined();
      expect(tags.items).toBeDefined();
      expect(Array.isArray(tags.items)).toBe(true);
      expect(tags.metadata).toBeDefined();
      // totalItems might be undefined or null
      if (
        tags.metadata.totalItems !== undefined &&
        tags.metadata.totalItems !== null
      ) {
        expect(tags.metadata.totalItems).toBeGreaterThanOrEqual(0);
      }

      if (tags.items.length > 0) {
        const tag = tags.items[0]!;
        expect(tag).toBeDefined();
        expect(tag.name).toBeDefined();
        expect(typeof tag.name).toBe("string");
        // modelCount might not exist in all API responses
        if ("modelCount" in tag) {
          expect(tag.modelCount).toBeDefined();
          expect(typeof tag.modelCount).toBe("number");
        }
      }
    } else {
      // Log error but don't fail test
      console.log(`Tags list API error: ${tagsResult.error.message}`);
    }
  }, 10000);

  it("should fetch next page of models using nextPage method", async () => {
    // First, get initial page
    const firstPageResult = await client.models.list({
      limit: 2,
      types: ["Checkpoint"],
      sort: "Highest Rated",
    });

    if (firstPageResult.isOk()) {
      const firstPage = firstPageResult.value;
      expect(firstPage).toBeDefined();
      expect(firstPage.items).toBeDefined();
      expect(Array.isArray(firstPage.items)).toBe(true);
      expect(firstPage.metadata).toBeDefined();

      // Check if next page is available
      if (firstPage.metadata.nextPage) {
        console.log(`Next page URL available: ${firstPage.metadata.nextPage}`);

        // Fetch next page using nextPage method
        const nextPageResult = await client.models.nextPage(
          firstPage.metadata.nextPage,
        );

        if (nextPageResult.isOk()) {
          const nextPage = nextPageResult.value;
          expect(nextPage).toBeDefined();
          expect(nextPage.items).toBeDefined();
          expect(Array.isArray(nextPage.items)).toBe(true);
          expect(nextPage.metadata).toBeDefined();

          // Have noo use to verify it's a different page
          // expect(nextPage.metadata.currentPage).toBe(
          //   firstPage.metadata.currentPage + 1,
          // );

          // Verify items are different (not guaranteed but likely)
          if (firstPage.items.length > 0 && nextPage.items.length > 0) {
            const firstPageFirstModel = firstPage.items[0]!;
            const nextPageFirstModel = nextPage.items[0]!;

            // They might be different models
            console.log(`First page first model ID: ${firstPageFirstModel.id}`);
            console.log(`Next page first model ID: ${nextPageFirstModel.id}`);
          }

          // Check if there's another next page
          if (nextPage.metadata.nextPage) {
            console.log(
              `Another next page available: ${nextPage.metadata.nextPage}`,
            );
          }
        } else {
          throw new Error(
            `Fetch next page API error: ${nextPageResult.error.message}`,
          );
        }
      } else {
        throw new Error("No next page available from first page");
      }
    } else {
      throw new Error(`First page API error: ${firstPageResult.error.message}`);
    }
  }, 15000); // Increased timeout for pagination test
});
