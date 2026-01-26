import { NextRequest, NextResponse } from 'next/server';
import { db, freeDayRequests, users } from '@/db';
import { eq } from 'drizzle-orm';

// GET - List all free day requests
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = db
      .select({
        id: freeDayRequests.id,
        userId: freeDayRequests.userId,
        type: freeDayRequests.type,
        startDate: freeDayRequests.startDate,
        endDate: freeDayRequests.endDate,
        reason: freeDayRequests.reason,
        status: freeDayRequests.status,
        createdAt: freeDayRequests.createdAt,
        updatedAt: freeDayRequests.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(freeDayRequests)
      .leftJoin(users, eq(freeDayRequests.userId, users.id));

    if (userId) {
      query = query.where(eq(freeDayRequests.userId, userId)) as any;
    }

    if (status) {
      query = query.where(eq(freeDayRequests.status, status)) as any;
    }

    const requests = await query;

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching free day requests:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST - Create a new free day request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.userId || !body.type || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: 'userId, type, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['concediu', 'sanatate', 'birthdata'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { success: false, error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Verify user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const [newRequest] = await db
      .insert(freeDayRequests)
      .values({
        userId: body.userId,
        type: body.type,
        startDate: startDate,
        endDate: endDate,
        reason: body.reason || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating free day request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create request' },
      { status: 500 }
    );
  }
}

