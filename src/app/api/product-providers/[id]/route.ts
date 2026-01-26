import { NextRequest, NextResponse } from 'next/server';
import { db, productProviders } from '@/db';
import { eq } from 'drizzle-orm';

// GET - Get a single product provider by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [product] = await db
      .select()
      .from(productProviders)
      .where(eq(productProviders.id, params.id))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product provider:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a product provider
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if product exists
    const [existing] = await db
      .select()
      .from(productProviders)
      .where(eq(productProviders.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // If itemCode is being changed, check for conflicts
    if (body.itemCode && body.itemCode !== existing.itemCode) {
      const conflict = await db
        .select()
        .from(productProviders)
        .where(eq(productProviders.itemCode, body.itemCode))
        .limit(1);

      if (conflict.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Product with this itemCode already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(productProviders)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(productProviders.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating product provider:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product provider
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product exists
    const [existing] = await db
      .select()
      .from(productProviders)
      .where(eq(productProviders.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    await db.delete(productProviders).where(eq(productProviders.id, params.id));

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product provider:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


