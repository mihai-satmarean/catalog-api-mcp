import { NextRequest, NextResponse } from 'next/server';
import { db, productRequests, providerQuotes, products } from '@/db';
import { insertProductRequestSchema, insertProviderQuoteSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAllProviderQuotes } from '@/lib/providers';

// GET /api/requests - Get all product requests
export async function GET() {
  try {
    const allRequests = await db.select().from(productRequests);
    return NextResponse.json(allRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST /api/requests - Create a new product request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertProductRequestSchema.parse(body);
    
    // Create the request
    const newRequest = await db.insert(productRequests).values(validatedData).returning();
    const createdRequest = newRequest[0];
    
    // Get the base product price for quote calculations
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, validatedData.productId))
      .limit(1);
    
    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const basePrice = product[0].price ? parseFloat(product[0].price) : 0;
    const quantity = parseFloat(validatedData.quantity);
    
    // Fetch quotes from all providers in parallel
    console.log(`Fetching quotes for request ${createdRequest.id}...`);
    const quotes = await getAllProviderQuotes(
      validatedData.productId,
      quantity,
      basePrice
    );
    
    // Insert quotes into database
    const quoteInserts = quotes.map(quote => ({
      requestId: createdRequest.id,
      providerName: quote.providerName,
      price: quote.price.toString(),
      deliveryDays: quote.deliveryDays,
      reliabilityScore: quote.reliabilityScore.toString(),
      responseTime: quote.responseTime,
    }));
    
    await db.insert(providerQuotes).values(quoteInserts);
    
    console.log(`Created ${quotes.length} quotes for request ${createdRequest.id}`);
    
    // Return the request with quotes embedded
    return NextResponse.json({
      ...createdRequest,
      quotes: quotes,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}