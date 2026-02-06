import { createCivitaiClient } from '../src/v1/index';
import type {
  ModelVersionCore,
  ModelVersionAny,
  ModelCore,
  ModelAny,
} from '../src/v1/models/model-version-abstract';
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
} from '../src/v1/models/model-version-abstract';
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
  EXAMPLE_MODEL_ID_2,
  EXAMPLE_VERSION_ID_2,
  LEGACY_EXAMPLE_MODEL_ID,
  LEGACY_EXAMPLE_VERSION_ID,
  MODEL_VERSION_ENDPOINT_EXAMPLE_ID,
} from './shared-ids';

async function unifiedTypesDemo() {
  console.log('=== Unified Types System Demo ===\n');

  // Create client
  const client = createCivitaiClient({
    timeout: 60000,
  });

  console.log('1. Fetching data from different endpoints...\n');

  // Fetch data from different endpoints
  const [modelsResult, modelByIdResult, modelVersionResult] = await Promise.all([
    client.models.list({ limit: 1 }),
    client.models.getById(EXAMPLE_MODEL_ID), // Example model ID
    client.modelVersions.getById(MODEL_VERSION_ENDPOINT_EXAMPLE_ID), // Example version ID
  ]);

  if (modelsResult.isErr() || modelByIdResult.isErr() || modelVersionResult.isErr()) {
    console.error('Failed to fetch data from one or more endpoints');
    return;
  }

  // Get ModelVersion data from different endpoints
  // Use non-null assertion since we know the data exists
  const modelsVersion = modelsResult.value.items[0]!.modelVersions[0]!;
  const modelByIdVersion = modelByIdResult.value.modelVersions[0]!;
  const modelVersionEndpoint = modelVersionResult.value;

  console.log('2. Demonstrating unified type system...\n');

  // Create an array with ModelVersion from all endpoints
  const versions: ModelVersionAny[] = [
    modelsVersion,
    modelByIdVersion,
    modelVersionEndpoint,
  ];

  console.log(`Array contains ${versions.length} ModelVersion objects from different endpoints\n`);

  // Process each version using unified type system
  versions.forEach((version, index) => {
    console.log(`--- Processing version ${index + 1} ---`);

    // Extract core fields (safe for all endpoints)
    const core: ModelVersionCore = toModelVersionCore(version);
    console.log(`Core fields: ${core.name} (ID: ${core.id}, Base Model: ${core.baseModel})`);
    console.log(`Files: ${core.files.length}, Images: ${core.images.length}`);

    // Safely access endpoint-specific fields
    const modelId = getModelId(version);
    const indexValue = getIndex(version);
    const availability = getAvailability(version);
    const publishedAt = getPublishedAt(version);

    console.log(`Endpoint-specific fields:`);
    console.log(`  Model ID: ${modelId ?? 'undefined (not available from this endpoint)'}`);
    console.log(`  Index: ${indexValue ?? 'undefined (not available from this endpoint)'}`);
    console.log(`  Availability: ${availability ?? 'undefined (not available from this endpoint)'}`);
    console.log(`  Published At: ${publishedAt ?? 'undefined'}`);

    // Use type guards for conditional logic
    if (isModelsVersion(version)) {
      console.log(`  Type: Models endpoint version`);
      console.log(`  Can access directly: index=${version.index}, availability=${version.availability}`);
    } else if (isModelByIdVersion(version)) {
      console.log(`  Type: Model-by-ID endpoint version`);
      console.log(`  Can access directly: index=${version.index}, availability=${version.availability}`);
    } else if (isModelVersionEndpoint(version)) {
      console.log(`  Type: Model-version endpoint version`);
      console.log(`  Can access directly: modelId=${version.modelId}`);
    }

    console.log('');
  });

  console.log('3. Using findModelVersion utility...\n');

  // Find a specific version by ID
  const targetId = modelVersionEndpoint.id;
  const foundVersion = findModelVersion(versions, targetId);

  if (foundVersion) {
    console.log(`Found version ${targetId} in array`);
    const core = toModelVersionCore(foundVersion);
    console.log(`Name: ${core.name}, Base Model: ${core.baseModel}`);
  } else {
    console.log(`Version ${targetId} not found in array`);
  }

  console.log('\n4. Practical use case: Processing mixed data...\n');

  // Simulate processing data from multiple sources
  function processMixedVersions(versions: ModelVersionAny[]) {
    console.log(`Processing ${versions.length} versions from mixed sources:`);

    const stats = {
      total: versions.length,
      fromModelsEndpoint: 0,
      fromModelByIdEndpoint: 0,
      fromModelVersionEndpoint: 0,
      totalFiles: 0,
      totalImages: 0,
    };

    versions.forEach(version => {
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

    console.log(`  Sources: Models=${stats.fromModelsEndpoint}, ModelById=${stats.fromModelByIdEndpoint}, ModelVersion=${stats.fromModelVersionEndpoint}`);
    console.log(`  Total files: ${stats.totalFiles}, Total images: ${stats.totalImages}`);
  }

  processMixedVersions(versions);

  console.log('\n5. Benefits of unified type system:\n');
  console.log('- ✅ Handle data from any endpoint with single interface');
  console.log('- ✅ Type-safe access to core fields');
  console.log('- ✅ Safe access to endpoint-specific fields');
  console.log('- ✅ Easy migration from endpoint-specific types');
  console.log('- ✅ Flexible processing of mixed data sources');

  console.log('\n6. Demonstrating unified Model type system...\n');

  // Fetch Model data from different endpoints
  console.log('Fetching Model data from different endpoints...\n');
  
  const [modelsListResult2, modelByIdResult2] = await Promise.all([
    client.models.list({ limit: 1 }),
    client.models.getById(EXAMPLE_MODEL_ID), // Example model ID
  ]);

  if (modelsListResult2.isErr() || modelByIdResult2.isErr()) {
    console.error('Failed to fetch Model data from one or more endpoints');
    return;
  }

  // Get Model data from different endpoints
  const modelsEndpointModel = modelsListResult2.value.items[0]!;
  const modelByIdEndpointModel = modelByIdResult2.value;

  // Create an array with Model from all endpoints
  const models: ModelAny[] = [
    modelsEndpointModel,
    modelByIdEndpointModel,
  ];

  console.log(`Array contains ${models.length} Model objects from different endpoints\n`);

  // Process each Model using unified type system
  models.forEach((model, index) => {
    console.log(`--- Processing Model ${index + 1} ---`);

    // Extract core fields (safe for all endpoints)
    const core: ModelCore = toModelCore(model);
    console.log(`Core fields: ${core.name} (ID: ${core.id}, Type: ${core.type})`);
    console.log(`Description: ${core.description?.substring(0, 50) || 'No description'}...`);
    console.log(`Versions: ${core.modelVersions.length}, Tags: ${core.tags.length}`);
    console.log(`Creator: ${core.creator?.username || 'Unknown'}`);
    console.log(`Stats: ${core.stats.downloadCount} downloads`);

    // Use type guards for conditional logic
    if (isModelsEndpointModel(model)) {
      console.log(`  Type: Models endpoint model`);
      console.log(`  Can access modelVersions array with ModelsVersion types`);
    } else if (isModelByIdEndpointModel(model)) {
      console.log(`  Type: Model-by-ID endpoint model`);
      console.log(`  Can access modelVersions array with ModelByIdVersion types`);
    }

    console.log('');
  });

  console.log('7. Using findModel utility...\n');

  // Find a specific model by ID
  const targetModelId = EXAMPLE_MODEL_ID;
  const foundModel = findModel(models, targetModelId);

  if (foundModel) {
    console.log(`Found model ${targetModelId} in array`);
    const core = toModelCore(foundModel);
    console.log(`Name: ${core.name}, Type: ${core.type}`);
    console.log(`Versions: ${core.modelVersions.length}`);
  } else {
    console.log(`Model ${targetModelId} not found in array`);
  }

  console.log('\n8. Practical use case: Processing mixed Model data...\n');

  // Simulate processing data from multiple sources
  function processMixedModels(models: ModelAny[]) {
    console.log(`Processing ${models.length} models from mixed sources:`);

    const stats = {
      total: models.length,
      fromModelsEndpoint: 0,
      fromModelByIdEndpoint: 0,
      totalVersions: 0,
      totalTags: 0,
      totalDownloads: 0,
    };

    models.forEach(model => {
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

    console.log(`  Sources: Models=${stats.fromModelsEndpoint}, ModelById=${stats.fromModelByIdEndpoint}`);
    console.log(`  Total versions: ${stats.totalVersions}`);
    console.log(`  Total tags: ${stats.totalTags}`);
    console.log(`  Total downloads: ${stats.totalDownloads}`);
  }

  processMixedModels(models);

  console.log('\n9. Benefits of unified Model type system:\n');
  console.log('- ✅ Handle Model data from any endpoint with single interface');
  console.log('- ✅ Type-safe access to Model core fields');
  console.log('- ✅ Process mixed Model sources seamlessly');
  console.log('- ✅ Easy to find and filter Models');
  console.log('- ✅ Consistent API for all Model endpoints');

  console.log('\n10. Complete unified type system benefits:\n');
  console.log('For ModelVersion:');
  console.log('  - Single interface for /models, /models/{id}, /model-versions/{id}');
  console.log('  - Safe access to core fields (name, baseModel, files, images)');
  console.log('  - Utility functions for endpoint-specific fields');
  
  console.log('\nFor Model:');
  console.log('  - Single interface for /models and /models/{id}');
  console.log('  - Safe access to core fields (name, type, versions, tags)');
  console.log('  - Type guards for endpoint identification');
  
  console.log('\nOverall:');
  console.log('  - Simplified codebase');
  console.log('  - Better type safety');
  console.log('  - Easier maintenance');
  console.log('  - Gradual migration path');

  console.log('\n=== Demo Complete ===');
}

// Run the demo
unifiedTypesDemo().catch(console.error);
