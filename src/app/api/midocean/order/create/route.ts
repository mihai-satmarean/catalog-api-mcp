import { NextRequest, NextResponse } from 'next/server';
import { createOrder, type MidoceanEnvironment } from '@/lib/providers/midocean/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const environment = (searchParams.get('environment') || 'test') as MidoceanEnvironment;
    const format = (searchParams.get('format') || 'json') as 'json' | 'xml';

    const data = await createOrder(body, {
      environment,
      format,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

