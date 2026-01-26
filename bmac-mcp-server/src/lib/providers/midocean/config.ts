/**
 * Midocean Provider Configuration
 * 
 * Configuration for Midocean API integration with test and production keys
 */

export type MidoceanEnvironment = 'test' | 'production';

export interface MidoceanConfig {
  environment: MidoceanEnvironment;
  apiKey: string;
  baseUrl: string;
}

const MIDOCEAN_CONFIG: Record<MidoceanEnvironment, Omit<MidoceanConfig, 'environment'>> = {
  test: {
    apiKey: process.env.MIDOCEAN_TEST_API_KEY || 'd1f5db62-b565-4b39-a9f5-ac52c105c7c8',
    baseUrl: process.env.MIDOCEAN_TEST_BASE_URL || 'https://apitest.midocean.com',
  },
  production: {
    apiKey: process.env.MIDOCEAN_PROD_API_KEY || '46344e7a-5125-40e2-89a6-144b7cef71f7',
    baseUrl: process.env.MIDOCEAN_PROD_BASE_URL || 'https://api.midocean.com',
  },
};

/**
 * Get Midocean configuration
 * Defaults to 'test' environment
 */
export function getMidoceanConfig(environment: MidoceanEnvironment = 'test'): MidoceanConfig {
  const config = MIDOCEAN_CONFIG[environment];
  return {
    environment,
    ...config,
  };
}

/**
 * Get API key for current environment
 */
export function getMidoceanApiKey(environment: MidoceanEnvironment = 'test'): string {
  return getMidoceanConfig(environment).apiKey;
}

