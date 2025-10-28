import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    
    const backendUrl = `/api/admin/calendar?${searchParams.toString()}`;
    console.log('Proxying to backend:', backendUrl);
    
    // Forward the request to the backend admin calendar endpoint
    const response = await proxyRequest(backendUrl, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    console.log('Backend response status:', response.status);
    
    const data = await response.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin calendar proxy error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
