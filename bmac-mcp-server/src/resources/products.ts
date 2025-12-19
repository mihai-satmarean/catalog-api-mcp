import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { db, products } from '../db/connection.js';
import { eq } from 'drizzle-orm';

export async function listProductResources(): Promise<Resource[]> {
  // Get a sample of products to list as resources
  const sampleProducts = await db
    .select()
    .from(products)
    .limit(100);
  
  return sampleProducts.map((product: any) => ({
    uri: `bmac://products/${product.id}`,
    name: product.name || product.productCode || product.masterCode || 'Unnamed Product',
    description: `Product: ${product.name || product.productCode || product.masterCode}`,
    mimeType: 'application/json',
  }));
}

export async function getProductResource(uri: string): Promise<{ contents: any[] }> {
  // Parse URI: bmac://products/{productId}
  const match = uri.match(/^bmac:\/\/products\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid product resource URI: ${uri}`);
  }
  
  const productId = match[1];
  
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  if (product.length === 0) {
    throw new Error(`Product not found: ${productId}`);
  }
  
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(product[0], null, 2),
      },
    ],
  };
}

