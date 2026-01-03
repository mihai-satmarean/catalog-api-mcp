import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, products, productVariants, digitalAssets } from '../db/connection.js';
import { eq, like, and, or, sql } from 'drizzle-orm';
import { getProducts as getMidoceanProducts } from '../lib/providers/midocean/client.js';
import { getProductData as getXDConnectsProductData } from '../lib/providers/xd-connects/client.js';

export const productTools: Tool[] = [
  {
    name: 'sync_suppliers',
    description: 'Synchronize and import ALL products from supplier APIs (Midocean and XD Connects). This will fetch real product data from supplier feeds/APIs and populate the database automatically. Use this when you need to import the complete product catalog from all suppliers. This is a long-running operation that may take several minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        suppliers: {
          type: 'array',
          description: 'Array of suppliers to sync (midocean, xd-connects, or all)',
          items: {
            type: 'string',
            enum: ['midocean', 'xd-connects', 'all'],
          },
          default: ['all'],
        },
        limit: {
          type: 'number',
          description: 'Maximum number of products to import per supplier (optional, for testing)',
        },
      },
    },
  },
  {
    name: 'import_products',
    description: 'Import/create specific products in the catalog database. Use this to manually add individual products or small batches with specific details. For bulk import from suppliers, use sync_suppliers instead.',
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

export async function handleSyncSuppliers(args: any) {
  const { suppliers = ['all'], limit } = args;
  const suppliersToSync = suppliers.includes('all') ? ['midocean', 'xd-connects'] : suppliers;
  
  const imported = [];
  const errors = [];
  
  console.error(`[Sync Suppliers] Starting REAL sync for: ${suppliersToSync.join(', ')}`);
  
  // Sync Midocean products (REAL API)
  if (suppliersToSync.includes('midocean')) {
    console.error('[Sync Suppliers] Fetching REAL products from Midocean API...');
    try {
      const response: any = await getMidoceanProducts({
        environment: 'test',
        format: 'json',
      });
      
      // Debug: log response structure
      console.error(`[Sync Suppliers] Midocean API response keys:`, Object.keys(response || {}));
      console.error(`[Sync Suppliers] Midocean API response type:`, typeof response, Array.isArray(response) ? '(array)' : '(object)');
      if (Array.isArray(response)) {
        console.error(`[Sync Suppliers] Response is an array with ${response.length} items`);
      } else if (response && typeof response === 'object') {
        console.error(`[Sync Suppliers] First level keys sample:`, JSON.stringify(response).substring(0, 500));
      }
      
      // Try different possible structures
      const midoceanProducts = response?.products || response?.data?.products || (Array.isArray(response) ? response : []);
      console.error(`[Sync Suppliers] Midocean API returned ${midoceanProducts.length} products`);
      const productsToImport = limit ? midoceanProducts.slice(0, limit) : midoceanProducts;
      
      // Log first product structure for debugging
      if (productsToImport.length > 0) {
        console.error(`[Sync Suppliers] First Midocean product sample keys:`, Object.keys(productsToImport[0]).slice(0, 40));
        console.error(`[Sync Suppliers] First Midocean product sample data:`, JSON.stringify({
          variant_code: productsToImport[0].variant_code,
          master_code: productsToImport[0].master_code,
          name: productsToImport[0].name,
          master_name: productsToImport[0].master_name,
          brand: productsToImport[0].brand,
          commodity_group_description: productsToImport[0].commodity_group_description
        }));
      }
      
      for (const apiProduct of productsToImport) {
        try {
          // Transform Midocean API response to our product schema
          // Midocean uses: product_name, short_description, long_description, product_class, etc.
          const productData = {
            name: apiProduct.product_name || 'Unknown Product',
            description: apiProduct.short_description || apiProduct.long_description || '',
            price: 0, // Midocean product feed doesn't include prices, need separate pricelist API
            source: 'midocean' as const,
            brand: apiProduct.brand || 'Midocean',
            productCode: apiProduct.master_code, // master_code is the main product code
            masterCode: apiProduct.master_code,
            category: apiProduct.product_class || 'General',
            color: '', // Color info is in variants array
            material: apiProduct.material || '',
            dimensions: apiProduct.dimensions || '',
            length: parseFloat(apiProduct.length || '0'),
            width: parseFloat(apiProduct.width || '0'),
            height: parseFloat(apiProduct.height || '0'),
            weight: parseFloat(apiProduct.net_weight || '0'),
            imageUrl: '', // Images are in digital_assets or variants array
            countryOfOrigin: apiProduct.country_of_origin || '',
          };
          
          const result = await db.insert(products).values(productData).returning();
          imported.push(result[0]);
        } catch (error) {
          errors.push({
            product: apiProduct.name || apiProduct.variant_code || 'Unknown',
            supplier: 'midocean',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      console.error(`[Sync Suppliers] Midocean: imported ${imported.length}, errors ${errors.length}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Sync Suppliers] Failed to fetch from Midocean API: ${errorMsg}`);
      errors.push({
        supplier: 'midocean',
        error: errorMsg,
      });
    }
  }
  
  // Sync XD Connects products (REAL API)
  if (suppliersToSync.includes('xd-connects')) {
    console.error('[Sync Suppliers] Fetching REAL products from XD Connects API...');
    try {
      const response: any = await getXDConnectsProductData();
      
      // Debug: log response structure
      console.error(`[Sync Suppliers] XD Connects API response keys:`, Object.keys(response || {}));
      console.error(`[Sync Suppliers] XD Connects API response type:`, typeof response, Array.isArray(response) ? '(array)' : '(object)');
      
      // Try different possible structures (Products with capital P, products with lowercase, direct array)
      const xdProducts = response?.Products || response?.products || (Array.isArray(response) ? response : []);
      console.error(`[Sync Suppliers] XD Connects API returned ${xdProducts.length} products`);
      const productsToImport = limit ? xdProducts.slice(0, limit) : xdProducts;
      
      for (const apiProduct of productsToImport) {
        try {
          // Transform XD Connects API response to our product schema
          // XD Connects uses different field names (ItemName, ItemCode, etc.)
          const productData = {
            name: apiProduct.ItemName || 'Unknown Product',
            description: apiProduct.LongDescription || '',
            price: 0, // XD Connects doesn't include price in product feed, need separate price feed
            source: 'xd-connects' as const,
            brand: apiProduct.Brand || 'XD Connects',
            productCode: apiProduct.ItemCode || apiProduct.ModelCode,
            masterCode: apiProduct.ModelCode,
            category: apiProduct.MainCategory || 'General',
            color: apiProduct.Color || '',
            material: apiProduct.Material || '',
            dimensions: apiProduct.ItemDimensions || `${apiProduct.ItemWidthCM || 0}x${apiProduct.ItemLengthCM || 0}x${apiProduct.ItemHeightCM || 0} cm`,
            length: parseFloat(apiProduct.ItemLengthCM || '0'),
            width: parseFloat(apiProduct.ItemWidthCM || '0'),
            height: parseFloat(apiProduct.ItemHeightCM || '0'),
            weight: parseFloat(apiProduct.ItemWeightNetGr || '0'),
            imageUrl: apiProduct.MainImage || '',
            countryOfOrigin: apiProduct.CountryOfOrigin || '',
          };
          
          const result = await db.insert(products).values(productData).returning();
          imported.push(result[0]);
        } catch (error) {
          errors.push({
            product: apiProduct.Name || apiProduct.Code || 'Unknown',
            supplier: 'xd-connects',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      console.error(`[Sync Suppliers] XD Connects: imported ${imported.length}, errors ${errors.length}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Sync Suppliers] Failed to fetch from XD Connects API: ${errorMsg}`);
      errors.push({
        supplier: 'xd-connects',
        error: errorMsg,
      });
    }
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Synced ${imported.length} REAL products from ${suppliersToSync.join(', ')} APIs`,
          imported: imported.length,
          errors: errors.length,
          suppliers: suppliersToSync,
          note: '✅ These are REAL products fetched from live supplier APIs (Midocean Test & XD Connects)',
          errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined, // Show max 10 errors
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

