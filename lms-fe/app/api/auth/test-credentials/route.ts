import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await proxyRequest('/api/auth/test-credentials', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Test credentials proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
