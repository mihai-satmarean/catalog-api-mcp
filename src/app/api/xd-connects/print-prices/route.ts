import { NextRequest, NextResponse } from 'next/server';
import { getPrintPrices } from '@/lib/providers/xd-connects/client';

export async function GET(request: NextRequest) {
  try {
    const data = await getPrintPrices();

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching print prices:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

