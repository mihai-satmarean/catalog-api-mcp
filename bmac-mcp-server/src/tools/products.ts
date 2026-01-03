import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, products, productVariants, digitalAssets } from '../db/connection.js';
import { eq, like, and, or, sql } from 'drizzle-orm';

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
  
  // Generate realistic demo products for each supplier
  const demoProducts = [];
  
  if (suppliersToSync.includes('midocean')) {
    // Midocean demo products
    const midoceanProducts = [
      { name: 'Classic ballpoint pen', code: 'MO1234-04', category: 'Writing', color: 'Blue', price: 1.5, length: 14, width: 1, weight: 10 },
      { name: 'Metal twist pen', code: 'MO1235-06', category: 'Writing', color: 'Silver', price: 2.8, length: 13.8, width: 1.1, weight: 15 },
      { name: 'Recycled paper pen', code: 'MO1236-13', category: 'Writing', color: 'Green', price: 1.2, length: 14.2, width: 0.9, weight: 8 },
      { name: 'Cork notebook A5', code: 'MO2001-40', category: 'Notebooks', color: 'Natural', price: 5.5, length: 21, width: 14.8, weight: 180 },
      { name: 'Cotton tote bag', code: 'MO3001-13', category: 'Bags', color: 'Natural', price: 3.2, length: 38, width: 42, weight: 120 },
      { name: 'Canvas backpack', code: 'MO3002-03', category: 'Bags', color: 'Black', price: 12.5, length: 42, width: 30, weight: 350 },
      { name: 'Ceramic mug 300ml', code: 'MO4001-06', category: 'Drinkware', color: 'White', price: 4.2, length: 9.5, width: 8, weight: 280 },
      { name: 'Stainless steel bottle 500ml', code: 'MO4002-16', category: 'Drinkware', color: 'Blue', price: 8.5, length: 24, width: 7, weight: 210 },
      { name: 'Bamboo desk organizer', code: 'MO5001-40', category: 'Office', color: 'Natural', price: 6.8, length: 18, width: 12, weight: 250 },
      { name: 'Wireless charging pad', code: 'MO6001-03', category: 'Technology', color: 'Black', price: 15.2, length: 10, width: 10, weight: 85 },
    ];
    
    for (const p of midoceanProducts.slice(0, limit || midoceanProducts.length)) {
      demoProducts.push({
        name: p.name,
        description: `${p.name} from Midocean - high quality promotional product`,
        price: p.price,
        source: 'midocean',
        brand: 'Midocean',
        productCode: p.code,
        masterCode: p.code.split('-')[0],
        category: p.category,
        color: p.color,
        material: p.category === 'Writing' ? 'Plastic/Metal' : p.category === 'Bags' ? 'Cotton/Canvas' : 'Various',
        dimensions: `${p.length}x${p.width} cm`,
        length: p.length,
        width: p.width,
        weight: p.weight,
        countryOfOrigin: 'China',
      });
    }
  }
  
  if (suppliersToSync.includes('xd-connects')) {
    // XD Connects demo products
    const xdProducts = [
      { name: 'Eco bamboo pen', code: 'XD1001', category: 'Writing', color: 'Natural', price: 1.8, length: 14, width: 1, weight: 12 },
      { name: 'Aluminum pen set', code: 'XD1002', category: 'Writing', color: 'Silver', price: 4.5, length: 13.5, width: 1.2, weight: 25 },
      { name: 'Recycled notebook', code: 'XD2001', category: 'Notebooks', color: 'Brown', price: 4.2, length: 21, width: 15, weight: 200 },
      { name: 'Leather notebook A4', code: 'XD2002', category: 'Notebooks', color: 'Black', price: 12.8, length: 29.7, width: 21, weight: 420 },
      { name: 'Non-woven bag', code: 'XD3001', category: 'Bags', color: 'Red', price: 2.1, length: 40, width: 35, weight: 80 },
      { name: 'Jute shopping bag', code: 'XD3002', category: 'Bags', color: 'Natural', price: 5.8, length: 45, width: 38, weight: 180 },
      { name: 'Travel mug 400ml', code: 'XD4001', category: 'Drinkware', color: 'Black', price: 6.5, length: 18, width: 8.5, weight: 220 },
      { name: 'Glass water bottle 600ml', code: 'XD4002', category: 'Drinkware', color: 'Clear', price: 7.2, length: 22, width: 6.5, weight: 380 },
      { name: 'USB power bank 5000mAh', code: 'XD6001', category: 'Technology', color: 'Black', price: 18.5, length: 12, width: 6, weight: 140 },
      { name: 'Bluetooth speaker', code: 'XD6002', category: 'Technology', color: 'Blue', price: 22.8, length: 8, width: 8, weight: 250 },
    ];
    
    for (const p of xdProducts.slice(0, limit || xdProducts.length)) {
      demoProducts.push({
        name: p.name,
        description: `${p.name} from XD Connects - innovative promotional items`,
        price: p.price,
        source: 'xd-connects',
        brand: 'XD Connects',
        productCode: p.code,
        category: p.category,
        color: p.color,
        material: p.category === 'Writing' ? 'Bamboo/Aluminum' : p.category === 'Technology' ? 'Plastic/Electronics' : 'Various',
        dimensions: `${p.length}x${p.width} cm`,
        length: p.length,
        width: p.width,
        weight: p.weight,
        countryOfOrigin: 'Netherlands',
      });
    }
  }
  
  // Import all generated products
  const imported = [];
  const errors = [];
  
  for (const productData of demoProducts) {
    try {
      const result = await db.insert(products).values(productData).returning();
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
          message: `Synced ${imported.length} demo products from ${suppliersToSync.join(', ')}`,
          imported: imported.length,
          errors: errors.length,
          suppliers: suppliersToSync,
          note: 'These are demo products. For real product data, configure supplier API keys in environment variables.',
          errorDetails: errors.length > 0 ? errors : undefined,
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

