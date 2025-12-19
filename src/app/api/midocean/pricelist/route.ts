import { NextRequest, NextResponse } from 'next/server';
import { getPricelist, type MidoceanResponseFormat, type MidoceanEnvironment } from '@/lib/providers/midocean/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const environment = (searchParams.get('environment') || 'test') as MidoceanEnvironment;
    const format = (searchParams.get('format') || 'json') as MidoceanResponseFormat;

    const data = await getPricelist({
      environment,
      format,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching pricelist:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

