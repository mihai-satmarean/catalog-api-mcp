import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, products, productVariants, digitalAssets } from '../db/connection.js';
import { eq, like, and, or, sql } from 'drizzle-orm';

export const productTools: Tool[] = [
  {
    name: 'import_products',
    description: 'Import/create products in the catalog database. Use this to populate the database with products from Midocean, XD Connects or other sources. Accepts product details including name, code, dimensions, prices, images, and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          description: 'Array of products to import',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Product name' },
              description: { type: 'string', description: 'Product description' },
              price: { type: 'number', description: 'Product price' },
              source: { type: 'string', description: 'Source: midocean, xd-connects, manual', enum: ['midocean', 'xd-connects', 'manual'] },
              brand: { type: 'string', description: 'Brand name' },
              productCode: { type: 'string', description: 'Product SKU/code' },
              masterCode: { type: 'string', description: 'Master product code' },
              category: { type: 'string', description: 'Product category' },
              color: { type: 'string', description: 'Product color' },
              material: { type: 'string', description: 'Product material' },
              dimensions: { type: 'string', description: 'Dimensions string (e.g., "10x5x2 cm")' },
              length: { type: 'number', description: 'Length in cm' },
              width: { type: 'number', description: 'Width in cm' },
              height: { type: 'number', description: 'Height in cm' },
              weight: { type: 'number', description: 'Weight in grams' },
              imageUrl: { type: 'string', description: 'Main image URL' },
              countryOfOrigin: { type: 'string', description: 'Country of origin' },
            },
            required: ['name', 'source'],
          },
        },
      },
      required: ['products'],
    },
  },
  {
    name: 'get_products',
    description: 'Search and browse product catalogs from Midocean and XD Connects suppliers. Find products by name (pens, pixuri, mugs, bags), category, brand, color, or search term. Returns product information including dimensions, prices, specifications, and availability.',
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
    description: 'Get complete product information from Midocean or XD Connects including dimensions (măsurători), prices (prețuri), specifications, variants (colors, sizes), images, and digital assets. Use after finding a product to get full details.',
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
    description: 'Fuzzy search for products from Midocean and XD Connects catalogs. Search by keywords like "blue pens" (pixuri albastre), "red mug", product names, codes, or descriptions. Ideal for finding products when exact names are unknown.',
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
    const searchPattern = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        sql`LOWER(${products.name}) LIKE ${searchPattern}`,
        sql`LOWER(${products.productCode}) LIKE ${searchPattern}`,
        sql`LOWER(${products.masterCode}) LIKE ${searchPattern}`,
        sql`LOWER(${products.description}) LIKE ${searchPattern}`
      )!
    );
  }
  
  if (category) {
    const categoryPattern = `%${category.toLowerCase()}%`;
    conditions.push(sql`LOWER(${products.category}) LIKE ${categoryPattern}`);
  }
  
  if (brand) {
    const brandPattern = `%${brand.toLowerCase()}%`;
    conditions.push(sql`LOWER(${products.brand}) LIKE ${brandPattern}`);
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
  const queryPattern = `%${query.toLowerCase()}%`;
  
  const results = await db
    .select()
    .from(products)
    .where(
      or(
        sql`LOWER(${products.name}) LIKE ${queryPattern}`,
        sql`LOWER(${products.productCode}) LIKE ${queryPattern}`,
        sql`LOWER(${products.masterCode}) LIKE ${queryPattern}`,
        sql`LOWER(${products.description}) LIKE ${queryPattern}`,
        sql`LOWER(${products.productName}) LIKE ${queryPattern}`
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

export async function handleImportProducts(args: any) {
  const { products: productsToImport } = args;
  
  if (!productsToImport || !Array.isArray(productsToImport) || productsToImport.length === 0) {
    throw new Error('products array is required and must not be empty');
  }
  
  const imported = [];
  const errors = [];
  
  for (const productData of productsToImport) {
    try {
      const result = await db.insert(products).values({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        source: productData.source,
        brand: productData.brand,
        productCode: productData.productCode,
        masterCode: productData.masterCode,
        category: productData.category,
        color: productData.color,
        material: productData.material,
        dimensions: productData.dimensions,
        length: productData.length,
        width: productData.width,
        height: productData.height,
        weight: productData.weight,
        imageUrl: productData.imageUrl,
        countryOfOrigin: productData.countryOfOrigin,
      }).returning();
      
      imported.push(result[0]);
    } catch (error) {
      errors.push({
        product: productData.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          imported: imported.length,
          errors: errors.length,
          products: imported,
          errorDetails: errors,
        }, null, 2),
      },
    ],
  };
}

