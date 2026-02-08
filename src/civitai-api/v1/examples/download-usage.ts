/**
 * Download URL resolution example
 *
 * This example demonstrates how to use the Civitai API client
 * to resolve model file download URLs to get actual CDN URLs.
 */

import { createCivitaiClient } from "../client/index";
import { EXAMPLE_MODEL_ID, EXAMPLE_VERSION_ID } from "./shared-ids";

/**
 * Main function to demonstrate download URL resolution
 */
async function main() {
  console.log("=== Civitai API Download URL Resolution Example ===\n");

  // Create client with API key (if available)
  const apiKey = process.env.CIVITAI_API_KEY;
  const client = createCivitaiClient({
    apiKey,
    timeout: 30000,
    validateResponses: false,
  });

  console.log(`Using model ID: ${EXAMPLE_MODEL_ID}`);
  console.log(`Using version ID: ${EXAMPLE_VERSION_ID}`);
  console.log(`API Key configured: ${!!apiKey}\n`);

  try {
    // Step 1: Get model version details
    console.log("1. Getting model version details...");
    const versionResult =
      await client.modelVersions.getById(EXAMPLE_VERSION_ID);

    if (versionResult.isErr()) {
      console.error(
        "Failed to get model version:",
        versionResult.error.message,
      );
      return;
    }

    const modelVersion = versionResult.value;
    console.log(`   Model version: ${modelVersion.name}`);
    console.log(`   Base model: ${modelVersion.baseModel}`);
    console.log(`   Files count: ${modelVersion.files.length}\n`);

    // Step 2: Resolve download URLs for each file
    console.log("2. Resolving download URLs...");

    for (let i = 0; i < modelVersion.files.length; i++) {
      const file = modelVersion.files[i];
      console.log(`   File ${i + 1}: ${file.name} (${file.type})`);
      console.log(`     Original URL: ${file.downloadUrl}`);

      const resolveResult = await client.modelVersions.resolveFileDownloadUrl(
        file.downloadUrl,
      );

      if (resolveResult.isErr()) {
        console.log(
          `     ❌ Failed to resolve: ${resolveResult.error.message}`,
        );
      } else {
        console.log(`     ✅ Resolved URL: ${resolveResult.value}`);
      }
      console.log();
    }

    console.log("3. Summary:");
    console.log(`   Total files processed: ${modelVersion.files.length}`);
    console.log(`   Model: ${modelVersion.name}`);
    console.log(`   Model ID: ${modelVersion.modelId}`);
    console.log(`   Version ID: ${modelVersion.id}`);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

/**
 * Alternative example: Resolve single download URL
 */
export async function resolveSingleDownloadUrl(
  downloadUrl: string,
  token?: string,
) {
  const client = createCivitaiClient({
    apiKey: token || process.env.CIVITAI_API_KEY,
    timeout: 30000,
  });

  const result = await client.modelVersions.resolveFileDownloadUrl(
    downloadUrl,
    token,
  );

  if (result.isErr()) {
    throw new Error(`Failed to resolve download URL: ${result.error.message}`);
  }

  return result.value;
}

/**
 * Example with error handling
 */
export async function demonstrateErrorHandling() {
  const client = createCivitaiClient({
    // No API key - should fail
    timeout: 5000,
  });

  const fakeDownloadUrl =
    "https://civitai.com/api/download/models/12345?type=Model&format=SafeTensor";

  console.log("Testing error handling without API key...");
  const result =
    await client.modelVersions.resolveFileDownloadUrl(fakeDownloadUrl);

  if (result.isErr()) {
    console.log(
      `Expected error: ${result.error.type} - ${result.error.message}`,
    );
    return result.error;
  }

  return result.value;
}

// Run the example if this file is executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export default main;
