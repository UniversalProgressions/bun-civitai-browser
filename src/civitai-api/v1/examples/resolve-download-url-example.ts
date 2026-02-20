/**
 * Download URL Resolution Example
 *
 * This example demonstrates the correct way to resolve Civitai model file download URLs.
 * The download URLs from Civitai API are not direct download links but require:
 * 1. Adding the API token via Authorization header (not URL parameter)
 * 2. Following redirects to get the final CDN URL
 *
 * This is the actual working pattern implemented in `resolveFileDownloadUrl` method.
 *
 * @example
 * ```typescript
 * // Example usage pattern:
 * async function downloadModelFile(downloadUrl: string, apiToken: string) {
 *   const response = await fetch(downloadUrl, {
 *     method: "GET",
 *     headers: { Authorization: `Bearer ${apiToken}` },
 *   });
 *
 *   if (!response.ok) {
 *     throw new Error(`Failed to resolve download URL: ${response.status}`);
 *   }
 *
 *   // The final CDN URL after all redirects
 *   const finalDownloadUrl = response.url;
 *   return finalDownloadUrl;
 * }
 * ```
 */

// Example: Resolving a model file download URL
export async function resolveDownloadUrlExample() {
  const downloadUrl = "https://civitai.com/api/download/models/2636014";
  const civitaiApiToken = "your-token-here";

  // Make the request with Authorization header (not token in URL)
  const response = await fetch(downloadUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${civitaiApiToken}` },
  });

  // Response example with important details:
  // {
  //   status: 200,
  //   statusText: 'OK',
  //   headers: Headers {
  //     date: 'Fri, 20 Feb 2026 13:59:44 GMT',
  //     'content-length': '57417284',
  //     connection: 'keep-alive',
  //     'accept-ranges': 'bytes',
  //     'content-disposition': 'attachment; filename="glitter_dress_ilxl_goofy.safetensors"',
  //     etag: '"b2053f7ba67798ccfd72d10fe0328dd0-1"',
  //     'last-modified': 'Tue, 27 Jan 2026 23:29:07 GMT',
  //     'x-amz-mp-parts-count': '1',
  //     vary: 'Accept-Encoding',
  //     server: 'cloudflare',
  //     'cf-ray': '9d0e86b7fe03e81b-NRT'
  //   },
  //   body: ReadableStream { locked: false, state: 'readable', supportsBYOB: true },
  //   bodyUsed: false,
  //   ok: true,
  //   redirected: true,  // IMPORTANT: The response was redirected
  //   type: 'cors',
  //   url: 'https://civitai-delivery-worker-prod.5ac0637cfd0766c97916cefa3764fbdf.r2.cloudflarestorage.com/model/14538/glitterDressIlxl.hq6X.safetensors?X-Amz-Expires=86400&response-content-disposition=attachment%3B%20filename%3D%22glitter_dress_ilxl_goofy.safetensors%22&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=e01358d793ad6966166af8b3064953ad/20260220/us-east-1/s3/aws4_request&X-Amz-Date=20260220T135943Z&X-Amz-SignedHeaders=host&X-Amz-Signature=71e7ac964f61baa1dd13e0509a4acee601646c67c50dbf9572ad6d0d31584026'
  // }

  if (!response.ok) {
    throw new Error(
      `Failed to resolve download URL: ${response.status} ${response.statusText}`,
    );
  }

  // The final CDN URL is available at response.url after following redirects
  const finalDownloadUrl = response.url;
  console.log("Final CDN download URL:", finalDownloadUrl);
  return finalDownloadUrl;
}

/**
 * Key points:
 * 1. DO NOT add token as URL parameter (?token=...)
 * 2. DO use Authorization: Bearer <token> header
 * 3. The response.url contains the final CDN URL after all redirects
 * 4. This URL is what should be passed to download managers like Gopeed
 *
 * This pattern is now implemented in `resolveFileDownloadUrl` method in
 * `src/civitai-api/v1/client/endpoints/model-versions.ts`
 */
