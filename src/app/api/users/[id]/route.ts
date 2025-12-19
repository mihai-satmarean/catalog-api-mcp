import { NextRequest, NextResponse } from 'next/server';
import { db, users, roles } from '@/db';
import { eq } from 'drizzle-orm';

// GET - Get a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, params.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check if user exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate roleId if provided
    if (body.roleId) {
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, body.roleId))
        .limit(1);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        name: body.name !== undefined ? body.name : existing.name,
        email: body.email !== undefined ? body.email : existing.email,
        roleId: body.roleId !== undefined ? body.roleId : existing.roleId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.id))
      .returning();

    // Fetch updated user with role
    const [userWithRole] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, updated.id))
      .limit(1);

    return NextResponse.json({
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      roleId: userWithRole.roleId,
      role: userWithRole.role,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await db.delete(users).where(eq(users.id, params.id));

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

