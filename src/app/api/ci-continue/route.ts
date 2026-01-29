import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('CI Continue endpoint called - shutting down container...');
  
  // Give time for response to be sent
  setTimeout(() => {
    process.exit(0);
  }, 500);
  
  return NextResponse.json({ 
    success: true, 
    message: 'Container will shut down in 500ms' 
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'CI Continue endpoint - use POST to trigger shutdown',
    usage: 'POST /api/ci-continue to stop the container'
  });
}
