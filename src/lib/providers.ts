// Provider simulation service for price comparison
export interface ProviderQuote {
  providerName: string;
  price: number;
  deliveryDays: number;
  reliabilityScore: number;
  responseTime: number;
}

// Provider configurations with different characteristics
const PROVIDERS = {
  ProviderA: {
    baseMultiplier: 0.95, // 5% cheaper on average
    priceVariation: 0.15, // ±15% variation
    deliveryRange: [3, 7], // 3-7 days
    reliabilityRange: [85, 95], // 85-95% reliability
    responseDelayRange: [500, 1500], // 0.5-1.5s response time
  },
  ProviderB: {
    baseMultiplier: 1.0, // Same price as base
    priceVariation: 0.20, // ±20% variation
    deliveryRange: [5, 10], // 5-10 days
    reliabilityRange: [75, 90], // 75-90% reliability
    responseDelayRange: [1000, 2500], // 1-2.5s response time
  },
  ProviderC: {
    baseMultiplier: 1.05, // 5% more expensive on average
    priceVariation: 0.10, // ±10% variation
    deliveryRange: [7, 14], // 7-14 days
    reliabilityRange: [90, 99], // 90-99% reliability
    responseDelayRange: [800, 3000], // 0.8-3s response time
  },
} as const;

export type ProviderName = keyof typeof PROVIDERS;

/**
 * Simulates a provider API call with random delay and generates a quote
 */
export async function getProviderQuote(
  providerName: ProviderName,
  productId: string,
  quantity: number,
  basePrice: number
): Promise<ProviderQuote> {
  const provider = PROVIDERS[providerName];
  
  // Simulate API response delay
  const delay = randomBetween(provider.responseDelayRange[0], provider.responseDelayRange[1]);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Calculate price with provider-specific characteristics
  const basePriceWithMultiplier = basePrice * provider.baseMultiplier;
  const priceVariation = randomBetween(-provider.priceVariation, provider.priceVariation);
  const finalPrice = basePriceWithMultiplier * (1 + priceVariation) * quantity;
  
  // Generate other quote characteristics
  const deliveryDays = Math.round(randomBetween(provider.deliveryRange[0], provider.deliveryRange[1]));
  const reliabilityScore = randomBetween(provider.reliabilityRange[0], provider.reliabilityRange[1]);
  
  return {
    providerName,
    price: Math.round(finalPrice * 100) / 100, // Round to 2 decimal places
    deliveryDays,
    reliabilityScore: Math.round(reliabilityScore * 100) / 100, // Round to 2 decimal places
    responseTime: Math.round(delay), // Ensure integer value
  };
}

/**
 * Fetches quotes from all providers in parallel
 */
export async function getAllProviderQuotes(
  productId: string,
  quantity: number,
  basePrice: number
): Promise<ProviderQuote[]> {
  const providers: ProviderName[] = ['ProviderA', 'ProviderB', 'ProviderC'];
  
  // Call all providers in parallel
  const quotePromises = providers.map(providerName => 
    getProviderQuote(providerName, productId, quantity, basePrice)
  );
  
  return Promise.all(quotePromises);
}

/**
 * Helper function to generate random numbers between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
