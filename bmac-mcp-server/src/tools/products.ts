import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, products, productVariants, digitalAssets } from '../db/connection.js';
import { eq, ilike, and, or } from 'drizzle-orm';

export const productTools: Tool[] = [
  {
    name: 'get_products',
    description: 'Get a list of products with optional filters. Can filter by source (midocean, xd-connects), search term, category, or brand.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['midocean', 'xd-connects', 'all'],
          description: 'Filter by product source',
        },
        search: {
          type: 'string',
          description: 'Search term for product name, code, or description',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        brand: {
          type: 'string',
          description: 'Filter by brand',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of products to return',
          default: 50,
        },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Get detailed information about a specific product including variants, images, and digital assets.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'The UUID of the product',
        },
        productCode: {
          type: 'string',
          description: 'The product code (master_code or product_code)',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'search_products',
    description: 'Search products by name, code, or description with fuzzy matching.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 20,
        },
      },
      required: ['query'],
    },
  },
];

export async function handleGetProducts(args: any) {
  const { source, search, category, brand, limit = 50 } = args;
  
  const conditions = [];
  
  if (source && source !== 'all') {
    conditions.push(eq(products.source, source));
  }
  
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.productCode, `%${search}%`),
        ilike(products.masterCode, `%${search}%`),
        ilike(products.description, `%${search}%`)
      )!
    );
  }
  
  if (category) {
    conditions.push(ilike(products.category, `%${category}%`));
  }
  
  if (brand) {
    conditions.push(ilike(products.brand, `%${brand}%`));
  }
  
  let query = db.select().from(products);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }
  
  const results = await query.limit(limit);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          products: results,
          count: results.length,
        }, null, 2),
      },
    ],
  };
}

export async function handleGetProductDetails(args: any) {
  const { productId, productCode } = args;
  
  if (!productId && !productCode) {
    throw new Error('Either productId or productCode must be provided');
  }
  
  let product;
  if (productId) {
    const results = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    product = results[0];
  } else {
    const results = await db
      .select()
      .from(products)
      .where(eq(products.productCode, productCode))
      .limit(1);
    product = results[0];
  }
  
  if (!product) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Product not found' }, null, 2),
        },
      ],
    };
  }
  
  // Fetch variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));
  
  // Fetch digital assets
  const assets = await db
    .select()
    .from(digitalAssets)
    .where(eq(digitalAssets.productId, product.id));
  
  // Group assets by variant
  const assetsByVariant: Record<string, any[]> = {};
  const masterAssets: any[] = [];
  
  assets.forEach(asset => {
    if (asset.variantId) {
      if (!assetsByVariant[asset.variantId]) {
        assetsByVariant[asset.variantId] = [];
      }
      assetsByVariant[asset.variantId].push(asset);
    } else {
      masterAssets.push(asset);
    }
  });
  
  const variantsWithAssets = variants.map(variant => ({
    ...variant,
    digitalAssets: assetsByVariant[variant.id] || [],
  }));
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          ...product,
          variants: variantsWithAssets,
          digitalAssets: masterAssets,
        }, null, 2),
      },
    ],
  };
}

export async function handleSearchProducts(args: any) {
  const { query, limit = 20 } = args;
  
  const results = await db
    .select()
    .from(products)
    .where(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.productCode, `%${query}%`),
        ilike(products.masterCode, `%${query}%`),
        ilike(products.description, `%${query}%`),
        ilike(products.productName, `%${query}%`)
      )!
    )
    .limit(limit);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          results,
          count: results.length,
          query,
        }, null, 2),
      },
    ],
  };
}

