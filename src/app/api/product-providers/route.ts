import { NextRequest, NextResponse } from 'next/server';
import { db, productProviders, products } from '@/db';
import { eq, or, ilike, and } from 'drizzle-orm';

// Helper function to transform midocean product to ProductProvider format
function transformMidoceanProduct(product: any): any {
  // Try to extract from rawData if fields are missing (for products synced before these fields were added)
  let productName = product.productName;
  let categoryCode = product.categoryCode;
  let productClass = product.productClass;
  
  if ((!productName || !categoryCode || !productClass) && product.rawData) {
    try {
      const rawData = typeof product.rawData === 'string' ? JSON.parse(product.rawData) : product.rawData;
      productName = productName || rawData.product_name || rawData.productName || null;
      categoryCode = categoryCode || rawData.category_code || rawData.categoryCode || null;
      productClass = productClass || rawData.product_class || rawData.productClass || null;
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return {
    id: product.id,
    itemCode: product.productCode || product.externalId || product.id,
    itemName: product.name,
    brand: product.brand || 'midocean',
    mainCategory: product.category,
    subCategory: product.subCategory,
    color: product.color,
    modelCode: product.productCode,
    productLifeCycle: null, // Midocean products don't have this field
    longDescription: product.description,
    material: product.material,
    countryOfOrigin: product.countryOfOrigin,
    eanCode: product.eanCode,
    // Midocean-specific fields (with fallback to rawData)
    productName: productName || null,
    categoryCode: categoryCode || null,
    productClass: productClass || null,
    // Store source for identification
    source: 'midocean',
    // Store original product ID for reference
    originalProductId: product.id,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    // Include other fields that might be useful
    imageUrl: product.imageUrl,
    dimensions: product.dimensions,
    weight: product.weight,
    rawData: product.rawData,
  };
}

// GET - List all product providers (from both XD Connects and Midocean)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const search = searchParams.get('search');

    // Fetch XD Connects products
    const xdBaseQuery = db.select().from(productProviders);
    const xdProductsRaw = search
      ? await xdBaseQuery
          .where(
            or(
              ilike(productProviders.itemCode, `%${search}%`),
              ilike(productProviders.itemName, `%${search}%`),
              ilike(productProviders.brand, `%${search}%`),
              ilike(productProviders.mainCategory, `%${search}%`)
            )!
          )
          .limit(limit)
          .offset(offset)
      : await xdBaseQuery.limit(limit).offset(offset);
    
    // Add explicit source field to XD Connects products
    const xdProducts = xdProductsRaw.map((product: any) => ({
      ...product,
      source: null, // Explicitly set to null for XD Connects products
    }));

    // Fetch Midocean products
    const midoceanBaseQuery = db.select().from(products);
    const midoceanProductsRaw = search
      ? await midoceanBaseQuery
          .where(
            and(
              eq(products.source, 'midocean'),
              or(
                ilike(products.productCode, `%${search}%`),
                ilike(products.name, `%${search}%`),
                ilike(products.brand, `%${search}%`),
                ilike(products.category, `%${search}%`)
              )!
            )
          )
          .limit(limit)
          .offset(offset)
      : await midoceanBaseQuery
          .where(eq(products.source, 'midocean'))
          .limit(limit)
          .offset(offset);
    
    // Transform midocean products to match ProductProvider format
    const midoceanProducts = midoceanProductsRaw.map(transformMidoceanProduct);

    // Combine both sources
    const allProducts = [...xdProducts, ...midoceanProducts];

    // Get total counts for pagination
    const allXdProducts = await db.select().from(productProviders);
    const allMidoceanProducts = await db.select().from(products).where(eq(products.source, 'midocean'));
    const total = search ? allProducts.length : allXdProducts.length + allMidoceanProducts.length;

    return NextResponse.json({
      success: true,
      data: allProducts,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching product providers:', error);
    // Return empty array instead of error to prevent UI breaking during initialization
    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit: 1000,
        offset: 0,
      },
      message: 'Database initializing or empty',
    });
  }
}

// POST - Create a new product provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.itemCode) {
      return NextResponse.json(
        { success: false, error: 'itemCode is required' },
        { status: 400 }
      );
    }

    // Check if product already exists
    const existing = await db
      .select()
      .from(productProviders)
      .where(eq(productProviders.itemCode, body.itemCode))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Product with this itemCode already exists' },
        { status: 409 }
      );
    }

    const [product] = await db
      .insert(productProviders)
      .values({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product provider:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

