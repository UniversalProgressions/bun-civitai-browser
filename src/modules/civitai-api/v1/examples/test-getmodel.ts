import { createCivitaiClient } from '../src/v1/index';
import { LEGACY_EXAMPLE_MODEL_ID } from './shared-ids';

async function testGetModel() {
  console.log('=== Testing new getModel() method ===\n');

  // Create client
  const client = createCivitaiClient({
    apiKey: process.env.CIVITAI_API_KEY,
    timeout: 30000,
    validateResponses: false,
  });

  // Test model ID (using a known model ID from the examples)
  const modelId = LEGACY_EXAMPLE_MODEL_ID; // Using shared example model ID

  console.log(`1. Testing getById() method (original method)...`);
  const getByIdResult = await client.models.getById(modelId);
  
  if (getByIdResult.isOk()) {
    const modelById = getByIdResult.value;
    console.log(`   Success! Model name: ${modelById.name}`);
    console.log(`   Type: ${modelById.type}`);
    console.log(`   Model versions count: ${modelById.modelVersions.length}`);
    console.log(`   Return type: ModelById`);
  } else {
    console.log(`   Failed: ${getByIdResult.error.message}`);
  }

  console.log(`\n2. Testing new getModel() method...`);
  const getModelResult = await client.models.getModel(modelId);
  
  if (getModelResult.isOk()) {
    const model = getModelResult.value;
    console.log(`   Success! Model name: ${model.name}`);
    console.log(`   Type: ${model.type}`);
    console.log(`   Model versions count: ${model.modelVersions.length}`);
    console.log(`   Return type: Model`);
    
    // Check if the conversion worked correctly
    console.log(`\n3. Comparing the two results...`);
    console.log(`   Both methods returned successfully`);
    console.log(`   getModel() returns the converted Model type`);
    
    // Show some differences in the data structure
    if (getByIdResult.isOk()) {
      const modelById = getByIdResult.value;
      console.log(`\n4. Data structure comparison:`);
      console.log(`   ModelById has optional 'creator?' field: ${'creator' in modelById}`);
      console.log(`   Model has optional 'creator?' field: ${'creator' in model}`);
      console.log(`   ModelById modelVersions[0].publishedAt type: ${typeof modelById.modelVersions[0]?.publishedAt}`);
      console.log(`   Model modelVersions[0].publishedAt type: ${typeof model.modelVersions[0]?.publishedAt}`);
    }
  } else {
    console.log(`   Failed: ${getModelResult.error.message}`);
    console.log(`   Error type: ${getModelResult.error.type}`);
  }

  console.log('\n=== Test completed ===');
}

// Run test
testGetModel().catch(console.error);