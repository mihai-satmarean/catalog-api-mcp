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

// Helper function to safely parse decimal values
function parseDecimal(value: any): string | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? null : num.toString();
}

// Helper function to safely parse integer values
function parseIntSafe(value: any): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(num) ? null : num;
}

// Helper function to parse timestamp
function parseTimestamp(value: any): Date | null {
  if (!value) return null;
  try {
    return new Date(value);
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
  
  // Transform master product fields
  const transformed: any = {
    source: 'midocean',
    name: name.trim().substring(0, 255),
    description: product.long_description || product.longDescription || product.description || null,
    brand: product.brand || null,
    productCode: productCode,
    externalId: externalId,
    // Midocean master fields
    masterCode: masterCode,
    masterId: masterId,
    typeOfProducts: product.type_of_products || product.typeOfProducts || null,
    commodityCode: product.commodity_code || product.commodityCode || null,
    numberOfPrintPositions: product.number_of_print_positions || product.numberOfPrintPositions || null,
    productName: product.product_name || product.productName || null,
    categoryCode: product.category_code || product.categoryCode || null,
    productClass: product.product_class || product.productClass || null,
    // Dimensions
    length: parseDecimal(product.length),
    lengthUnit: product.length_unit || product.lengthUnit || null,
    width: parseDecimal(product.width),
    widthUnit: product.width_unit || product.widthUnit || null,
    height: parseDecimal(product.height),
    heightUnit: product.height_unit || product.heightUnit || null,
    dimensions: product.dimensions || null,
    // Volume
    volume: parseDecimal(product.volume),
    volumeUnit: product.volume_unit || product.volumeUnit || null,
    // Weight
    grossWeight: parseDecimal(product.gross_weight || product.grossWeight),
    grossWeightUnit: product.gross_weight_unit || product.grossWeightUnit || null,
    netWeight: parseDecimal(product.net_weight || product.netWeight),
    netWeightUnit: product.net_weight_unit || product.netWeightUnit || null,
    weight: parseDecimal(product.net_weight || product.netWeight), // For backward compatibility
    // Carton information
    innerCartonQuantity: parseIntSafe(product.inner_carton_quantity || product.innerCartonQuantity),
    outerCartonQuantity: parseIntSafe(product.outer_carton_quantity || product.outerCartonQuantity),
    cartonLength: parseDecimal(product.carton_length || product.cartonLength),
    cartonLengthUnit: product.carton_length_unit || product.cartonLengthUnit || null,
    cartonWidth: parseDecimal(product.carton_width || product.cartonWidth),
    cartonWidthUnit: product.carton_width_unit || product.cartonWidthUnit || null,
    cartonHeight: parseDecimal(product.carton_height || product.cartonHeight),
    cartonHeightUnit: product.carton_height_unit || product.cartonHeightUnit || null,
    cartonVolume: parseDecimal(product.carton_volume || product.cartonVolume),
    cartonVolumeUnit: product.carton_volume_unit || product.cartonVolumeUnit || null,
    cartonGrossWeight: parseDecimal(product.carton_gross_weight || product.cartonGrossWeight),
    cartonGrossWeightUnit: product.carton_gross_weight_unit || product.cartonGrossWeightUnit || null,
    // Descriptions
    shortDescription: product.short_description || product.shortDescription || null,
    longDescription: product.long_description || product.longDescription || null,
    // Material and packaging
    material: product.material || null,
    packagingAfterPrinting: product.packaging_after_printing || product.packagingAfterPrinting || null,
    printable: product.printable || null,
    // Additional metadata
    countryOfOrigin: product.country_of_origin || product.countryOfOrigin || null,
    timestamp: parseTimestamp(product.timestamp),
    // Images - use main image from first variant if available
    imageUrl: mainImageUrl || product.imageUrl || product.image || null,
    // Store raw data for flexibility
    rawData: JSON.stringify(product),
  };

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
        const digitalAssets = transformed.digitalAssets;
        
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
            const [updated] = await db
              .update(products)
              .set({
                ...transformedProduct,
                updatedAt: new Date(),
              })
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
            
            const [inserted] = await db
              .insert(products)
              .values(transformedProduct)
              .returning();
            savedProduct = inserted;
            savedProducts.push(inserted);
          } catch (insertError: any) {
            // Log detailed error for debugging
            const errorMessage = insertError?.message || String(insertError);
            const errorCode = insertError?.code;
            
            console.error('Database insert error:', {
              error: errorMessage,
              errorCode: errorCode,
              product: {
                name: transformedProduct.name,
                source: transformedProduct.source,
                productCode: transformedProduct.productCode,
                externalId: transformedProduct.externalId,
                hasDescription: !!transformedProduct.description,
                hasBrand: !!transformedProduct.brand,
              },
              originalProductKeys: Object.keys(product),
              originalProductSample: Object.keys(product).slice(0, 5).reduce((acc: any, key) => {
                const val = product[key];
                acc[key] = typeof val === 'object' ? '[Object]' : String(val).substring(0, 100);
                return acc;
              }, {}),
            });
            throw insertError;
          }
        }

        // Save variants and digital assets
        if (savedProduct) {
          // Delete existing variants and assets for this product
          await db.delete(digitalAssets).where(eq(digitalAssets.productId, savedProduct.id));
          await db.delete(productVariants).where(eq(productVariants.productId, savedProduct.id));

          // Save variants
          const variantIdMap: Record<string, string> = {}; // Maps variantId from API to database UUID
          for (const variant of variants) {
            // Save variant if it has variantId (SKU is optional, some variants might only have images)
            if (variant.variantId) {
              try {
                const [savedVariant] = await db
                  .insert(productVariants)
                  .values({
                    ...variant,
                    productId: savedProduct.id,
                  })
                  .returning();
                variantIdMap[variant.variantId] = savedVariant.id;
                console.log(`Saved variant ${variant.variantId} -> ${savedVariant.id} for product ${savedProduct.id}`);
              } catch (variantError) {
                console.error('Error saving variant:', variantError, variant);
              }
            } else {
              console.warn('Skipping variant without variantId:', variant);
            }
          }

          // Save digital assets
          console.log(`Saving ${digitalAssets.length} digital assets for product ${savedProduct.id}`, {
            variantIdMap,
            assets: digitalAssets.map(a => ({
              url: a.url,
              variantId: a.variantId,
              type: a.type,
              subtype: a.subtype,
            })),
          });
          
          for (const asset of digitalAssets) {
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

