import { createCivitaiClient } from '../src/v1/index';
import {
  toModelCore,
  isModelsEndpointModel,
  isModelByIdEndpointModel,
  findModel,
} from '../src/v1/models/model-version-abstract';
import {
  EXAMPLE_MODEL_ID,
  EXAMPLE_VERSION_ID,
  LEGACY_EXAMPLE_MODEL_ID,
} from './shared-ids';

async function main() {
  console.log('=== Civitai API Client Usage Example ===\n');

  // 1. Create client
  console.log('1. Creating client...');
  const client = createCivitaiClient({
    apiKey: process.env.CIVITAI_API_KEY, // Read API key from environment variable
    timeout: 30000, // Reduced to 30 seconds timeout to avoid long waits
    validateResponses: false, // Do not validate responses (recommended to enable in production)
  });

  console.log('Client configuration:', client.getConfig());
  console.log('');

  // 2. Get creators list
  console.log('2. Getting creators list...');
  console.log('Note: Civitai API creators endpoint may be unstable, sometimes returning 500 errors');
  console.log('This is an API server issue, not a client issue\n');
  
  try {
    const creatorsResult = await client.creators.list({
      limit: 3,
      page: 1,
    });

    if (creatorsResult.isOk()) {
      const creators = creatorsResult.value;
      console.log(`Found ${creators.metadata.totalItems} creators`);
      console.log(`Current page: ${creators.metadata.currentPage}/${creators.metadata.totalPages}`);
      console.log(`Page size: ${creators.metadata.pageSize}`);
      console.log('Top 3 creators:');
      creators.items.slice(0, 3).forEach((creator, index) => {
        console.log(`  ${index + 1}. ${creator.username} (${creator.modelCount} models)`);
      });
    } else {
      console.log('Failed to get creators list (this may be an API server issue):');
      const error = creatorsResult.error;
      console.log(`Error type: ${error.type}`);
      // Safely access potentially existing status property
      if ('status' in error && error.status !== undefined) {
        console.log(`Status code: ${error.status}`);
      }
      console.log(`Error message: ${error.message}`);
    }
  } catch (error) {
    console.log('Exception occurred when calling creators API:');
    console.log(error);
  }
  console.log('');

  // 3. Get models list
  console.log('3. Getting models list...');
  const modelsResult = await client.models.list({
    limit: 2,
    types: ['Checkpoint'],
    sort: 'Highest Rated',
  });

  if (modelsResult.isOk()) {
    const models = modelsResult.value;
    console.log(`Found ${models.metadata.totalItems} models`);
    console.log(`Current page: ${models.metadata.currentPage}/${models.metadata.totalPages}`);
    console.log('Top 2 models:');
    models.items.slice(0, 2).forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.name} (${model.type})`);
      console.log(`     Creator: ${model.creator?.username || 'Unknown'}`);
      console.log(`     Download count: ${model.stats.downloadCount}`);
      console.log(`     Version count: ${model.modelVersions.length}`);
    });
  } else {
    console.error('Failed to get models list:', modelsResult.error);
  }
  console.log('');

  // 4. Get single model details
  console.log('4. Getting single model details...');
  const modelId = LEGACY_EXAMPLE_MODEL_ID; // Use shared example model ID
  const modelResult = await client.models.getById(modelId);

  if (modelResult.isOk()) {
    const model = modelResult.value;
    console.log(`Model: ${model.name}`);
    console.log(`Description: ${model.description?.substring(0, 100)}...`);
    console.log(`Type: ${model.type}`);
    console.log(`NSFW: ${model.nsfw}`);
    console.log(`Tags: ${model.tags.join(', ')}`);
    console.log(`Version count: ${model.modelVersions.length}`);
  } else {
    console.error(`Failed to get model ${modelId} details:`, modelResult.error);
  }
  console.log('');

  // 5. Get tags list
  console.log('5. Getting tags list...');
  const tagsResult = await client.tags.list({
    limit: 5,
  });

  if (tagsResult.isOk()) {
    const tags = tagsResult.value;
    console.log(`Found ${tags.metadata.totalItems} tags`);
    console.log('Top 5 tags:');
    tags.items.slice(0, 5).forEach((tag, index) => {
      console.log(`  ${index + 1}. ${tag.name} (${tag.modelCount} models)`);
    });
  } else {
    console.error('Failed to get tags list:', tagsResult.error);
  }

  console.log('');

  // 6. Using unified type system
  console.log('6. Using unified type system...');
  
  // Get data from different endpoints
  const [unifiedModelsResult, unifiedModelByIdResult] = await Promise.all([
    client.models.list({ limit: 1 }),
    client.models.getById(LEGACY_EXAMPLE_MODEL_ID), // Use shared example model ID
  ]);

  if (unifiedModelsResult.isOk() && unifiedModelByIdResult.isOk()) {
    const modelFromList = unifiedModelsResult.value.items[0]!;
    const modelById = unifiedModelByIdResult.value;
    
    console.log('Model data from different endpoints:');
    console.log(`  Model from list: ${modelFromList.name} (${modelFromList.type})`);
    console.log(`  Detailed model: ${modelById.name} (${modelById.type})`);
    
    // Use unified type system utility functions
    console.log('\nUsing unified type system utility functions:');
    
    // Create model array
    const models = [modelFromList, modelById];
    
    // Extract core fields
    models.forEach((model, index) => {
      const core = toModelCore(model as any);
      console.log(`  Model ${index + 1}: ${core.name}`);
      console.log(`    Type: ${core.type}, Version count: ${core.modelVersions.length}`);
      console.log(`    Tags: ${core.tags.slice(0, 3).join(', ')}${core.tags.length > 3 ? '...' : ''}`);
    });
    
    // Use type guards
    console.log('\nUsing type guards:');
    models.forEach((model, index) => {
      if (isModelsEndpointModel(model as any)) {
        console.log(`  Model ${index + 1}: from /models endpoint`);
      } else if (isModelByIdEndpointModel(model as any)) {
        console.log(`  Model ${index + 1}: from /models/{id} endpoint`);
      }
    });
    
    // Use find function
    console.log('\nUsing find function:');
    const foundModel = findModel(models as any, LEGACY_EXAMPLE_MODEL_ID);
    if (foundModel) {
      const core = toModelCore(foundModel);
      console.log(`  Found model ID ${LEGACY_EXAMPLE_MODEL_ID}: ${core.name}`);
    }
  } else {
    console.log('Failed to get unified type data');
  }

  console.log('\n=== Example completed ===');
}

// Run example
main().catch(console.error);