import { NextRequest, NextResponse } from 'next/server';
import { getStock } from '@/lib/providers/xd-connects/client';

export async function GET(request: NextRequest) {
  try {
    const data = await getStock();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

