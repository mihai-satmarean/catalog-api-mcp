import { NextRequest, NextResponse } from 'next/server';
import { db, users, roles } from '@/db';
import { insertUserSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/users - Get all users with their roles
export async function GET() {
  try {
    const allUsers = await db
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
      .leftJoin(roles, eq(users.roleId, roles.id));
    
    // Transform the result to flatten the role data
    const usersWithRoles = allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    
    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
    
    const validatedData = insertUserSchema.parse(body);
    
    const newUser = await db.insert(users).values(validatedData).returning();
    
    // Fetch the user with role
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
      .where(eq(users.id, newUser[0].id))
      .limit(1);
    
    return NextResponse.json({
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      roleId: userWithRole.roleId,
      role: userWithRole.role,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
