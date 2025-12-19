import { NextRequest, NextResponse } from 'next/server';
import { db, roles } from '@/db';
import { eq } from 'drizzle-orm';

// GET - List all roles
export async function GET(request: NextRequest) {
  try {
    const allRoles = await db.select().from(roles);
    return NextResponse.json({
      success: true,
      data: allRoles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existing = await db
      .select()
      .from(roles)
      .where(eq(roles.name, body.name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Role with this name already exists' },
        { status: 409 }
      );
    }

    const [newRole] = await db
      .insert(roles)
      .values({
        name: body.name,
        description: body.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create role' },
      { status: 500 }
    );
  }
}

