#!/usr/bin/env bun
import { settingsService } from "../../src/modules/settings/service";
import { extractModelInfo } from "../../src/modules/db/crud/modelVersion";
import fg from "fast-glob";

async function debugScan() {
  console.log("=== Debugging File Paths ===");

  const settings = settingsService.getSettings();
  const basePath = settings.basePath;
  console.log(`Base Path: ${basePath}`);

  // Supported extensions
  const supportedExtensions = [
    ".safetensors",
    ".ckpt",
    ".pt",
    ".pth",
    ".bin",
    ".onnx",
    ".gguf",
  ];
  const extensionsPattern = `{${supportedExtensions.map((ext) => ext.slice(1)).join(",")}}`;

  const pattern = `${fg.convertPathToPattern(basePath)}/**/*.${extensionsPattern}`;
  console.log(`Pattern: ${pattern}`);

  const files = await fg(pattern, { onlyFiles: true, absolute: true });
  console.log(`\nFound ${files.length} files:`);

  for (let i = 0; i < Math.min(10, files.length); i++) {
    const file = files[i];
    console.log(`\n${i + 1}. ${file}`);

    const parts = file.split(/[/\\]/);
    console.log(`   Parts (${parts.length}): ${parts.join(" > ")}`);

    const info = extractModelInfo(file);
    if (info) {
      console.log(
        `   ✓ Matched: modelType="${info.modelType}", modelId=${info.modelId}, versionId=${info.versionId}`,
      );
      console.log(
        `     fileName="${info.fileName}", extension="${info.fileExtension}"`,
      );
    } else {
      console.log(`   ✗ No match - extractModelInfo returned null`);

      // Debug why it doesn't match
      if (parts.length < 4) {
        console.log(
          `   Reason: Need at least 4 path parts, got ${parts.length}`,
        );
      } else {
        const fileName = parts[parts.length - 1];
        const fileExtension = fileName
          .toLowerCase()
          .slice(fileName.lastIndexOf("."));
        if (!supportedExtensions.includes(fileExtension)) {
          console.log(
            `   Reason: Extension "${fileExtension}" not in supported list`,
          );
        } else {
          const modelType = parts[parts.length - 4];
          const modelId = Number(parts[parts.length - 3]);
          const versionId = Number(parts[parts.length - 2]);
          console.log(
            `   Debug: modelType="${modelType}", modelId=${modelId}, versionId=${versionId}`,
          );
          if (Number.isNaN(modelId))
            console.log(`   Reason: modelId is not a number`);
          if (Number.isNaN(versionId))
            console.log(`   Reason: versionId is not a number`);
        }
      }
    }
  }

  if (files.length > 10) {
    console.log(`\n... and ${files.length - 10} more files`);
  }
}

debugScan().catch(console.error);
