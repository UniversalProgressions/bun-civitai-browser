import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { settingsSchema, type Settings } from "./model";
import { settingsService } from "./service";
import { type } from "arktype";

describe("Settings Module", () => {
  // Clean up before each test
  beforeEach(() => {
    settingsService.resetSettings();
  });

  afterEach(() => {
    settingsService.resetSettings();
  });

  describe("Schema Validation", () => {
    test("should validate correct settings", () => {
      const validSettings: Settings = {
        basePath: "/path/to/models",
        civitai_api_token: "test_token_123",
        gopeed_api_host: "http://localhost:8080",
        http_proxy: "http://proxy.example.com:8080",
        gopeed_api_token: "gopeed_token_456",
      };

      const result = settingsSchema(validSettings);

      // Should not be an error
      expect(result).not.toBeInstanceOf(type.errors);

      // Type guard to ensure result is Settings
      if (result instanceof type.errors) {
        throw new Error("Expected settings to be valid");
      }

      // Should have all required fields
      expect(result).toHaveProperty("basePath", "/path/to/models");
      expect(result).toHaveProperty("civitai_api_token", "test_token_123");
      expect(result).toHaveProperty("gopeed_api_host", "http://localhost:8080");
      expect(result).toHaveProperty(
        "http_proxy",
        "http://proxy.example.com:8080",
      );
      expect(result).toHaveProperty("gopeed_api_token", "gopeed_token_456");
    });

    test("should validate settings without optional fields", () => {
      const minimalSettings: Settings = {
        basePath: "/path/to/models",
        civitai_api_token: "test_token_123",
        gopeed_api_host: "http://localhost:8080",
      };

      const result = settingsSchema(minimalSettings);

      expect(result).not.toBeInstanceOf(type.errors);

      // Type guard to ensure result is Settings
      if (result instanceof type.errors) {
        throw new Error("Expected settings to be valid");
      }

      expect(result).toHaveProperty("basePath", "/path/to/models");
      expect(result).toHaveProperty("civitai_api_token", "test_token_123");
      expect(result).toHaveProperty("gopeed_api_host", "http://localhost:8080");
      expect(result.http_proxy).toBeUndefined();
      expect(result.gopeed_api_token).toBeUndefined();
    });

    test("should reject settings missing required fields", () => {
      const invalidSettings = {
        basePath: "/path/to/models",
        // Missing civitai_api_token and gopeed_api_host
      };

      const result = settingsSchema(invalidSettings);

      expect(result).toBeInstanceOf(type.errors);
      if (result instanceof type.errors) {
        expect(result.summary).toContain("civitai_api_token");
        expect(result.summary).toContain("gopeed_api_host");
      }
    });

    test("should reject invalid field types", () => {
      const invalidSettings = {
        basePath: 123, // Should be string
        civitai_api_token: "test_token",
        gopeed_api_host: "http://localhost:8080",
      };

      const result = settingsSchema(invalidSettings);

      expect(result).toBeInstanceOf(type.errors);
      if (result instanceof type.errors) {
        expect(result.summary).toContain("must be a string");
      }
    });
  });

  describe("SettingsService", () => {
    test("should initialize with empty store", () => {
      // This should throw because required fields are missing
      expect(() => settingsService.getSettings()).toThrow(
        "Settings not configured",
      );
    });

    test("should return null for unconfigured settings", () => {
      expect(settingsService.getSettingsOrNull()).toBeNull();
    });

    test("should check if settings are configured", () => {
      expect(settingsService.hasSettings()).toBe(false);

      // Set valid settings
      const validSettings: Settings = {
        basePath: "/valid/path",
        civitai_api_token: "valid_token",
        gopeed_api_host: "http://localhost:8080",
      };

      settingsService.updateSettings(validSettings);

      expect(settingsService.hasSettings()).toBe(true);
      expect(settingsService.getSettingsOrNull()).not.toBeNull();
    });

    test("should update and retrieve settings", () => {
      const initialSettings: Partial<Settings> = {
        basePath: "/initial/path",
        civitai_api_token: "initial_token",
        gopeed_api_host: "http://localhost:8080",
      };

      // Update settings
      const updated = settingsService.updateSettings(initialSettings);

      expect(updated).toHaveProperty("basePath", "/initial/path");
      expect(updated).toHaveProperty("civitai_api_token", "initial_token");
      expect(updated).toHaveProperty(
        "gopeed_api_host",
        "http://localhost:8080",
      );

      // Retrieve settings
      const retrieved = settingsService.getSettings();
      expect(retrieved).toEqual(updated);
    });

    test("should update partial settings", () => {
      // First set complete settings
      const completeSettings: Settings = {
        basePath: "/complete/path",
        civitai_api_token: "complete_token",
        gopeed_api_host: "http://localhost:8080",
        http_proxy: "http://proxy.example.com:8080",
      };

      settingsService.updateSettings(completeSettings);

      // Update only one field
      const partialUpdate = {
        basePath: "/updated/path",
      };

      const updated = settingsService.updateSettings(partialUpdate);

      expect(updated.basePath).toBe("/updated/path");
      expect(updated.civitai_api_token).toBe("complete_token"); // Should remain unchanged
      expect(updated.http_proxy).toBe("http://proxy.example.com:8080"); // Should remain unchanged
    });

    test("should validate settings before saving", () => {
      // Use type assertion to test runtime validation
      const invalidUpdate = {
        basePath: 123, // Invalid type
      } as any; // Use any to bypass TypeScript type checking

      expect(() => settingsService.updateSettings(invalidUpdate)).toThrow();

      // Settings should still be invalid (or throw)
      expect(() => settingsService.getSettings()).toThrow();
    });

    test("should reset to empty settings", () => {
      // First set some settings
      const initialSettings: Settings = {
        basePath: "/some/path",
        civitai_api_token: "some_token",
        gopeed_api_host: "http://localhost:8080",
      };

      settingsService.updateSettings(initialSettings);

      // Reset
      settingsService.resetSettings();

      // After reset, getSettings should throw because required fields are missing
      expect(() => settingsService.getSettings()).toThrow();
    });

    test("should validate external data", () => {
      const externalData = {
        basePath: "/external/path",
        civitai_api_token: "external_token",
        gopeed_api_host: "http://localhost:9090",
        extraField: "should be rejected", // Extra fields should be rejected
      };

      // This should throw because extraField is not allowed
      expect(() => settingsService.validateSettings(externalData)).toThrow();
    });

    test("should check validity", () => {
      // Initially should be invalid
      expect(settingsService.isValid()).toBe(false);

      // Set valid settings
      const validSettings: Settings = {
        basePath: "/valid/path",
        civitai_api_token: "valid_token",
        gopeed_api_host: "http://localhost:8080",
      };

      settingsService.updateSettings(validSettings);

      // Now should be valid
      expect(settingsService.isValid()).toBe(true);
    });

    test("should get config path", () => {
      const configPath = settingsService.getConfigPath();
      expect(typeof configPath).toBe("string");
      expect(configPath).toContain("civitai-browser");
    });
  });

  describe("TypeScript Type Safety", () => {
    test("should infer correct TypeScript types", () => {
      // This test is mostly for TypeScript compilation
      // If it compiles, the types are working
      const settings: Settings = {
        basePath: "/typed/path",
        civitai_api_token: "typed_token",
        gopeed_api_host: "http://localhost:8080",
      };

      // Optional fields should be optional
      const settingsWithOptional: Settings = {
        basePath: "/typed/path",
        civitai_api_token: "typed_token",
        gopeed_api_host: "http://localhost:8080",
        http_proxy: "http://proxy.example.com:8080",
      };

      // This should compile without errors
      expect(settings).toBeDefined();
      expect(settingsWithOptional).toBeDefined();
    });
  });
});
