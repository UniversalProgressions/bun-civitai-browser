/**
 * Shared IDs for Civitai API examples
 * 
 * This module provides consistent model and version IDs for all examples
 * to ensure they use the same data for demonstration purposes.
 */

/**
 * Example model ID for demonstration
 * Model: "CharTurner - Character Turnaround helper for 1.5 AND 2.1!"
 * This is a popular TextualInversion model that works well for examples
 */
export const EXAMPLE_MODEL_ID = 833294;

/**
 * Example model version ID for demonstration
 * Version: "CharTurner V2 - For 1.5"
 * This is a specific version of the example model
 */
export const EXAMPLE_VERSION_ID = 1116447;

/**
 * Alternative example model ID (used in some examples)
 * Model: "Pony Diffusion V6 XL"
 * This is a popular Checkpoint model
 */
export const EXAMPLE_MODEL_ID_2 = 2167995;

/**
 * Alternative example version ID (used in some examples)
 * Version: "V6 (start with this one)"
 * This is a specific version of the alternative model
 */
export const EXAMPLE_VERSION_ID_2 = 2532077;

/**
 * Legacy example model ID (used in backward compatibility examples)
 * Model: "CharTurner - Character Turnaround helper for 1.5 AND 2.1!"
 * This is the same as EXAMPLE_MODEL_ID but with the old ID
 */
export const LEGACY_EXAMPLE_MODEL_ID = 7240;

/**
 * Legacy example version ID (used in backward compatibility examples)
 * Version: "CharTurner V2 - For 1.5"
 * This is the same as EXAMPLE_VERSION_ID but with the old ID
 */
export const LEGACY_EXAMPLE_VERSION_ID = 948574;

/**
 * Model-version endpoint example ID
 * Version: "Alice_TOF_V1.1"
 * This is used for model-version endpoint demonstrations
 */
export const MODEL_VERSION_ENDPOINT_EXAMPLE_ID = 948574;

/**
 * Get all example IDs for reference
 */
export function getExampleIds() {
  return {
    modelId: EXAMPLE_MODEL_ID,
    versionId: EXAMPLE_VERSION_ID,
    modelId2: EXAMPLE_MODEL_ID_2,
    versionId2: EXAMPLE_VERSION_ID_2,
    legacyModelId: LEGACY_EXAMPLE_MODEL_ID,
    legacyVersionId: LEGACY_EXAMPLE_VERSION_ID,
    modelVersionEndpointId: MODEL_VERSION_ENDPOINT_EXAMPLE_ID,
  };
}

/**
 * Print example IDs for debugging
 */
export function printExampleIds() {
  const ids = getExampleIds();
  console.log('=== Civitai API Example IDs ===');
  console.log(`Primary Model ID: ${ids.modelId}`);
  console.log(`Primary Version ID: ${ids.versionId}`);
  console.log(`Secondary Model ID: ${ids.modelId2}`);
  console.log(`Secondary Version ID: ${ids.versionId2}`);
  console.log(`Legacy Model ID: ${ids.legacyModelId}`);
  console.log(`Legacy Version ID: ${ids.legacyVersionId}`);
  console.log(`Model-Version Endpoint ID: ${ids.modelVersionEndpointId}`);
  console.log('================================');
}
