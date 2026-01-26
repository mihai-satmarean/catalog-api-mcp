import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/db';
import { insertProductSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/products - Get all products
export async function GET() {
  try {
    const allProducts = await db.select().from(products);
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = insertProductSchema.parse(body);
    
    const newProduct = await db.insert(products).values(validatedData).returning();
    
    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

