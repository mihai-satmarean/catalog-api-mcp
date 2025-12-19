cut /**
 * Midocean API Client
 * 
 * Client for interacting with Midocean REST API endpoints
 */

import { getMidoceanConfig, type MidoceanEnvironment } from './config';

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
  console.log(`[Midocean API Request]`, {
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
  console.log(`[Midocean API Response]`, {
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
 * Print Pricelist API
 * Retrieves print prices
 */
export async function getPrintPricelist<T = any>(
  options: MidoceanRequestOptions = {}
): Promise<T> {
  console.log('[Print Pricelist API] Calling getPrintPricelist with options:', {
    environment: options.environment || 'test',
    format: options.format || 'json',
    hasParams: !!options.params && Object.keys(options.params).length > 0,
  });
  return midoceanRequest<T>('/gateway/printpricelist/2.0', options);
}

/**
 * Pricelist API
 * Retrieves product prices
 */
export async function getPricelist<T = any>(
  options: MidoceanRequestOptions = {}
): Promise<T> {
  return midoceanRequest<T>('/gateway/pricelist/2.0', options);
}

/**
 * Stock API
 * Retrieves current and upcoming stock levels
 */
export async function getStock<T = any>(
  options: MidoceanRequestOptions = {}
): Promise<T> {
  return midoceanRequest<T>('/gateway/stock/2.0', options);
}

/**
 * Products API
 * Retrieves information about products
 */
export async function getProducts<T = any>(
  options: MidoceanRequestOptions = {}
): Promise<T> {
  const environment = options.environment || 'test';
  console.log('[Products API] Calling getProducts with options:', {
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
  console.log(`[Midocean API Request]`, {
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
  console.log(`[Midocean API Response]`, {
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

/**
 * Order API - Create Order
 * Creates a new order
 */
export async function createOrder<T = any>(
  orderData: Record<string, any>,
  options: Omit<MidoceanRequestOptions, 'format'> & { format?: 'json' | 'xml' } = {}
): Promise<T> {
  const { environment = 'test', format = 'json', headers = {} } = options;
  const config = getMidoceanConfig(environment);

  const acceptHeaders: Record<'json' | 'xml', string> = {
    json: 'application/json',
    xml: 'text/xml',
  };

  const requestHeaders = {
    'Accept': acceptHeaders[format],
    'Content-Type': 'application/json',
    'x-Gateway-APIKey': config.apiKey,
    ...headers,
  };

  const url = `${config.baseUrl}/gateway/order/2.1/create`;

  // Log request details for debugging
  console.log(`[Midocean API Request - Create Order]`, {
    url,
    method: 'POST',
    environment,
    format,
    headers: {
      ...requestHeaders,
      'x-Gateway-APIKey': `${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}` // Mask API key
    },
    bodySize: JSON.stringify(orderData).length,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(orderData),
  });

  // Log response details
  console.log(`[Midocean API Response - Create Order]`, {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    let errorMessage = `Midocean API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
        console.error(`[Midocean API Error - Create Order]`, {
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
 * Order API - Get Order Detail/Tracking
 * Retrieves order detail and tracking information
 */
export async function getOrderDetail<T = any>(
  orderId: string,
  options: Omit<MidoceanRequestOptions, 'format'> & { format?: 'json' | 'xml' } = {}
): Promise<T> {
  const { environment = 'test', format = 'json', headers = {}, params = {} } = options;
  const config = getMidoceanConfig(environment);

  const url = new URL(`${config.baseUrl}/gateway/order/2.1/detail`);
  url.searchParams.append('orderId', orderId);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const acceptHeaders: Record<'json' | 'xml', string> = {
    json: 'application/json',
    xml: 'text/xml',
  };

  const requestHeaders = {
    'Accept': acceptHeaders[format],
    'x-Gateway-APIKey': config.apiKey,
    ...headers,
  };

  // Log request details for debugging
  console.log(`[Midocean API Request - Order Detail]`, {
    url: url.toString(),
    method: 'GET',
    environment,
    format,
    orderId,
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
  console.log(`[Midocean API Response - Order Detail]`, {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  });

  if (!response.ok) {
    let errorMessage = `Midocean API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
        console.error(`[Midocean API Error - Order Detail]`, {
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
 * Printdata API
 * Retrieves print information
 */
export async function getPrintdata<T = any>(
  options: Omit<MidoceanRequestOptions, 'format'> & { format?: 'json' | 'xml' } = {}
): Promise<T> {
  return midoceanRequest<T>('/gateway/printdata/1.0', {
    ...options,
    format: options.format || 'json',
  });
}

