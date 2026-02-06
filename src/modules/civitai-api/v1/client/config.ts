/**
 * Civitai Client Configuration Options
 */
export interface ClientConfig {
  /**
   * Civitai API key (optional)
   * Used for authenticated requests
   */
  apiKey?: string;
  
  /**
   * API base URL (optional)
   * Default: 'https://civitai.com/api/v1'
   */
  baseUrl?: string;
  
  /**
   * Request timeout in milliseconds
   * Default: 30000 (30 seconds)
   */
  timeout?: number;
  
  /**
   * Custom request headers
   */
  headers?: Record<string, string>;
  
  /**
   * Proxy configuration
   * Can be string format 'http://host:port'
   * or object format { host: string, port: number }
   */
  proxy?: string | { host: string; port: number };
  
  /**
   * Whether to enable response validation
   * Default: false
   */
  validateResponses?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<Pick<ClientConfig, 'baseUrl' | 'timeout' | 'validateResponses'>> = {
  baseUrl: 'https://civitai.com/api/v1',
  timeout: 30000,
  validateResponses: false,
};

/**
 * Merge user configuration with default configuration
 */
export function mergeConfig(userConfig: ClientConfig = {}): ClientConfig & { baseUrl: string; timeout: number; validateResponses: boolean } {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
}

/**
 * Helper function to create proxy agent
 */
export function createProxyAgent(proxy: string | { host: string; port: number }) {
  if (typeof proxy === 'string') {
    // Parse string format proxy
    try {
      const url = new URL(proxy);
      return {
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80),
        protocol: url.protocol.replace(':', ''),
      };
    } catch {
      throw new Error(`Invalid proxy URL: ${proxy}`);
    }
  } else {
    // Object format proxy
    return {
      host: proxy.host,
      port: proxy.port,
      protocol: 'http',
    };
  }
}
