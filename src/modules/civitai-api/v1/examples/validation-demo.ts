import { createCivitaiClient } from '../src/v1/index';
import { isValidationError } from '../src/v1/client/errors';

async function validationDemo() {
  console.log('=== Arktype Validation Demo ===\n');

  // Create client with validation enabled
  const client = createCivitaiClient({
    validateResponses: true, // Enable response validation
  });

  console.log('1. Testing validation with invalid data...\n');

  // Simulate an invalid response (this would normally come from the API)
  const invalidModelResponse = {
    items: [
      {
        id: 'not-a-number', // Should be number, but is string
        name: 123, // Should be string, but is number
        description: null,
        type: 'InvalidType', // Not in the allowed types
        poi: 'not-boolean', // Should be boolean
        nsfw: false,
        nsfwLevel: 1,
        stats: {
          downloadCount: '1000', // Should be number
          ratingCount: 50,
          rating: 4.5,
        },
        tags: ['tag1', 'tag2'],
        modelVersions: [
          {
            id: 1,
            index: 0,
            name: 'v1.0',
            baseModel: 'SD 1.5',
            baseModelType: null,
            publishedAt: '2023-01-01T00:00:00.000Z',
            availability: 'Public',
            nsfwLevel: 1,
            description: null,
            trainedWords: ['keyword1', 'keyword2'],
            stats: {
              downloadCount: 100,
              ratingCount: 10,
              rating: 4.5,
            },
            files: [],
            images: [],
          },
        ],
      },
    ],
    metadata: {
      totalItems: 1,
      currentPage: 1,
      pageSize: 20,
      totalPages: 1,
    },
  };

  console.log('Invalid response data structure:');
  console.log(JSON.stringify(invalidModelResponse, null, 2));
  console.log('\n');

  // Try to validate the invalid data
  console.log('2. Arktype validation error details:\n');

  // Note: In real usage, this would happen automatically when validateResponses is enabled
  // For demo purposes, we'll simulate what happens when validation fails
  
  console.log('Expected arktype error output would include:');
  console.log('- "Expected number at \'items[0].id\', got string (\'not-a-number\')"');
  console.log('- "Expected string at \'items[0].name\', got number (123)"');
  console.log('- "Expected one of [\'Checkpoint\', \'LORA\', ...] at \'items[0].type\', got \'InvalidType\'"');
  console.log('- "Expected boolean at \'items[0].poi\', got string (\'not-boolean\')"');
  console.log('- "Expected number at \'items[0].stats.downloadCount\', got string (\'1000\')"');
  console.log('\n');

  console.log('3. How to handle validation errors in your application:\n');

  const exampleCode = `
// When making API requests with validation enabled
const result = await client.models.list({ limit: 10 });

if (result.isErr()) {
  const error = result.error;
  
  if (isValidationError(error)) {
    console.error('Validation failed:');
    console.error('Message:', error.message);
    console.error('Arktype error details:', error.details);
    
    // Arktype provides detailed error information:
    // - error.details.summary: Human-readable summary
    // - error.details.problems: Array of specific problems
    // - error.details.byPath: Errors organized by path
    
    // You can display this to developers or log it for debugging
  } else {
    // Handle other error types (network, unauthorized, etc.)
    console.error('Other error:', error);
  }
} else {
  // Success - data is validated and type-safe
  const models = result.value;
  console.log(\`Found \${models.items.length} models\`);
}
`;

  console.log(exampleCode);
  console.log('\n4. Benefits of arktype validation:\n');
  console.log('- Type safety at runtime');
  console.log('- Detailed, human-readable error messages');
  console.log('- Automatic TypeScript type inference');
  console.log('- Early detection of API contract violations');
  console.log('- Better debugging experience');

  console.log('\n=== Demo Complete ===');
}

// Run the demo
validationDemo().catch(console.error);
