import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    
    const backendUrl = `/api/admin/calendar/holidays?${searchParams.toString()}`;
    
    // Forward the request to the backend holidays endpoint
    const response = await proxyRequest(backendUrl, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin holidays proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
