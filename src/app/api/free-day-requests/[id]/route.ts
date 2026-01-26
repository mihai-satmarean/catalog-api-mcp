import { NextRequest, NextResponse } from 'next/server';
import { db, freeDayRequests } from '@/db';
import { eq } from 'drizzle-orm';

// GET - Get a single free day request by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [request] = await db
      .select()
      .from(freeDayRequests)
      .where(eq(freeDayRequests.id, params.id))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error('Error fetching free day request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a free day request (e.g., approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if request exists
    const [existing] = await db
      .select()
      .from(freeDayRequests)
      .where(eq(freeDayRequests.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) updateData.status = body.status;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.type !== undefined) {
      const validTypes = ['concediu', 'sanatate', 'birthdata'];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { success: false, error: `Type must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }

    const [updated] = await db
      .update(freeDayRequests)
      .set(updateData)
      .where(eq(freeDayRequests.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating free day request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a free day request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if request exists
    const [existing] = await db
      .select()
      .from(freeDayRequests)
      .where(eq(freeDayRequests.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    await db.delete(freeDayRequests).where(eq(freeDayRequests.id, params.id));

    return NextResponse.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting free day request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

