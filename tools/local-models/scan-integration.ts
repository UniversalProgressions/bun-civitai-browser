#!/usr/bin/env bun
import { performIncrementalScan } from "../../src/modules/local-models/service/scan-models";
import { settingsService } from "../../src/modules/settings/service";

async function testScan() {
  console.log("=== Testing Local Models Scan ===");

  // Check if settings are configured
  try {
    const settings = settingsService.getSettings();
    console.log(`✓ Settings configured:`);
    console.log(`  Base Path: ${settings.basePath}`);
    console.log(
      `  Civitai API Token: ${settings.civitai_api_token ? "Set" : "Not set"}`,
    );
    console.log(`  Gopeed API Host: ${settings.gopeed_api_host}`);
  } catch (error) {
    console.error(`✗ Settings not configured: ${error}`);
    console.log("\nPlease configure settings first by running:");
    console.log("  bun run src/modules/settings/example.ts");
    return;
  }

  console.log("\n=== Starting Enhanced Scan ===");
  const result = await performIncrementalScan({
    incremental: false, // Full scan
    checkConsistency: true,
    repairDatabase: false,
  });

  if (result.isErr()) {
    console.error("✗ Scan failed:", result.error.message);
    console.error("Error details:", result.error);
  } else {
    const data = result.value;
    console.log("✓ Scan completed successfully!");
    console.log(`\nScan Results:`);
    console.log(`  Total files scanned: ${data.totalFilesScanned}`);
    console.log(`  New records added: ${data.newRecordsAdded}`);
    console.log(`  Existing records found: ${data.existingRecordsFound}`);
    console.log(
      `  Scan duration: ${data.scanDurationMs}ms (${(data.scanDurationMs / 1000).toFixed(2)}s)`,
    );

    if (data.failedFiles.length > 0) {
      console.log(`\n⚠ Failed files (${data.failedFiles.length}):`);
      data.failedFiles.slice(0, 5).forEach((file: string, i: number) => {
        console.log(`  ${i + 1}. ${file}`);
      });
      if (data.failedFiles.length > 5) {
        console.log(`  ... and ${data.failedFiles.length - 5} more`);
      }
    }
  }

  console.log("\n=== Test Complete ===");
}

// Run the test
testScan().catch(console.error);
