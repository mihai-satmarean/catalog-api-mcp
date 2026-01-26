import { NextRequest, NextResponse } from 'next/server';
import { getProducts, type MidoceanEnvironment } from '@/lib/providers/midocean/client';
import { db, products, productVariants, digitalAssets } from '@/db';
import { eq, and } from 'drizzle-orm';

// Helper function to safely get nested property with multiple possible keys
function getProperty(obj: any, ...keys: string[]): any {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return null;
}

// Helper function to safely parse decimal values (returns number for real fields)
function parseDecimal(value: any): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

// Helper function to safely parse integer values
function parseIntSafe(value: any): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(num) ? null : num;
}

// Helper function to parse timestamp and return Date object (Drizzle mode: 'timestamp' expects Date objects)
function parseTimestamp(value: any): Date | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Helper function to transform midocean product data to database format
function transformMidoceanProduct(product: any): { product: any; variants: any[]; digitalAssets: any[] } {
  // Extract master-level fields
  const masterCode = product.master_code || product.masterCode || null;
  const masterId = product.master_id || product.masterId || product.masterID || null;
  const productCode = masterCode || getProperty(product, 'productCode', 'ProductCode', 'code', 'Code', 'sku', 'SKU') || null;
  const externalId = masterId || getProperty(product, 'id', 'Id', 'productId', 'ProductId', 'externalId', 'ExternalId') || null;
  
  // Try to extract name from many possible field variations
  let name = getProperty(
    product, 
    'product_name', 'productName', 'ProductName',
    'name', 'Name', 
    'title', 'Title', 
    'shortDescription', 'short_description', 'ShortDescription',
    'displayName', 'DisplayName'
  );
  
  // If name is still empty, use fallbacks
  if (!name || name.trim() === '') {
    if (productCode) {
      name = productCode;
    } else if (externalId) {
      name = `Midocean Product ${externalId}`;
    } else {
      name = `Product ${Date.now()}`;
    }
  }

  // Extract main image from variants if available
  let mainImageUrl = null;
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const firstVariant = product.variants[0];
    if (firstVariant.digital_assets || firstVariant.digitalAssets) {
      const assets = firstVariant.digital_assets || firstVariant.digitalAssets;
      const frontImage = assets.find((a: any) => 
        (a.subtype === 'item_picture_front' || a.subtype === 'itemPictureFront') && a.url
      );
      if (frontImage) {
        mainImageUrl = frontImage.url;
      }
    }
  }
  
  // Helper function to sanitize string values (remove null/undefined, trim, limit length)
  function sanitizeString(value: any, maxLength?: number): string | null {
    if (value == null || value === '') return null;
    const str = String(value).trim();
    if (str === '') return null;
    return maxLength ? str.substring(0, maxLength) : str;
  }

  // Transform master product fields - only include fields that exist in schema
  const transformed: any = {
    source: 'midocean',
    name: name.trim().substring(0, 255),
    description: sanitizeString(product.long_description || product.longDescription || product.description),
    brand: sanitizeString(product.brand),
    productCode: sanitizeString(productCode),
    externalId: sanitizeString(externalId),
    // Midocean master fields
    masterCode: sanitizeString(masterCode),
    masterId: sanitizeString(masterId),
    typeOfProducts: sanitizeString(product.type_of_products || product.typeOfProducts),
    commodityCode: sanitizeString(product.commodity_code || product.commodityCode),
    numberOfPrintPositions: sanitizeString(product.number_of_print_positions || product.numberOfPrintPositions),
    productName: sanitizeString(product.product_name || product.productName),
    categoryCode: sanitizeString(product.category_code || product.categoryCode),
    productClass: sanitizeString(product.product_class || product.productClass),
    // Dimensions
    length: parseDecimal(product.length),
    lengthUnit: sanitizeString(product.length_unit || product.lengthUnit),
    width: parseDecimal(product.width),
    widthUnit: sanitizeString(product.width_unit || product.widthUnit),
    height: parseDecimal(product.height),
    heightUnit: sanitizeString(product.height_unit || product.heightUnit),
    dimensions: sanitizeString(product.dimensions),
    // Volume
    volume: parseDecimal(product.volume),
    volumeUnit: sanitizeString(product.volume_unit || product.volumeUnit),
    // Weight
    grossWeight: parseDecimal(product.gross_weight || product.grossWeight),
    grossWeightUnit: sanitizeString(product.gross_weight_unit || product.grossWeightUnit),
    netWeight: parseDecimal(product.net_weight || product.netWeight),
    netWeightUnit: sanitizeString(product.net_weight_unit || product.netWeightUnit),
    weight: parseDecimal(product.net_weight || product.netWeight), // For backward compatibility
    // Carton information
    innerCartonQuantity: parseIntSafe(product.inner_carton_quantity || product.innerCartonQuantity),
    outerCartonQuantity: parseIntSafe(product.outer_carton_quantity || product.outerCartonQuantity),
    cartonLength: parseDecimal(product.carton_length || product.cartonLength),
    cartonLengthUnit: sanitizeString(product.carton_length_unit || product.cartonLengthUnit),
    cartonWidth: parseDecimal(product.carton_width || product.cartonWidth),
    cartonWidthUnit: sanitizeString(product.carton_width_unit || product.cartonWidthUnit),
    cartonHeight: parseDecimal(product.carton_height || product.cartonHeight),
    cartonHeightUnit: sanitizeString(product.carton_height_unit || product.cartonHeightUnit),
    cartonVolume: parseDecimal(product.carton_volume || product.cartonVolume),
    cartonVolumeUnit: sanitizeString(product.carton_volume_unit || product.cartonVolumeUnit),
    cartonGrossWeight: parseDecimal(product.carton_gross_weight || product.cartonGrossWeight),
    cartonGrossWeightUnit: sanitizeString(product.carton_gross_weight_unit || product.cartonGrossWeightUnit),
    // Descriptions
    shortDescription: sanitizeString(product.short_description || product.shortDescription),
    longDescription: sanitizeString(product.long_description || product.longDescription),
    // Material and packaging
    material: sanitizeString(product.material),
    packagingAfterPrinting: sanitizeString(product.packaging_after_printing || product.packagingAfterPrinting),
    printable: sanitizeString(product.printable),
    // Additional metadata
    countryOfOrigin: sanitizeString(product.country_of_origin || product.countryOfOrigin),
    timestamp: parseTimestamp(product.timestamp),
    // Images - use main image from first variant if available
    imageUrl: sanitizeString(mainImageUrl || product.imageUrl || product.image),
    // Store raw data for flexibility - ensure it's a valid JSON string
    rawData: (() => {
      try {
        const jsonStr = JSON.stringify(product);
        // Limit size to prevent issues (SQLite TEXT can handle large strings, but let's be safe)
        return jsonStr.length > 1000000 ? jsonStr.substring(0, 1000000) : jsonStr;
      } catch (e) {
        console.warn('Failed to stringify product for rawData:', e);
        return null;
      }
    })(),
  };

  // Remove undefined values to avoid SQL issues
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });

  // Extract variants
  const variants: any[] = [];
  const allDigitalAssets: any[] = [];
  
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((variant: any) => {
      const variantData = {
        variantId: variant.variant_id || variant.variantId || null,
        sku: variant.sku || variant.SKU || null,
        releaseDate: parseTimestamp(variant.release_date || variant.releaseDate),
        discontinuedDate: parseTimestamp(variant.discontinued_date || variant.discontinuedDate),
        productPropositionCategory: variant.product_proposition_category || variant.productPropositionCategory || null,
        categoryLevel1: variant.category_level1 || variant.categoryLevel1 || null,
        categoryLevel2: variant.category_level2 || variant.categoryLevel2 || null,
        categoryLevel3: variant.category_level3 || variant.categoryLevel3 || null,
        colorDescription: variant.color_description || variant.colorDescription || null,
        colorGroup: variant.color_group || variant.colorGroup || null,
        plcStatus: variant.plc_status || variant.plcStatus || null,
        plcStatusDescription: variant.plc_status_description || variant.plcStatusDescription || null,
        gtin: variant.gtin || variant.GTIN || null,
        colorCode: variant.color_code || variant.colorCode || null,
        pmsColor: variant.pms_color || variant.pmsColor || null,
      };
      variants.push(variantData);

      // Extract digital assets for this variant
      const variantAssets = variant.digital_assets || variant.digitalAssets || [];
      if (variantAssets.length > 0) {
        console.log(`Extracting ${variantAssets.length} digital assets for variant ${variantData.variantId || variantData.sku || 'unknown'}:`, {
          variantId: variantData.variantId,
          sku: variantData.sku,
          assets: variantAssets.map((a: any) => ({
            url: a.url,
            url_highress: a.url_highress,
            type: a.type,
            subtype: a.subtype,
          })),
        });
      }
      variantAssets.forEach((asset: any) => {
        allDigitalAssets.push({
          variantId: variantData.variantId, // We'll link this after variant is saved
          url: asset.url || null,
          urlHighRes: asset.url_highress || asset.urlHighRes || asset.url_highres || null,
          type: asset.type || null,
          subtype: asset.subtype || null,
        });
      });
    });
  }

  // Extract master-level digital assets (documents)
  const masterAssets = product.digital_assets || product.digitalAssets || [];
  masterAssets.forEach((asset: any) => {
    allDigitalAssets.push({
      url: asset.url || null,
      urlHighRes: asset.url_highress || asset.urlHighRes || asset.url_highres || null,
      type: asset.type || null,
      subtype: asset.subtype || null,
    });
  });

  return {
    product: transformed,
    variants,
    digitalAssets: allDigitalAssets,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const environment = (searchParams.get('environment') || 'test') as MidoceanEnvironment;
    
    const data = await getProducts({
      environment,
      format: 'json',
    });
    
    // Log the response structure for debugging
    console.log('Midocean API response structure:', {
      isArray: Array.isArray(data),
      type: typeof data,
      keys: data && typeof data === 'object' ? Object.keys(data) : null,
      firstLevelStructure: data && typeof data === 'object' && !Array.isArray(data) 
        ? Object.keys(data).reduce((acc: any, key) => {
            const value = data[key];
            acc[key] = {
              type: typeof value,
              isArray: Array.isArray(value),
              length: Array.isArray(value) ? value.length : undefined,
              sampleKeys: value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).slice(0, 5) : undefined,
            };
            return acc;
          }, {})
        : null,
    });
    
    // Handle different response structures
    let productsArray: any[] = [];
    
    if (Array.isArray(data)) {
      productsArray = data;
      console.log('Products found as direct array:', productsArray.length);
    } else if (data && typeof data === 'object') {
      // Check for common response wrapper structures
      if (Array.isArray(data.products)) {
        productsArray = data.products;
        console.log('Products found in data.products:', productsArray.length);
      } else if (Array.isArray(data.data)) {
        productsArray = data.data;
        console.log('Products found in data.data:', productsArray.length);
      } else if (Array.isArray(data.items)) {
        productsArray = data.items;
        console.log('Products found in data.items:', productsArray.length);
      } else if (Array.isArray(data.results)) {
        productsArray = data.results;
        console.log('Products found in data.results:', productsArray.length);
      } else if (Array.isArray(data.ProductList)) {
        productsArray = data.ProductList;
        console.log('Products found in data.ProductList:', productsArray.length);
      } else if (Array.isArray(data.productList)) {
        productsArray = data.productList;
        console.log('Products found in data.productList:', productsArray.length);
      } else {
        // If it's a single product object, wrap it in an array
        console.log('Treating response as single product object');
        productsArray = [data];
      }
    }
    
    if (productsArray.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data,
        saved: 0,
        message: 'No products found in API response'
      });
    }

    console.log(`Processing ${productsArray.length} product(s) from Midocean API`);

    const savedProducts = [];
    const errors: Array<{ productCode: string; error: string }> = [];
    const skipped: Array<{ productCode: string; reason: string }> = [];
    
    // Log first few product structures for debugging
    if (productsArray.length > 0) {
      console.log('=== Midocean API Response Analysis ===');
      console.log('Total products received:', productsArray.length);
      console.log('First product structure:', JSON.stringify(productsArray[0], null, 2));
      
      // Analyze field names across first 5 products
      const fieldAnalysis: Record<string, number> = {};
      productsArray.slice(0, 5).forEach((product, index) => {
        Object.keys(product).forEach(key => {
          fieldAnalysis[key] = (fieldAnalysis[key] || 0) + 1;
        });
      });
      console.log('Field frequency in first 5 products:', fieldAnalysis);
      
      // Show sample values for common fields
      const sampleProduct = productsArray[0];
      console.log('Sample field values:', {
        id: sampleProduct.id || sampleProduct.Id || sampleProduct.ID,
        name: sampleProduct.name || sampleProduct.Name || sampleProduct.productName,
        code: sampleProduct.code || sampleProduct.Code || sampleProduct.productCode || sampleProduct.sku,
        brand: sampleProduct.brand || sampleProduct.Brand,
        category: sampleProduct.category || sampleProduct.Category,
      });
    }
    
    for (const product of productsArray) {
      try {
        const transformed = transformMidoceanProduct(product);
        const transformedProduct = transformed.product;
        const variants = transformed.variants;
        const assetsToSave = transformed.digitalAssets; // Renamed to avoid conflict with table import
        
        // Double-check that we have a valid name (should never be empty after transformation)
        if (!transformedProduct.name || transformedProduct.name.trim() === '') {
          const productCode = transformedProduct.productCode || transformedProduct.externalId || 'unknown';
          skipped.push({ productCode, reason: 'Name extraction failed - this should not happen' });
          console.error('CRITICAL: Product transformation failed to extract name. Product structure:', {
            keys: Object.keys(product),
            sampleValues: Object.keys(product).slice(0, 10).reduce((acc: any, key) => {
              acc[key] = typeof product[key] === 'object' ? '[Object]' : String(product[key]).substring(0, 50);
              return acc;
            }, {}),
            transformed: transformedProduct,
          });
          continue;
        }
        
        // Ensure name doesn't exceed varchar(255) limit
        if (transformedProduct.name.length > 255) {
          transformedProduct.name = transformedProduct.name.substring(0, 252) + '...';
        }

        // Try to find existing product by externalId or productCode
        let existing = null;
        if (transformedProduct.externalId) {
          const found = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.source, 'midocean'),
                eq(products.externalId, transformedProduct.externalId)
              )
            )
            .limit(1);
          if (found.length > 0) {
            existing = found[0];
          }
        }
        
        if (!existing && transformedProduct.productCode) {
          const found = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.source, 'midocean'),
                eq(products.productCode, transformedProduct.productCode)
              )
            )
            .limit(1);
          if (found.length > 0) {
            existing = found[0];
          }
        }

        let savedProduct;
        if (existing) {
          // Update existing product
          try {
            // Filter to only include fields that exist in the schema
            const validFields = [
              'source', 'name', 'description', 'price', 'brand', 'productCode', 'externalId',
              'category', 'subCategory', 'material', 'color', 'length', 'width', 'height',
              'dimensions', 'weight', 'imageUrl', 'imageUrls', 'countryOfOrigin', 'eanCode',
              'masterCode', 'masterId', 'typeOfProducts', 'commodityCode', 'numberOfPrintPositions',
              'productName', 'categoryCode', 'productClass', 'lengthUnit', 'widthUnit', 'heightUnit',
              'volume', 'volumeUnit', 'grossWeight', 'grossWeightUnit', 'netWeight', 'netWeightUnit',
              'innerCartonQuantity', 'outerCartonQuantity', 'cartonLength', 'cartonLengthUnit',
              'cartonWidth', 'cartonWidthUnit', 'cartonHeight', 'cartonHeightUnit', 'cartonVolume',
              'cartonVolumeUnit', 'cartonGrossWeight', 'cartonGrossWeightUnit', 'shortDescription',
              'longDescription', 'packagingAfterPrinting', 'printable', 'timestamp', 'rawData'
            ];
            
            const sanitizedProduct: any = {};
            
            validFields.forEach(field => {
              const value = transformedProduct[field];
              if (value !== null && value !== undefined) {
                // Handle Date objects
                if (value instanceof Date) {
                  sanitizedProduct[field] = value;
                } else if (typeof value === 'string') {
                  sanitizedProduct[field] = String(value);
                } else if (typeof value === 'number' && isFinite(value)) {
                  sanitizedProduct[field] = value;
                } else if (typeof value === 'boolean') {
                  sanitizedProduct[field] = value;
                }
              }
            });
            
            // Set updatedAt - let Drizzle handle the Date conversion
            sanitizedProduct.updatedAt = new Date();
            
            const [updated] = await db
              .update(products)
              .set(sanitizedProduct)
              .where(eq(products.id, existing.id))
              .returning();
            savedProduct = updated;
            savedProducts.push(updated);
          } catch (updateError) {
            console.error('Database update error:', {
              error: updateError,
              productId: existing.id,
              transformedProduct,
            });
            throw updateError;
          }
        } else {
          // Insert new product
          try {
            // Validate required fields before insert
            if (!transformedProduct.name || transformedProduct.name.trim() === '') {
              throw new Error('Name is required but is empty');
            }
            
            // Filter to only include fields that exist in the schema
            // Exclude fields with defaults (createdAt, updatedAt) - let the database handle them
            const validFields = [
              'source', 'name', 'description', 'price', 'brand', 'productCode', 'externalId',
              'category', 'subCategory', 'material', 'color', 'length', 'width', 'height',
              'dimensions', 'weight', 'imageUrl', 'imageUrls', 'countryOfOrigin', 'eanCode',
              'masterCode', 'masterId', 'typeOfProducts', 'commodityCode', 'numberOfPrintPositions',
              'productName', 'categoryCode', 'productClass', 'lengthUnit', 'widthUnit', 'heightUnit',
              'volume', 'volumeUnit', 'grossWeight', 'grossWeightUnit', 'netWeight', 'netWeightUnit',
              'innerCartonQuantity', 'outerCartonQuantity', 'cartonLength', 'cartonLengthUnit',
              'cartonWidth', 'cartonWidthUnit', 'cartonHeight', 'cartonHeightUnit', 'cartonVolume',
              'cartonVolumeUnit', 'cartonGrossWeight', 'cartonGrossWeightUnit', 'shortDescription',
              'longDescription', 'packagingAfterPrinting', 'printable', 'timestamp', 'rawData'
            ];
            
            const sanitizedProduct: any = {};
            validFields.forEach(field => {
              const value = transformedProduct[field];
              if (value !== null && value !== undefined) {
                // Handle Date objects
                if (value instanceof Date) {
                  sanitizedProduct[field] = value;
                } else if (typeof value === 'string') {
                  sanitizedProduct[field] = String(value);
                } else if (typeof value === 'number' && isFinite(value)) {
                  sanitizedProduct[field] = value;
                } else if (typeof value === 'boolean') {
                  sanitizedProduct[field] = value;
                }
              }
            });
            
            const [inserted] = await db
              .insert(products)
              .values(sanitizedProduct)
              .returning();
            savedProduct = inserted;
            savedProducts.push(inserted);
          } catch (insertError: any) {
            // Log detailed error for debugging
            const errorMessage = insertError?.message || String(insertError);
            const errorCode = insertError?.code;
            
            // Check for problematic values
            const problematicFields: any = {};
            Object.keys(transformedProduct).forEach(key => {
              const val = transformedProduct[key];
              if (val !== null && val !== undefined) {
                if (typeof val === 'object' && !(val instanceof Date)) {
                  problematicFields[key] = `Object: ${JSON.stringify(val).substring(0, 100)}`;
                } else if (typeof val === 'function') {
                  problematicFields[key] = 'Function';
                } else if (String(val).includes('(') && String(val).includes(')')) {
                  problematicFields[key] = `Contains parentheses: ${String(val).substring(0, 100)}`;
                }
              }
            });
            
            console.error('Database insert error:', {
              error: errorMessage,
              errorCode: errorCode,
              problematicFields,
              transformedProductKeys: Object.keys(transformedProduct),
              transformedProductSample: Object.keys(transformedProduct).slice(0, 15).reduce((acc: any, key) => {
                const val = transformedProduct[key];
                if (val instanceof Date) {
                  acc[key] = `Date(${val.toISOString()})`;
                } else if (val === null || val === undefined) {
                  acc[key] = val;
                } else if (typeof val === 'object') {
                  acc[key] = `[Object]`;
                } else {
                  acc[key] = typeof val === 'string' ? val.substring(0, 100) : val;
                }
                return acc;
              }, {}),
            });
            throw insertError;
          }
        }

        // Save variants and digital assets
        if (savedProduct) {
          try {
            // Delete existing variants and assets for this product
            // Note: digitalAssets and productVariants are imported tables, not the local arrays
            console.log('Deleting existing variants and assets for product:', savedProduct.id);
            await db.delete(digitalAssets).where(eq(digitalAssets.productId, savedProduct.id));
            await db.delete(productVariants).where(eq(productVariants.productId, savedProduct.id));
            console.log('Successfully deleted existing variants and assets');
          } catch (deleteError: any) {
            console.error('Error deleting existing variants/assets:', {
              error: deleteError?.message,
              productId: savedProduct.id,
              errorCode: deleteError?.code,
              stack: deleteError?.stack,
            });
            // Continue anyway - they might not exist or there might be a constraint issue
          }

          // Save variants
          const variantIdMap: Record<string, string> = {}; // Maps variantId from API to database UUID
          for (const variant of variants) {
            // Save variant if it has variantId (SKU is optional, some variants might only have images)
            if (variant.variantId) {
              try {
                // Sanitize variant data - only include valid fields
                const sanitizedVariant: any = {
                  productId: savedProduct.id,
                  variantId: variant.variantId || null,
                  sku: variant.sku || null,
                  releaseDate: variant.releaseDate instanceof Date ? variant.releaseDate : null,
                  discontinuedDate: variant.discontinuedDate instanceof Date ? variant.discontinuedDate : null,
                  productPropositionCategory: variant.productPropositionCategory || null,
                  categoryLevel1: variant.categoryLevel1 || null,
                  categoryLevel2: variant.categoryLevel2 || null,
                  categoryLevel3: variant.categoryLevel3 || null,
                  colorDescription: variant.colorDescription || null,
                  colorGroup: variant.colorGroup || null,
                  plcStatus: variant.plcStatus || null,
                  plcStatusDescription: variant.plcStatusDescription || null,
                  gtin: variant.gtin || null,
                  colorCode: variant.colorCode || null,
                  pmsColor: variant.pmsColor || null,
                };
                
                // Remove undefined and null values
                Object.keys(sanitizedVariant).forEach(key => {
                  if (sanitizedVariant[key] === undefined || sanitizedVariant[key] === null) {
                    delete sanitizedVariant[key];
                  }
                });
                
                const [savedVariant] = await db
                  .insert(productVariants)
                  .values(sanitizedVariant)
                  .returning();
                variantIdMap[variant.variantId] = savedVariant.id;
                console.log(`Saved variant ${variant.variantId} -> ${savedVariant.id} for product ${savedProduct.id}`);
              } catch (variantError: any) {
                console.error('Error saving variant:', {
                  error: variantError?.message || String(variantError),
                  variant: variant,
                });
              }
            } else {
              console.warn('Skipping variant without variantId:', variant);
            }
          }

          // Save digital assets
          console.log(`Saving ${assetsToSave.length} digital assets for product ${savedProduct.id}`, {
            variantIdMap,
            assets: assetsToSave.map(a => ({
              url: a.url,
              variantId: a.variantId,
              type: a.type,
              subtype: a.subtype,
            })),
          });
          
          for (const asset of assetsToSave) {
            if (asset.url) {
              try {
                const dbVariantId = asset.variantId && variantIdMap[asset.variantId] ? variantIdMap[asset.variantId] : null;
                const [savedAsset] = await db.insert(digitalAssets).values({
                  url: asset.url,
                  urlHighRes: asset.urlHighRes || null,
                  type: asset.type || null,
                  subtype: asset.subtype || null,
                  productId: savedProduct.id,
                  variantId: dbVariantId,
                }).returning();
                console.log(`Saved digital asset: ${savedAsset.id} (type: ${asset.type}, subtype: ${asset.subtype}, variantId: ${dbVariantId})`);
              } catch (assetError) {
                console.error('Error saving digital asset:', assetError, asset);
              }
            } else {
              console.warn('Skipping asset without URL:', asset);
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        const productCode = product.master_code || product.masterCode || product.productCode || product.ProductCode || product.code || product.sku || product.id || 'unknown';
        console.error(`Error processing midocean product ${productCode}:`, {
          error: errorMessage,
          stack: errorStack,
          productKeys: Object.keys(product),
        });
        errors.push({ productCode, error: errorMessage });
      }
    }

    return NextResponse.json({ 
      success: true, 
      data,
      saved: savedProducts.length,
      total: productsArray.length,
      skipped: skipped.length > 0 ? skipped.slice(0, 10) : undefined, // Show first 10 skipped items
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Show first 10 errors
      errorCount: errors.length,
      skippedCount: skipped.length,
      message: `Successfully saved ${savedProducts.length} of ${productsArray.length} midocean products to database${errors.length > 0 ? ` (${errors.length} errors)` : ''}${skipped.length > 0 ? ` (${skipped.length} skipped)` : ''}`
    });
  } catch (error) {
    console.error('Error fetching midocean product data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

