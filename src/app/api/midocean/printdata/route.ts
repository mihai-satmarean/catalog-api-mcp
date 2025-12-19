import { NextRequest, NextResponse } from 'next/server';
import { getPrintdata, type MidoceanEnvironment } from '@/lib/providers/midocean/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const environment = (searchParams.get('environment') || 'test') as MidoceanEnvironment;
    const format = (searchParams.get('format') || 'json') as 'json' | 'xml';

    const data = await getPrintdata({
      environment,
      format,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching printdata:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

