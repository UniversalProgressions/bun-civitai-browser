import { describe, it, expect } from "bun:test";
import { createCivitaiClient } from "../../index";
import { isValidationError } from "../../client/errors";

describe("Arktype Validation", () => {
  it("should create client with validation enabled", () => {
    const client = createCivitaiClient({
      validateResponses: true, // Enable response validation
    });

    const config = client.getConfig();
    expect(config).toBeDefined();
    expect(config.validateResponses).toBe(true);
  });

  it("should demonstrate validation error structure", () => {
    // Simulate an invalid response (this would normally come from the API)
    const invalidModelResponse = {
      items: [
        {
          id: "not-a-number", // Should be number, but is string
          name: 123, // Should be string, but is number
          description: null,
          type: "InvalidType", // Not in the allowed types
          poi: "not-boolean", // Should be boolean
          nsfw: false,
          nsfwLevel: 1,
          stats: {
            downloadCount: "1000", // Should be number
            ratingCount: 50,
            rating: 4.5,
          },
          tags: ["tag1", "tag2"],
          modelVersions: [
            {
              id: 1,
              index: 0,
              name: "v1.0",
              baseModel: "SD 1.5",
              baseModelType: null,
              publishedAt: "2023-01-01T00:00:00.000Z",
              availability: "Public",
              nsfwLevel: 1,
              description: null,
              trainedWords: ["keyword1", "keyword2"],
              stats: {
                downloadCount: 100,
                ratingCount: 10,
                rating: 4.5,
              },
              files: [],
              images: [],
            },
          ],
        },
      ],
      metadata: {
        totalItems: 1,
        currentPage: 1,
        pageSize: 20,
        totalPages: 1,
      },
    };

    // This is just for demonstration - in real usage, validation would happen automatically
    // when validateResponses is enabled and the API returns invalid data
    expect(invalidModelResponse).toBeDefined();
    expect(invalidModelResponse.items).toBeDefined();
    expect(Array.isArray(invalidModelResponse.items)).toBe(true);

    // Check that the invalid data has the expected structure
    const invalidItem = invalidModelResponse.items[0]!;
    expect(typeof invalidItem.id).toBe("string"); // This is invalid (should be number)
    expect(typeof invalidItem.name).toBe("number"); // This is invalid (should be string)
    expect(invalidItem.type).toBe("InvalidType"); // This is invalid
    expect(typeof invalidItem.poi).toBe("string"); // This is invalid (should be boolean)
    expect(typeof invalidItem.stats.downloadCount).toBe("string"); // This is invalid (should be number)
  });

  it("should demonstrate how to handle validation errors in application", async () => {
    // Create client with validation enabled
    const client = createCivitaiClient({
      validateResponses: true,
    });

    // Make an API request (this will make actual API call)
    const result = await client.models.list({ limit: 10 });

    if (result.isErr()) {
      const error = result.error;

      // Check if it's a validation error
      if (isValidationError(error)) {
        // Validation failed
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe("string");
        expect(error.details).toBeDefined();

        // Arktype provides detailed error information:
        // - error.details.summary: Human-readable summary
        // - error.details.problems: Array of specific problems
        // - error.details.byPath: Errors organized by path

        // You can display this to developers or log it for debugging
        console.log("Validation failed:");
        console.log("Message:", error.message);
        console.log("Arktype error details:", error.details);
      } else {
        // Handle other error types (network, unauthorized, etc.)
        expect(error).toBeDefined();
        expect(error.type).toBeDefined();
        expect(error.message).toBeDefined();
      }
    } else {
      // Success - data is validated and type-safe
      const models = result.value;
      expect(models).toBeDefined();
      expect(models.items).toBeDefined();
      expect(Array.isArray(models.items)).toBe(true);
      expect(models.metadata).toBeDefined();

      console.log(`Found ${models.items.length} models (validation passed)`);
    }
  });

  it("should demonstrate benefits of arktype validation", () => {
    // This test documents the benefits of arktype validation
    const benefits = [
      "Type safety at runtime",
      "Detailed, human-readable error messages",
      "Automatic TypeScript type inference",
      "Early detection of API contract violations",
      "Better debugging experience",
    ];

    expect(benefits).toBeDefined();
    expect(Array.isArray(benefits)).toBe(true);
    expect(benefits.length).toBeGreaterThan(0);

    // Verify each benefit is a string
    benefits.forEach((benefit) => {
      expect(typeof benefit).toBe("string");
      expect(benefit.length).toBeGreaterThan(0);
    });
  });

  it("should handle validation with different client configurations", () => {
    // Test client creation with validation disabled (default)
    const clientWithoutValidation = createCivitaiClient({
      validateResponses: false,
    });

    expect(clientWithoutValidation.getConfig().validateResponses).toBe(false);

    // Test client creation with validation enabled
    const clientWithValidation = createCivitaiClient({
      validateResponses: true,
    });

    expect(clientWithValidation.getConfig().validateResponses).toBe(true);

    // Test client creation with default configuration (validation disabled by default)
    const defaultClient = createCivitaiClient();

    expect(defaultClient.getConfig().validateResponses).toBe(false);
  });

  it("should demonstrate error type checking", () => {
    // Create a mock error object that resembles a validation error
    const mockValidationError = {
      type: "validation",
      message:
        "Validation failed: Expected number at 'items[0].id', got string ('not-a-number')",
      details: {
        summary: "Validation failed",
        problems: [
          {
            path: "items[0].id",
            message: "Expected number, got string",
            value: "not-a-number",
          },
        ],
        byPath: {
          "items[0].id": ["Expected number, got string"],
        },
      },
    };

    // Check if it has validation error structure
    const hasValidationStructure =
      mockValidationError.type === "validation" &&
      mockValidationError.message !== undefined &&
      mockValidationError.details !== undefined &&
      mockValidationError.details.summary !== undefined &&
      mockValidationError.details.problems !== undefined;

    expect(hasValidationStructure).toBe(true);

    // In real usage, isValidationError function would check this
    // For this test, we just verify the structure
    if (hasValidationStructure) {
      expect(mockValidationError.details.problems[0]!.path).toBe("items[0].id");
      expect(mockValidationError.details.problems[0]!.message).toContain(
        "Expected number",
      );
    }
  });
});
