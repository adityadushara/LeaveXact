import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    
    const response = await proxyRequest('/api/auth/profile', {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get current user proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend. Please ensure the backend server is running at http://localhost:8000' },
      { status: 500 }
    );
  }
}