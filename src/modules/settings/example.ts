import type { Settings } from "./model";
import { settingsService } from "./service";
/**
 * Example usage of the settings module
 * Demonstrates how to use the type-safe settings management
 */
function demonstrateSettingsUsage() {
  console.log("=== Settings Module Example ===\n");

  // 1. Check if settings are valid (initially they're not)
  console.log("1. Initial state:");
  console.log(`   Settings valid? ${settingsService.isValid()}`);
  console.log(`   Config path: ${settingsService.getConfigPath()}\n`);

  // 2. Try to get settings (should throw)
  console.log("2. Trying to get settings (should throw):");
  try {
    settingsService.getSettings();
    console.log("   ERROR: Should have thrown!");
  } catch (error) {
    console.log(`   ✓ Correctly threw: ${(error as Error).message}\n`);
  }

  // 3. Set valid settings
  console.log("3. Setting valid settings:");
  const validSettings: Partial<Settings> = {
    basePath: "/Users/me/models",
    civitai_api_token: "my_civitai_token_123",
    gopeed_api_host: "http://localhost:8080",
    http_proxy: "http://proxy.example.com:8080",
  };

  const savedSettings = settingsService.updateSettings(validSettings);
  console.log("   ✓ Settings saved successfully");
  console.log(`   - Models folder: ${savedSettings.basePath}`);
  console.log(
    `   - CivitAI token: ${savedSettings.civitai_api_token.substring(0, 10)}...`,
  );
  console.log(`   - Gopeed host: ${savedSettings.gopeed_api_host}`);
  console.log(`   - HTTP proxy: ${savedSettings.http_proxy}\n`);

  // 4. Get settings back
  console.log("4. Retrieving settings:");
  const retrievedSettings = settingsService.getSettings();
  console.log("   ✓ Settings retrieved successfully");
  console.log(`   Settings valid? ${settingsService.isValid()}\n`);

  // 5. Update partial settings
  console.log("5. Updating partial settings:");
  const partialUpdate = {
    basePath: "/Users/me/new_models_folder",
    gopeed_api_token: "my_gopeed_token_456",
  };

  const updatedSettings = settingsService.updateSettings(partialUpdate);
  console.log("   ✓ Partial update successful");
  console.log(`   - New models folder: ${updatedSettings.basePath}`);
  console.log(`   - Gopeed token: ${updatedSettings.gopeed_api_token}`);
  console.log(
    `   - CivitAI token (unchanged): ${updatedSettings.civitai_api_token.substring(0, 10)}...\n`,
  );

  // 6. Validate external data
  console.log("6. Validating external data:");
  const externalData = {
    basePath: "/external/path",
    civitai_api_token: "external_token",
    gopeed_api_host: "http://localhost:9090",
    extraField: "should be rejected",
  };

  try {
    settingsService.validateSettings(externalData);
    console.log("   ERROR: Should have thrown for extra field!");
  } catch (error) {
    console.log(
      `   ✓ Correctly rejected extra field: ${(error as Error).message}\n`,
    );
  }

  // 7. Reset settings
  console.log("7. Resetting settings:");
  settingsService.resetSettings();
  console.log(`   ✓ Settings reset`);
  console.log(`   Settings valid? ${settingsService.isValid()}\n`);

  console.log("=== Example Complete ===");
}

// Run the example if this file is executed directly
if (require.main === module) {
  demonstrateSettingsUsage();
}

export { demonstrateSettingsUsage };
