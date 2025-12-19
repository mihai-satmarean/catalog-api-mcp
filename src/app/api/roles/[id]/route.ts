import { NextRequest, NextResponse } from 'next/server';
import { db, roles } from '@/db';
import { eq } from 'drizzle-orm';

// GET - Get a single role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, params.id))
      .limit(1);

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if role exists
    const [existing] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for conflicts
    if (body.name && body.name !== existing.name) {
      const conflict = await db
        .select()
        .from(roles)
        .where(eq(roles.name, body.name))
        .limit(1);

      if (conflict.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Role with this name already exists' },
          { status: 409 }
        );
      }
    }

    const [updated] = await db
      .update(roles)
      .set({
        name: body.name || existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, params.id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if role exists
    const [existing] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    await db.delete(roles).where(eq(roles.id, params.id));

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

