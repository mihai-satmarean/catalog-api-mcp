/**
 * XD Connects API Client
 * 
 * Client for fetching data from XD Connects JSON feeds
 */

import { getXDConnectsFeedUrl, type XDConnectsConfig } from './config';

export type XDConnectsFeedType = 'productData' | 'productPrices' | 'printData' | 'printPrices' | 'stock';

interface XDConnectsRequestOptions {
  headers?: Record<string, string>;
}

/**
 * Base function to fetch data from XD Connects feeds
 */
async function xdConnectsRequest<T>(
  feedType: XDConnectsFeedType,
  options: XDConnectsRequestOptions = {}
): Promise<T> {
  const { headers = {} } = options;
  const feedUrl = getXDConnectsFeedUrl(feedType);

  const response = await fetch(feedUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`XD Connects API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Product Data API
 * Retrieves product information
 */
export async function getProductData<T = any>(
  options: XDConnectsRequestOptions = {}
): Promise<T> {
  return xdConnectsRequest<T>('productData', options);
}

/**
 * Product Prices API
 * Retrieves product pricing information
 */
export async function getProductPrices<T = any>(
  options: XDConnectsRequestOptions = {}
): Promise<T> {
  return xdConnectsRequest<T>('productPrices', options);
}

/**
 * Print Data API
 * Retrieves print information
 */
export async function getPrintData<T = any>(
  options: XDConnectsRequestOptions = {}
): Promise<T> {
  return xdConnectsRequest<T>('printData', options);
}

/**
 * Print Prices API
 * Retrieves print pricing information
 */
export async function getPrintPrices<T = any>(
  options: XDConnectsRequestOptions = {}
): Promise<T> {
  return xdConnectsRequest<T>('printPrices', options);
}

/**
 * Stock API
 * Retrieves stock levels
 */
export async function getStock<T = any>(
  options: XDConnectsRequestOptions = {}
): Promise<T> {
  return xdConnectsRequest<T>('stock', options);
}

