import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const body = await request.json();
    
    const response = await proxyRequest('/auth/change-password', {
      method: 'POST',
      headers: authHeader ? { 'Authorization': authHeader } : {},
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Change password proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}