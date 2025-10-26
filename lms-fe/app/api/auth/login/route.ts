import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/proxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API ROUTE] Login request body:', body);
    
    const response = await proxyRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('[API ROUTE] Backend response:', data);
    console.log('[API ROUTE] Response has user?', !!data.user);
    console.log('[API ROUTE] Response has token?', !!data.token);
    console.log('[API ROUTE] Response has access_token?', !!data.access_token);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend. Please ensure the backend server is running.' },
      { status: 500 }
    );
  }
}