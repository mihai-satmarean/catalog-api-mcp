import { NextRequest, NextResponse } from 'next/server';
import { db, productPrices } from '@/db';
import { eq } from 'drizzle-orm';

// GET - Get a single product price by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [price] = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.id, params.id))
      .limit(1);

    if (!price) {
      return NextResponse.json(
        { success: false, error: 'Price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: price });
  } catch (error) {
    console.error('Error fetching product price:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a product price
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if price exists
    const [existing] = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Price not found' },
        { status: 404 }
      );
    }

    // If itemCode is being changed, check for conflicts
    if (body.itemCode && body.itemCode !== existing.itemCode) {
      const conflict = await db
        .select()
        .from(productPrices)
        .where(eq(productPrices.itemCode, body.itemCode))
        .limit(1);

      if (conflict.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Price with this itemCode already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(productPrices)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(productPrices.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating product price:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product price
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if price exists
    const [existing] = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Price not found' },
        { status: 404 }
      );
    }

    await db.delete(productPrices).where(eq(productPrices.id, params.id));

    return NextResponse.json({ success: true, message: 'Price deleted successfully' });
  } catch (error) {
    console.error('Error deleting product price:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


