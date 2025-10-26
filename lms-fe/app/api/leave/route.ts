import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

// This route redirects to /api/leaves for compatibility
export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    
    // Route to the correct backend endpoint
    const response = await proxyRequest(`/api/leave/all-requests?${searchParams.toString()}`, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get leave requests proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
