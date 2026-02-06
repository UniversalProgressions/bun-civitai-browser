import Conf from "conf";
import { type } from "arktype";
import { settingsSchema, type Settings } from "./model";

/**
 * Settings service for managing application configuration
 * Combines Conf for persistence and ArkType for type-safe validation
 */
export class SettingsService {
  private conf: Conf<Settings>;

  constructor() {
    // Initialize Conf with JSON schema generated from ArkType
    // Note: We don't pass defaults for required fields since they must be provided by user
    this.conf = new Conf({
      // Use default storage location (user's config directory)
      // @ts-ignore - electron-store types are outdated
      configName: "civitai-browser",
      projectName: "civitai-browser",
    });
  }

  /**
   * Get current settings with lazy validation
   * @returns Validated settings object
   * @throws Error if settings validation fails
   */
  getSettings(): Settings {
    const rawData = this.conf.store;

    // If store is empty, throw a specific error
    if (Object.keys(rawData).length === 0) {
      throw new Error("Settings not configured");
    }

    // Validate data using ArkType
    const result = settingsSchema(rawData);

    if (result instanceof type.errors) {
      // Validation failed, throw clear error message
      throw new Error(`Settings validation failed: ${result.summary}`);
    }

    return result;
  }

  /**
   * Get settings or null if not configured
   * @returns Settings object or null if not configured/invalid
   */
  getSettingsOrNull(): Settings | null {
    try {
      return this.getSettings();
    } catch {
      return null;
    }
  }

  /**
   * Check if settings are configured and valid
   * @returns true if settings are configured and valid, false otherwise
   */
  hasSettings(): boolean {
    return this.getSettingsOrNull() !== null;
  }

  /**
   * Update partial settings
   * @param partial Partial settings to update
   * @returns Updated and validated settings
   * @throws Error if updated settings validation fails
   */
  updateSettings(partial: Partial<Settings>): Settings {
    const current = this.conf.store;
    const updated = { ...current, ...partial };

    // Validate the updated data
    const result = settingsSchema(updated);

    if (result instanceof type.errors) {
      throw new Error(`Settings update validation failed: ${result.summary}`);
    }

    // Save to Conf
    this.conf.set(updated);

    return result;
  }

  /**
   * Reset settings to empty state
   * @returns Empty settings object (will fail validation)
   */
  resetSettings(): void {
    this.conf.clear();
  }

  /**
   * Validate settings data without saving
   * @param data Settings data to validate
   * @returns Validated settings
   * @throws Error if validation fails
   */
  validateSettings(data: unknown): Settings {
    const result = settingsSchema(data);

    if (result instanceof type.errors) {
      throw new Error(`Settings validation failed: ${result.summary}`);
    }

    return result;
  }

  /**
   * Get the path to the configuration file (for debugging purposes)
   * @returns Path to the configuration file
   */
  getConfigPath(): string {
    return this.conf.path;
  }

  /**
   * Check if settings are valid without throwing
   * @returns true if settings are valid, false otherwise
   */
  isValid(): boolean {
    try {
      this.getSettings();
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance for application-wide use
export const settingsService = new SettingsService();

// Compatibility export for existing code
export const getSettings = () => settingsService.getSettings();
