import { NextRequest, NextResponse } from 'next/server';
import { db, products, productVariants, digitalAssets } from '@/db';
import { insertProductSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/products/[id] - Get a specific product with variants and digital assets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.select().from(products).where(eq(products.id, id));
    
    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const productData = product[0];
    
    // Fetch variants for this product
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, id));
    
    // Fetch digital assets for this product
    const assets = await db
      .select()
      .from(digitalAssets)
      .where(eq(digitalAssets.productId, id));
    
    // Group assets by variant
    const assetsByVariant: Record<string, any[]> = {};
    const masterAssets: any[] = [];
    const orphanAssets: any[] = []; // Assets linked to variants that don't exist
    
    // Create a set of variant IDs for quick lookup
    const variantIds = new Set(variants.map(v => v.id));
    
    assets.forEach(asset => {
      if (asset.variantId) {
        // Check if the variant exists
        if (variantIds.has(asset.variantId)) {
          if (!assetsByVariant[asset.variantId]) {
            assetsByVariant[asset.variantId] = [];
          }
          assetsByVariant[asset.variantId].push(asset);
        } else {
          // Asset is linked to a variant that doesn't exist - treat as orphan
          console.warn(`Asset ${asset.id} is linked to non-existent variant ${asset.variantId}`);
          orphanAssets.push(asset);
        }
      } else {
        masterAssets.push(asset);
      }
    });
    
    // Attach assets to variants
    let variantsWithAssets = variants.map(variant => ({
      ...variant,
      digitalAssets: assetsByVariant[variant.id] || [],
    }));
    
    // Include orphan assets in master assets so they're still displayed
    let allMasterAssets = [...masterAssets, ...orphanAssets];
    
    // Debug logging - also check rawData if available
    let rawDataParsed = null;
    if (productData.rawData) {
      try {
        rawDataParsed = JSON.parse(productData.rawData);
        console.log('Raw product data structure:', {
          hasVariants: !!rawDataParsed.variants,
          variantsCount: rawDataParsed.variants?.length || 0,
          firstVariant: rawDataParsed.variants?.[0] ? {
            variantId: rawDataParsed.variants[0].variant_id || rawDataParsed.variants[0].variantId,
            hasDigitalAssets: !!(rawDataParsed.variants[0].digital_assets || rawDataParsed.variants[0].digitalAssets),
            digitalAssetsCount: (rawDataParsed.variants[0].digital_assets || rawDataParsed.variants[0].digitalAssets)?.length || 0,
          } : null,
          masterDigitalAssets: rawDataParsed.digital_assets || rawDataParsed.digitalAssets,
        });
        
        // Fallback: If no variants/assets in database but they exist in rawData, extract them
        if (variants.length === 0 && rawDataParsed.variants && Array.isArray(rawDataParsed.variants) && rawDataParsed.variants.length > 0) {
          console.log('⚠️ No variants in database, extracting from rawData as fallback');
          variantsWithAssets = rawDataParsed.variants.map((variant: any) => {
            const variantAssets = variant.digital_assets || variant.digitalAssets || [];
            return {
              id: `temp-${variant.variant_id || variant.variantId || Date.now()}`,
              variantId: variant.variant_id || variant.variantId || null,
              sku: variant.sku || variant.SKU || null,
              colorDescription: variant.color_description || variant.colorDescription || null,
              colorGroup: variant.color_group || variant.colorGroup || null,
              digitalAssets: variantAssets.map((asset: any) => ({
                id: `temp-asset-${Date.now()}-${Math.random()}`,
                url: asset.url || null,
                urlHighRes: asset.url_highress || asset.url_highres || asset.urlHighRes || null,
                type: asset.type || null,
                subtype: asset.subtype || null,
              })),
            };
          });
        }
        
        // Fallback: Extract master-level digital assets from rawData if not in database
        if (allMasterAssets.length === 0 && (rawDataParsed.digital_assets || rawDataParsed.digitalAssets)) {
          console.log('⚠️ No master assets in database, extracting from rawData as fallback');
          const masterAssetsFromRaw = rawDataParsed.digital_assets || rawDataParsed.digitalAssets || [];
          allMasterAssets = masterAssetsFromRaw.map((asset: any) => ({
            id: `temp-master-${Date.now()}-${Math.random()}`,
            url: asset.url || null,
            urlHighRes: asset.url_highress || asset.url_highres || asset.urlHighRes || null,
            type: asset.type || null,
            subtype: asset.subtype || null,
          }));
        }
      } catch (e) {
        console.error('Error parsing rawData:', e);
      }
    }
    
    console.log('Product API Response:', {
      productId: id,
      productName: productData.name,
      masterCode: productData.masterCode,
      externalId: productData.externalId,
      productCode: productData.productCode,
      source: productData.source,
      variantsCount: variants.length,
      variantIds: variants.map(v => v.id),
      variantsWithAssets: variantsWithAssets.map(v => ({
        id: v.id,
        variantId: v.variantId,
        sku: v.sku,
        assetsCount: assetsByVariant[v.id]?.length || 0,
        assets: assetsByVariant[v.id]?.map(a => ({ type: a.type, subtype: a.subtype, url: a.url })),
      })),
      masterAssetsCount: allMasterAssets.length,
      orphanAssetsCount: orphanAssets.length,
      allAssetsCount: assets.length,
      assetsByVariantKeys: Object.keys(assetsByVariant),
      allAssets: assets.map(a => ({
        id: a.id,
        variantId: a.variantId,
        type: a.type,
        subtype: a.subtype,
        url: a.url,
        urlHighRes: a.urlHighRes,
      })),
      hasRawData: !!productData.rawData,
    });
    
    return NextResponse.json({
      ...productData,
      variants: variantsWithAssets,
      digitalAssets: allMasterAssets,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = insertProductSchema.parse(body);
    
    const updatedProduct = await db
      .update(products)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    
    if (updatedProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedProduct = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    
    if (deletedProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

