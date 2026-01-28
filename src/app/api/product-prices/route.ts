import { NextRequest, NextResponse } from 'next/server';
import { db, productPrices, products } from '@/db';
import { eq, or, ilike, and } from 'drizzle-orm';

// Helper function to transform midocean product price to ProductPrice format
function transformMidoceanPrice(product: any): any {
  if (!product.price) return null;
  
  return {
    id: `midocean-${product.id}`,
    productProviderId: null,
    itemCode: product.productCode || product.externalId || product.id,
    currency: 'EUR', // Default currency, adjust if midocean provides currency info
    unitPrice: product.price,
    priceTier1Qty: null,
    priceTier1Price: product.price,
    priceTier2Qty: null,
    priceTier2Price: null,
    priceTier3Qty: null,
    priceTier3Price: null,
    priceTier4Qty: null,
    priceTier4Price: null,
    priceTier5Qty: null,
    priceTier5Price: null,
    minimumOrderQuantity: null,
    effectiveDate: null,
    expiryDate: null,
    rawData: product.rawData ? JSON.stringify({ price: product.price, source: 'midocean' }) : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// GET - List all product prices (from both XD Connects and Midocean)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const search = searchParams.get('search');
    const itemCode = searchParams.get('itemCode');

    // Fetch XD Connects prices
    const pricesQuery = db.select().from(productPrices);
    
    let xdPrices;
    if (itemCode) {
      xdPrices = await pricesQuery
        .where(eq(productPrices.itemCode, itemCode))
        .limit(limit)
        .offset(offset);
    } else if (search) {
      xdPrices = await pricesQuery
        .where(
          or(
            ilike(productPrices.itemCode, `%${search}%`),
            ilike(productPrices.currency, `%${search}%`)
          )!
        )
        .limit(limit)
        .offset(offset);
    } else {
      xdPrices = await pricesQuery.limit(limit).offset(offset);
    }

    // Fetch Midocean products with prices
    const midoceanBaseQuery = db.select().from(products);
    
    let midoceanProductsRaw;
    if (itemCode) {
      midoceanProductsRaw = await midoceanBaseQuery
        .where(
          and(
            eq(products.source, 'midocean'),
            or(
              eq(products.productCode, itemCode),
              eq(products.externalId, itemCode)
            )!
          )
        )
        .limit(limit)
        .offset(offset);
    } else if (search) {
      midoceanProductsRaw = await midoceanBaseQuery
        .where(
          and(
            eq(products.source, 'midocean'),
            or(
              ilike(products.productCode, `%${search}%`),
              ilike(products.name, `%${search}%`)
            )!
          )
        )
        .limit(limit)
        .offset(offset);
    } else {
      midoceanProductsRaw = await midoceanBaseQuery
        .where(eq(products.source, 'midocean'))
        .limit(limit)
        .offset(offset);
    }
    
    // Transform midocean products with prices to ProductPrice format
    const midoceanPrices = midoceanProductsRaw
      .filter(p => p.price) // Only include products with prices
      .map(transformMidoceanPrice)
      .filter(p => p !== null);

    // Combine both sources
    const allPrices = [...xdPrices, ...midoceanPrices];

    // Get total counts for pagination
    const allXdPrices = await db.select().from(productPrices);
    const allMidoceanProducts = await db.select().from(products)
      .where(eq(products.source, 'midocean'));
    const midoceanProductsWithPrices = allMidoceanProducts.filter(p => p.price);
    const total = search || itemCode ? allPrices.length : allXdPrices.length + midoceanProductsWithPrices.length;

    return NextResponse.json({
      success: true,
      data: allPrices,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create a new product price
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.itemCode) {
      return NextResponse.json(
        { success: false, error: 'itemCode is required' },
        { status: 400 }
      );
    }

    // Check if price already exists for this itemCode
    const existing = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.itemCode, body.itemCode))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Price for this itemCode already exists' },
        { status: 409 }
      );
    }

    const [price] = await db
      .insert(productPrices)
      .values({
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: price }, { status: 201 });
  } catch (error) {
    console.error('Error creating product price:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


