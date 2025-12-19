import { NextRequest, NextResponse } from 'next/server';
import { db, roles } from '@/db';
import { eq } from 'drizzle-orm';

// POST - Initialize default roles
export async function POST(request: NextRequest) {
  try {
    const defaultRoles = [
      { name: 'Angajat', description: 'Employee role' },
      { name: 'Manager', description: 'Manager role' },
    ];

    const createdRoles = [];

    for (const roleData of defaultRoles) {
      // Check if role already exists
      const [existing] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);

      if (!existing) {
        const [newRole] = await db
          .insert(roles)
          .values({
            name: roleData.name,
            description: roleData.description,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        createdRoles.push(newRole);
      } else {
        createdRoles.push(existing);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default roles initialized',
      data: createdRoles,
    });
  } catch (error) {
    console.error('Error initializing roles:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to initialize roles' },
      { status: 500 }
    );
  }
}

