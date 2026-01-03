/**
 * XD Connects Provider Configuration
 * 
 * Configuration for XD Connects feed integration
 */

export interface XDConnectsConfig {
  baseUrl: string;
  feeds: {
    productData: string;
    productPrices: string;
    printData: string;
    printPrices: string;
    stock: string;
  };
}

const XD_CONNECTS_CONFIG: XDConnectsConfig = {
  baseUrl: process.env.XD_CONNECTS_BASE_URL || 'https://feeds.xindao.com',
  feeds: {
    productData: process.env.XD_CONNECTS_PRODUCT_DATA_URL || 'https://feeds.xindao.com/Feeds/Download/2480-hNbCJ809IMnNhlXSXmrB_94sSJe0BZn5THm2VC0WXfDlY1ChSF1TEwO3T-BfZav7b5vptiGrZ9sI2noY8-Su8t_a/Xindao.V6.Products-en-gb-C40084.json',
    productPrices: process.env.XD_CONNECTS_PRODUCT_PRICES_URL || 'https://feeds.xindao.com/Feeds/Download/2480-oWw8yARgiQI7zwk6HYu04rZSQHGrFp2pZMBpdgkKZZlJmQkQ-IlJiwmyPrO50kEY5wkysSY4VpXVZ0l1_ZSeKKXQ/Xindao.V2.ProductPrices-en-gb-C40084.json',
    printData: process.env.XD_CONNECTS_PRINT_DATA_URL || 'https://feeds.xindao.com/Feeds/Download/2480-66b_iaBNB1rQE2hF5kN42fMbTtYAMjamVDQWSr0NL5QWxrV6SQJnGdZORiLqdLGbOW5UugBmlt7iv59AMWrUWV0o/Xindao.V3.PrintData-en-gb-C40084.json',
    printPrices: process.env.XD_CONNECTS_PRINT_PRICES_URL || 'https://feeds.xindao.com/Feeds/Download/2480-dnH1zBK0f2uC55zFtH2HsGD8RsCtoJaE5pobMT9LV6lWEPceoFUWBQC9W-LDyI80TwY6heodkdbVyblA08SE02Rh/Xindao.V3.PrintPrices-en-gb-C40084.json',
    stock: process.env.XD_CONNECTS_STOCK_URL || 'https://feeds.xindao.com/Feeds/Download/2480-S43gQjLTD3V_-aAW5umAFEn3TV2hIiM1Q--epbAvu7k36hq87SG8UpoMJ0Wg2Ngg0JpNk2BwoaHCRGyYuO4ua4w9/Xindao.V2.Stock-en-gb-C40084.json',
  },
};

/**
 * Get XD Connects configuration
 */
export function getXDConnectsConfig(): XDConnectsConfig {
  return XD_CONNECTS_CONFIG;
}

/**
 * Get feed URL by type
 */
export function getXDConnectsFeedUrl(feedType: keyof XDConnectsConfig['feeds']): string {
  return XD_CONNECTS_CONFIG.feeds[feedType];
}

