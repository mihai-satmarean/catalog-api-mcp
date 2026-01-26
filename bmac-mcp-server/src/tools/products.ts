import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { db, products, productVariants, digitalAssets, productPrices } from '../db/connection.js';
import { eq, like, and, or, sql, count } from 'drizzle-orm';
import { getProducts as getMidoceanProducts, getPricelist as getMidoceanPricelist, getPrintPricelist as getMidoceanPrintPricelist } from '../lib/providers/midocean/client.js';
import { getProductData as getXDConnectsProductData, getProductPrices as getXDConnectsProductPrices } from '../lib/providers/xd-connects/client.js';

export const productTools: Tool[] = [
  {
    name: 'sync_suppliers',
    description: 'Import all products from Midocean and XD Connects APIs.',
    inputSchema: {
      type: 'object',
      properties: {
        suppliers: {
          type: 'array',
          items: { type: 'string', enum: ['midocean', 'xd-connects', 'all'] },
          default: ['all'],
        },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'import_products',
    description: 'Manually add specific products to catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              source: { type: 'string', enum: ['midocean', 'xd-connects', 'manual'] },
              brand: { type: 'string' },
              productCode: { type: 'string' },
              masterCode: { type: 'string' },
              category: { type: 'string' },
              color: { type: 'string' },
              material: { type: 'string' },
              dimensions: { type: 'string' },
              length: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              weight: { type: 'number' },
              imageUrl: { type: 'string' },
              countryOfOrigin: { type: 'string' },
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
    description: 'Search products by name, category, brand, or filter.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['midocean', 'xd-connects', 'all'] },
        search: { type: 'string' },
        category: { type: 'string' },
        brand: { type: 'string' },
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Get full product info: variants, prices, dimensions, images.',
    inputSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        productCode: { type: 'string' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'search_products',
    description: 'Fuzzy search products by keywords.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 20 },
        offset: { type: 'number', default: 0 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_xd_connects_prices',
    description: 'Get XD Connects prices with tiers and MOQ.',
    inputSchema: {
      type: 'object',
      properties: {
        itemCode: { type: 'string' },
        search: { type: 'string' },
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'get_midocean_prices',
    description: 'Get Midocean product prices with tiers.',
    inputSchema: {
      type: 'object',
      properties: {
        productCode: { type: 'string' },
        search: { type: 'string' },
        environment: { type: 'string', enum: ['test', 'production'], default: 'test' },
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'get_midocean_print_prices',
    description: 'Get Midocean print prices.',
    inputSchema: {
      type: 'object',
      properties: {
        productCode: { type: 'string' },
        search: { type: 'string' },
        environment: { type: 'string', enum: ['test', 'production'], default: 'test' },
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'sync_xd_connects_prices',
    description: 'Batch sync XD Connects prices to database.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 500 },
        batchSize: { type: 'number', default: 50 },
      },
    },
  },
];

export async function handleGetProducts(args: any) {
  const { source, search, category, brand, limit = 20, offset = 0 } = args;
  
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
  
  // Get total count for pagination
  let countQuery = db.select({ count: count() }).from(products);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions)!) as any;
  }
  const [{ count: totalCount }] = await countQuery;
  
  // Get paginated results
  let query = db.select().from(products);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }
  const results = await query.limit(limit).offset(offset);
  
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasMore = offset + results.length < totalCount;
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          products: results,
          pagination: {
            total: totalCount,
            count: results.length,
            limit,
            offset,
            page: currentPage,
            totalPages,
            hasMore,
          },
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
  const { query, limit = 20, offset = 0 } = args;
  const queryPattern = `%${query.toLowerCase()}%`;
  
  const searchCondition = or(
    sql`LOWER(${products.name}) LIKE ${queryPattern}`,
    sql`LOWER(${products.productCode}) LIKE ${queryPattern}`,
    sql`LOWER(${products.masterCode}) LIKE ${queryPattern}`,
    sql`LOWER(${products.description}) LIKE ${queryPattern}`,
    sql`LOWER(${products.productName}) LIKE ${queryPattern}`
  )!;
  
  // Get total count for pagination
  const [{ count: totalCount }] = await db
    .select({ count: count() })
    .from(products)
    .where(searchCondition);
  
  // Get paginated results
  const results = await db
    .select()
    .from(products)
    .where(searchCondition)
    .limit(limit)
    .offset(offset);
  
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasMore = offset + results.length < totalCount;
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          results,
          query,
          pagination: {
            total: totalCount,
            count: results.length,
            limit,
            offset,
            page: currentPage,
            totalPages,
            hasMore,
          },
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

export async function handleGetXDConnectsPrices(args: any) {
  const { itemCode, search, limit = 50 } = args;
  
  try {
    // Fetch prices from XD Connects API
    const pricesData = await getXDConnectsProductPrices();
    
    // Handle different response formats
    let prices: any[] = [];
    if (Array.isArray(pricesData)) {
      prices = pricesData;
    } else if (pricesData && typeof pricesData === 'object') {
      // Try common response structures
      prices = pricesData.Prices || pricesData.prices || pricesData.data || pricesData.Products || pricesData.products || [];
      if (!Array.isArray(prices)) {
        // If it's a single object, wrap it in an array
        prices = [pricesData];
      }
    }
    
    // Filter by itemCode if provided
    if (itemCode) {
      prices = prices.filter((p: any) => 
        (p.ItemCode || p.itemCode || '').toLowerCase() === itemCode.toLowerCase()
      );
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      prices = prices.filter((p: any) => 
        (p.ItemName || p.itemName || '').toLowerCase().includes(searchLower) ||
        (p.ItemCode || p.itemCode || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Limit results
    const limitedPrices = prices.slice(0, limit);
    
    // Transform prices to a more readable format
    const formattedPrices = limitedPrices.map((price: any) => ({
      itemCode: price.ItemCode || price.itemCode || null,
      itemName: price.ItemName || price.itemName || null,
      currency: price.Currency || price.currency || null,
      unitPriceNet: price.ItemPriceNet_Qty1 || price.itemPriceNet_Qty1 || null,
      unitPriceGross: price.ItemPriceGross_Qty1 || price.itemPriceGross_Qty1 || null,
      priceTiers: {
        tier1: {
          quantity: price.Qty1 || price.qty1 || null,
          priceNet: price.ItemPriceNet_Qty1 || price.itemPriceNet_Qty1 || null,
          priceGross: price.ItemPriceGross_Qty1 || price.itemPriceGross_Qty1 || null,
        },
        tier2: {
          quantity: price.Qty2 || price.qty2 || null,
          priceNet: price.ItemPriceNet_Qty2 || price.itemPriceNet_Qty2 || null,
          priceGross: price.ItemPriceGross_Qty2 || price.itemPriceGross_Qty2 || null,
        },
        tier3: {
          quantity: price.Qty3 || price.qty3 || null,
          priceNet: price.ItemPriceNet_Qty3 || price.itemPriceNet_Qty3 || null,
          priceGross: price.ItemPriceGross_Qty3 || price.itemPriceGross_Qty3 || null,
        },
        tier4: {
          quantity: price.Qty4 || price.qty4 || null,
          priceNet: price.ItemPriceNet_Qty4 || price.itemPriceNet_Qty4 || null,
          priceGross: price.ItemPriceGross_Qty4 || price.itemPriceGross_Qty4 || null,
        },
      },
      minimumOrderQuantity: price.MOQBlankOrder || price.moqBlankOrder || null,
      lastModified: price.ItemPriceLastModifiedDateTime || price.itemPriceLastModifiedDateTime || null,
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'xd-connects',
            count: formattedPrices.length,
            total: prices.length,
            prices: formattedPrices,
            filters: {
              itemCode: itemCode || null,
              search: search || null,
              limit,
            },
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            source: 'xd-connects',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

export async function handleGetMidoceanPrices(args: any) {
  const { productCode, search, environment = 'test', limit = 50 } = args;
  
  try {
    // Fetch prices from Midocean API
    const pricesData = await getMidoceanPricelist({ environment, format: 'json' });
    
    // Handle Midocean API response structure
    // The API returns: { PRICELIST_RESPONSE: { RETURN_STATUS, STATUS_TEXT, CUSTOMER_NUMBER, PRICELIST? } }
    let prices: any[] = [];
    let statusInfo: any = null;
    
    if (Array.isArray(pricesData)) {
      prices = pricesData;
    } else if (pricesData && typeof pricesData === 'object') {
      // Check for PRICELIST_RESPONSE structure
      if (pricesData.PRICELIST_RESPONSE) {
        const response = pricesData.PRICELIST_RESPONSE;
        statusInfo = {
          returnStatus: response.RETURN_STATUS || response.return_status,
          statusText: response.STATUS_TEXT || response.status_text,
          customerNumber: response.CUSTOMER_NUMBER || response.customer_number,
        };
        
        // Look for actual price data in PRICELIST array
        if (response.PRICELIST && Array.isArray(response.PRICELIST)) {
          prices = response.PRICELIST;
        } else if (response.Pricelist && Array.isArray(response.Pricelist)) {
          prices = response.Pricelist;
        } else if (response.pricelist && Array.isArray(response.pricelist)) {
          prices = response.pricelist;
        }
      } else {
        // Try common response structures - check nested objects too
        prices = pricesData.Prices || pricesData.prices || pricesData.data || pricesData.Products || pricesData.products || pricesData.items || 
                 pricesData.Pricelist || pricesData.pricelist || pricesData.PRICELIST || pricesData.result || pricesData.results || [];
        
        // If still not an array, check if it's an object with array-like properties
        if (!Array.isArray(prices)) {
          // Check if the object itself might be a price entry
          if (pricesData.ProductCode || pricesData.productCode || pricesData.Code || pricesData.code || pricesData.Price || pricesData.price) {
            prices = [pricesData];
          } else {
            // Try to find any array property
            const keys = Object.keys(pricesData);
            for (const key of keys) {
              if (Array.isArray(pricesData[key])) {
                prices = pricesData[key];
                break;
              }
            }
            // If still no array found, return empty
            if (!Array.isArray(prices)) {
              prices = [];
            }
          }
        }
      }
    }
    
    // Filter by productCode if provided
    if (productCode) {
      prices = prices.filter((p: any) => 
        (p.ProductCode || p.productCode || p.code || p.Code || '').toLowerCase() === productCode.toLowerCase()
      );
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      prices = prices.filter((p: any) => 
        (p.ProductName || p.productName || p.name || p.Name || '').toLowerCase().includes(searchLower) ||
        (p.ProductCode || p.productCode || p.code || p.Code || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Limit results
    const limitedPrices = prices.slice(0, limit);
    
    // Transform prices to a more readable format
    // Midocean API structure may vary, so we'll try to extract common fields
    const formattedPrices = limitedPrices.map((price: any) => ({
      productCode: price.ProductCode || price.productCode || price.code || price.Code || null,
      productName: price.ProductName || price.productName || price.name || price.Name || null,
      currency: price.Currency || price.currency || price.CurrencyCode || price.currencyCode || null,
      unitPrice: price.Price || price.price || price.UnitPrice || price.unitPrice || null,
      unitPriceNet: price.PriceNet || price.priceNet || price.NetPrice || price.netPrice || price.UnitPriceNet || price.unitPriceNet || null,
      unitPriceGross: price.PriceGross || price.priceGross || price.GrossPrice || price.grossPrice || price.UnitPriceGross || price.unitPriceGross || null,
      priceTiers: price.PriceTiers || price.priceTiers || price.Tiers || price.tiers || null,
      minimumOrderQuantity: price.MOQ || price.moq || price.MinimumOrderQuantity || price.minimumOrderQuantity || null,
      rawData: price, // Include raw data for reference
    }));
    
    // Include debug info to understand response structure
    const debugInfo: any = {
      responseType: Array.isArray(pricesData) ? 'array' : typeof pricesData,
      responseIsNull: pricesData === null || pricesData === undefined,
    };
    
    if (pricesData && typeof pricesData === 'object' && !Array.isArray(pricesData)) {
      debugInfo.responseKeys = Object.keys(pricesData).slice(0, 20);
      // Try to find array properties
      const arrayKeys = Object.keys(pricesData).filter(key => Array.isArray(pricesData[key]));
      if (arrayKeys.length > 0) {
        debugInfo.arrayProperties = arrayKeys;
        debugInfo.firstArrayLength = pricesData[arrayKeys[0]]?.length;
      }
      // Sample of response structure (first 1000 chars)
      try {
        debugInfo.sampleResponse = JSON.stringify(pricesData).substring(0, 1000);
      } catch (e) {
        debugInfo.sampleResponseError = 'Could not stringify response';
      }
    } else if (Array.isArray(pricesData)) {
      debugInfo.arrayLength = pricesData.length;
      if (pricesData.length > 0) {
        debugInfo.firstItemKeys = Object.keys(pricesData[0]).slice(0, 10);
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'midocean',
            endpoint: 'pricelist',
            environment,
            count: formattedPrices.length,
            total: prices.length,
            prices: formattedPrices,
            status: statusInfo,
            filters: {
              productCode: productCode || null,
              search: search || null,
              limit,
            },
            debug: debugInfo,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            source: 'midocean',
            endpoint: 'pricelist',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

export async function handleGetMidoceanPrintPrices(args: any) {
  const { productCode, search, environment = 'test', limit = 50 } = args;
  
  try {
    // Fetch print prices from Midocean API
    const pricesData = await getMidoceanPrintPricelist({ environment, format: 'json' });
    
    // Handle different response formats
    let prices: any[] = [];
    if (Array.isArray(pricesData)) {
      prices = pricesData;
    } else if (pricesData && typeof pricesData === 'object') {
      // Try common response structures
      prices = pricesData.Prices || pricesData.prices || pricesData.data || pricesData.Products || pricesData.products || pricesData.items || pricesData.PrintPrices || pricesData.printPrices || [];
      if (!Array.isArray(prices)) {
        // If it's a single object, wrap it in an array
        prices = [pricesData];
      }
    }
    
    // Filter by productCode if provided
    if (productCode) {
      prices = prices.filter((p: any) => 
        (p.ProductCode || p.productCode || p.code || p.Code || '').toLowerCase() === productCode.toLowerCase()
      );
    }
    
    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      prices = prices.filter((p: any) => 
        (p.ProductName || p.productName || p.name || p.Name || '').toLowerCase().includes(searchLower) ||
        (p.ProductCode || p.productCode || p.code || p.Code || '').toLowerCase().includes(searchLower)
      );
    }
    
    // Limit results
    const limitedPrices = prices.slice(0, limit);
    
    // Transform prices to a more readable format
    // Midocean Print Pricelist API structure may vary, so we'll try to extract common fields
    const formattedPrices = limitedPrices.map((price: any) => ({
      productCode: price.ProductCode || price.productCode || price.code || price.Code || null,
      productName: price.ProductName || price.productName || price.name || price.Name || null,
      currency: price.Currency || price.currency || price.CurrencyCode || price.currencyCode || null,
      printPrice: price.PrintPrice || price.printPrice || price.Price || price.price || null,
      printPriceNet: price.PrintPriceNet || price.printPriceNet || price.NetPrice || price.netPrice || null,
      printPriceGross: price.PrintPriceGross || price.printPriceGross || price.GrossPrice || price.grossPrice || null,
      priceTiers: price.PriceTiers || price.priceTiers || price.Tiers || price.tiers || price.PrintPriceTiers || price.printPriceTiers || null,
      minimumOrderQuantity: price.MOQ || price.moq || price.MinimumOrderQuantity || price.minimumOrderQuantity || null,
      rawData: price, // Include raw data for reference
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'midocean',
            endpoint: 'printpricelist',
            environment,
            count: formattedPrices.length,
            total: prices.length,
            prices: formattedPrices,
            filters: {
              productCode: productCode || null,
              search: search || null,
              limit,
            },
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
            source: 'midocean',
            endpoint: 'printpricelist',
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

export async function handleSyncXDConnectsPrices(args: any) {
  const { limit = 500, batchSize = 50 } = args;
  
  try {
    console.error(`[Sync XD Connects Prices] Starting sync with limit: ${limit}, batchSize: ${batchSize}`);
    
    // Fetch prices from XD Connects API
    const pricesData = await getXDConnectsProductPrices();
    
    // Handle different response formats
    let prices: any[] = [];
    if (Array.isArray(pricesData)) {
      prices = pricesData;
    } else if (pricesData && typeof pricesData === 'object') {
      prices = pricesData.Prices || pricesData.prices || pricesData.data || pricesData.Products || pricesData.products || [];
      if (!Array.isArray(prices)) {
        prices = [pricesData];
      }
    }
    
    console.error(`[Sync XD Connects Prices] Fetched ${prices.length} prices from API`);
    
    // Limit the number of prices to process
    const pricesToProcess = prices.slice(0, limit);
    console.error(`[Sync XD Connects Prices] Processing ${pricesToProcess.length} prices`);
    
    // Transform prices to database format
    const priceRecords = pricesToProcess.map((price: any) => {
      const itemCode = price.ItemCode || price.itemCode || '';
      const extractPrice = (val: any): number | null => {
        if (val == null || val === '') return null;
        const numVal = Number(val);
        return isNaN(numVal) ? null : numVal;
      };
      
      return {
        itemCode,
        currency: price.Currency || price.currency || null,
        priceTier1Qty: price.Qty1 != null ? Math.round(Number(price.Qty1)) : null,
        priceTier1Price: extractPrice(price.ItemPriceNet_Qty1),
        priceTier2Qty: price.Qty2 != null ? Math.round(Number(price.Qty2)) : null,
        priceTier2Price: extractPrice(price.ItemPriceNet_Qty2),
        priceTier3Qty: price.Qty3 != null ? Math.round(Number(price.Qty3)) : null,
        priceTier3Price: extractPrice(price.ItemPriceNet_Qty3),
        priceTier4Qty: price.Qty4 != null ? Math.round(Number(price.Qty4)) : null,
        priceTier4Price: extractPrice(price.ItemPriceNet_Qty4),
        priceTier5Qty: null,
        priceTier5Price: null,
        unitPrice: extractPrice(price.ItemPriceNet_Qty1),
        minimumOrderQuantity: price.MOQBlankOrder != null ? Math.round(Number(price.MOQBlankOrder)) : null,
        rawData: JSON.stringify(price),
      };
    }).filter((p: any) => p.itemCode); // Filter out records without itemCode
    
    console.error(`[Sync XD Connects Prices] Transformed ${priceRecords.length} price records`);
    
    // Use batch inserts for efficiency - process in batches
    let imported = 0;
    let errors = 0;
    
    // Get the underlying SQLite database instance for batch operations
    const dbPath = process.env.DATABASE_URL || './sqlite.db';
    const Database = (await import('better-sqlite3')).default;
    const sqliteDb = new Database(dbPath);
    
    // Prepare statement for INSERT OR REPLACE (upsert) - optimized for performance
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const stmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO product_prices (
        id, item_code, currency, price_tier1_qty, price_tier1_price,
        price_tier2_qty, price_tier2_price, price_tier3_qty, price_tier3_price,
        price_tier4_qty, price_tier4_price, price_tier5_qty, price_tier5_price,
        unit_price, minimum_order_quantity, raw_data, created_at, updated_at
      ) VALUES (
        COALESCE((SELECT id FROM product_prices WHERE item_code = ?), lower(hex(randomblob(16)))),
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        COALESCE((SELECT created_at FROM product_prices WHERE item_code = ?), ?),
        ?
      )
    `);
    
    // Process in batches using transactions
    for (let i = 0; i < priceRecords.length; i += batchSize) {
      const batch = priceRecords.slice(i, i + batchSize);
      
      // Use transaction for batch insert
      const insertBatch = sqliteDb.transaction((records: any[]) => {
        let batchImported = 0;
        let batchErrors = 0;
        
        for (const record of records) {
          try {
            stmt.run(
              record.itemCode, // for COALESCE check in id
              record.itemCode, // item_code
              record.currency,
              record.priceTier1Qty,
              record.priceTier1Price,
              record.priceTier2Qty,
              record.priceTier2Price,
              record.priceTier3Qty,
              record.priceTier3Price,
              record.priceTier4Qty,
              record.priceTier4Price,
              record.priceTier5Qty,
              record.priceTier5Price,
              record.unitPrice,
              record.minimumOrderQuantity,
              record.rawData,
              record.itemCode, // for COALESCE check in created_at
              now, // created_at if new
              now, // updated_at
            );
            batchImported++;
          } catch (error) {
            batchErrors++;
            console.error(`[Sync XD Connects Prices] Error inserting ${record.itemCode}:`, error);
          }
        }
        
        return { imported: batchImported, errors: batchErrors };
      });
      
      try {
        const result = insertBatch(batch);
        imported += result.imported;
        errors += result.errors;
        console.error(`[Sync XD Connects Prices] Batch ${Math.floor(i / batchSize) + 1} completed: ${result.imported} imported, ${result.errors} errors`);
      } catch (error) {
        errors += batch.length;
        console.error(`[Sync XD Connects Prices] Batch failed:`, error);
      }
    }
    
    sqliteDb.close();
    
    // Return minimal response code: OK:count or PARTIAL:imported:errors or ERROR:message
    const resultCode = errors === 0 ? `OK:${imported}` : `PARTIAL:${imported}:${errors}`;
    
    return {
      content: [
        {
          type: 'text',
          text: resultCode,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Sync XD Connects Prices] Error: ${errorMessage}`);
    return {
      content: [
        {
          type: 'text',
          text: `ERROR:${errorMessage.substring(0, 100)}`,
        },
      ],
      isError: true,
    };
  }
}

