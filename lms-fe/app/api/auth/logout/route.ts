import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    
    const response = await proxyRequest('/auth/logout', {
      method: 'POST',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Logout proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}