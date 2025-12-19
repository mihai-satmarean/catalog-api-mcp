import { NextRequest, NextResponse } from 'next/server';
import { db, providerQuotes } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/quotes/[requestId] - Get all quotes for a specific request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const quotes = await db
      .select()
      .from(providerQuotes)
      .where(eq(providerQuotes.requestId, requestId))
      .orderBy(providerQuotes.createdAt);
    
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
