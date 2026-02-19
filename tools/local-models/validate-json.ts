#!/usr/bin/env bun
import { settingsService } from "../../src/modules/settings/service";
import { extractModelInfo } from "../../src/modules/db/crud/modelVersion";

async function checkJsonFiles() {
  console.log("=== Checking JSON Files ===");

  const settings = settingsService.getSettings();
  const basePath = settings.basePath;
  console.log(`Base Path: ${basePath}\n`);

  // 示例测试文件路径 - 根据实际环境需要修改
  // 这些是硬编码的示例路径，实际使用时应该根据文件系统扫描结果动态获取
  const testFiles = [
    "C:/Users/GF/freespace/AI/civitai_models/LORA/2398126/2696373/files/zibai_genshin_impact_ilxl_goofy.safetensors",
    "C:/Users/GF/freespace/AI/civitai_models/Checkpoint/934764/2483605/files/miaomiaoHarem_v19.safetensors",
    "C:/Users/GF/freespace/AI/civitai_models/LORA/2392829/2690497/files/lyme-ct_cosplay_ilxl_goofy.safetensors",
  ];

  console.log("注意：使用硬编码的示例文件路径进行测试。");
  console.log("在实际使用中，应该通过扫描文件系统动态获取文件路径。\n");

  for (const filePath of testFiles) {
    const modelInfo = extractModelInfo(filePath);
    if (!modelInfo) {
      console.log(`❌ No model info for: ${filePath}`);
      continue;
    }

    console.log(
      `\n=== Checking: ${modelInfo.modelType}/${modelInfo.modelId}/${modelInfo.versionId} ===`,
    );

    const { getModelIdApiInfoJsonPath, getModelVersionApiInfoJsonPath } =
      await import("../../src/modules/local-models/service/file-layout");

    const modelJsonPath = getModelIdApiInfoJsonPath(
      basePath,
      modelInfo.modelType,
      modelInfo.modelId,
    );
    const versionJsonPath = getModelVersionApiInfoJsonPath(
      basePath,
      modelInfo.modelType,
      modelInfo.modelId,
      modelInfo.versionId,
    );

    console.log(`Model JSON: ${modelJsonPath}`);
    console.log(`Version JSON: ${versionJsonPath}`);

    // 检查文件是否存在
    const modelJsonExists = await Bun.file(modelJsonPath).exists();
    const versionJsonExists = await Bun.file(versionJsonPath).exists();

    console.log(`Model JSON exists: ${modelJsonExists}`);
    console.log(`Version JSON exists: ${versionJsonExists}`);

    if (versionJsonExists) {
      try {
        const versionContent = await Bun.file(versionJsonPath).json();
        console.log(`\nVersion JSON structure:`);
        console.log(
          `- availability: ${versionContent.availability} (type: ${typeof versionContent.availability})`,
        );

        if (versionContent.images && Array.isArray(versionContent.images)) {
          console.log(`- images count: ${versionContent.images.length}`);
          if (versionContent.images.length > 0) {
            const firstImage = versionContent.images[0];
            console.log(`  First image:`);
            console.log(
              `    id: ${firstImage.id} (type: ${typeof firstImage.id})`,
            );
            console.log(`    url: ${firstImage.url}`);
            console.log(`    nsfwLevel: ${firstImage.nsfwLevel}`);
          }
        }

        console.log(
          `- index: ${versionContent.index} (type: ${typeof versionContent.index})`,
        );

        if (versionContent.stats) {
          console.log(`- stats:`);
          console.log(
            `  thumbsDownCount: ${versionContent.stats.thumbsDownCount} (type: ${typeof versionContent.stats.thumbsDownCount})`,
          );
          console.log(`  thumbsUpCount: ${versionContent.stats.thumbsUpCount}`);
          console.log(`  downloadCount: ${versionContent.stats.downloadCount}`);
        }

        // 打印完整的JSON结构以便调试
        console.log(
          `\nFull version JSON keys: ${Object.keys(versionContent).join(", ")}`,
        );
      } catch (error) {
        console.error(`Error reading JSON: ${error}`);
      }
    }

    if (modelJsonExists) {
      try {
        const modelContent = await Bun.file(modelJsonPath).json();
        console.log(`\nModel JSON structure:`);
        console.log(`- type: ${modelContent.type}`);
        console.log(`- name: ${modelContent.name}`);
        console.log(`- id: ${modelContent.id}`);
        console.log(`- nsfw: ${modelContent.nsfw}`);
        console.log(
          `Full model JSON keys: ${Object.keys(modelContent).join(", ")}`,
        );
      } catch (error) {
        console.error(`Error reading model JSON: ${error}`);
      }
    }

    console.log("\n" + "=".repeat(50));
  }
}

checkJsonFiles().catch(console.error);
