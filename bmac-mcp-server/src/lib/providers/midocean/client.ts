/**
 * Midocean API Client
 * 
 * Client for interacting with Midocean REST API endpoints
 */

import { getMidoceanConfig, type MidoceanEnvironment } from './config.js';

export type MidoceanResponseFormat = 'json' | 'xml' | 'csv';

interface MidoceanRequestOptions {
  environment?: MidoceanEnvironment;
  format?: MidoceanResponseFormat;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

/**
 * Base function to make requests to Midocean API
 */
async function midoceanRequest<T>(
  endpoint: string,
  options: MidoceanRequestOptions = {}
): Promise<T> {
  const { environment = 'test', format = 'json', headers = {}, params = {} } = options;
  const config = getMidoceanConfig(environment);

  // Build URL with query parameters
  const url = new URL(`${config.baseUrl}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  // Set Accept header based on format
  const acceptHeaders: Record<MidoceanResponseFormat, string> = {
    json: 'application/json',
    xml: 'text/xml',
    csv: 'text/csv',
  };

  const requestHeaders = {
    'Accept': acceptHeaders[format],
    'x-Gateway-APIKey': config.apiKey,
    ...headers,
  };

  // Log request details for debugging
  console.error(`[Midocean API Request]`, {
    endpoint,
    url: url.toString(),
    method: 'GET',
    environment,
    format,
    headers: {
      ...requestHeaders,
      'x-Gateway-APIKey': `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}` // Mask API key
    },
    params: Object.keys(params).length > 0 ? params : undefined,
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: requestHeaders,
  });

  // Log response details
  console.error(`[Midocean API Response]`, {
    endpoint,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    let errorMessage = `Midocean API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
        console.error(`[Midocean API Error]`, {
          endpoint,
          status: response.status,
          errorBody,
        });
      }
    } catch (e) {
      // Ignore error body parsing errors
    }
    throw new Error(errorMessage);
  }

  if (format === 'json') {
    return response.json() as Promise<T>;
  } else {
    return response.text() as Promise<T>;
  }
}

/**
 * Products API
 * Retrieves information about products
 */
export async function getProducts<T = any>(
  options: MidoceanRequestOptions = {}
): Promise<T> {
  const environment = options.environment || 'test';
  console.error('[Products API] Calling getProducts with options:', {
    environment,
    format: options.format || 'json',
    hasParams: !!options.params && Object.keys(options.params).length > 0,
  });
  
  // Always use language=en parameter for Products API (cannot be overridden)
  const config = getMidoceanConfig(environment);
  const baseUrl = environment === 'production' 
    ? 'https://api.midocean.com/gateway/products/2.0'
    : 'https://apitest.midocean.com/gateway/products/2.0';
  
  const url = new URL(baseUrl);
  
  // Merge any additional params first
  const params = options.params || {};
  Object.entries(params).forEach(([key, value]) => {
    // Skip language parameter if provided - we'll set it to 'en' explicitly
    if (key.toLowerCase() !== 'language') {
      url.searchParams.append(key, String(value));
    }
  });
  
  // Always set language=en (override any language parameter that might have been passed)
  url.searchParams.set('language', 'en');
  
  // Set Accept header based on format
  const format = options.format || 'json';
  const acceptHeaders: Record<MidoceanResponseFormat, string> = {
    json: 'application/json',
    xml: 'text/xml',
    csv: 'text/csv',
  };
  
  const requestHeaders = {
    'Accept': acceptHeaders[format],
    'x-Gateway-APIKey': config.apiKey,
    ...options.headers,
  };
  
  // Log request details for debugging
  console.error(`[Midocean API Request]`, {
    endpoint: '/gateway/products/2.0',
    url: url.toString(),
    method: 'GET',
    environment,
    format,
    headers: {
      ...requestHeaders,
      'x-Gateway-APIKey': `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}` // Mask API key
    },
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: requestHeaders,
  });
  
  // Log response details
  console.error(`[Midocean API Response]`, {
    endpoint: '/gateway/products/2.0',
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
  });
  
  if (!response.ok) {
    let errorMessage = `Midocean API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
        console.error(`[Midocean API Error]`, {
          endpoint: '/gateway/products/2.0',
          status: response.status,
          errorBody,
        });
      }
    } catch (e) {
      // Ignore error body parsing errors
    }
    throw new Error(errorMessage);
  }
  
  if (format === 'json') {
    return response.json() as Promise<T>;
  } else {
    return response.text() as Promise<T>;
  }
}

