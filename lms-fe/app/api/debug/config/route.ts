import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/api-config';

export async function GET() {
  return NextResponse.json({
    backendUrl: getApiBaseUrl(),
    env: {
      BACKEND_URL: process.env.BACKEND_URL || 'not set',
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'not set',
    },
    timestamp: new Date().toISOString(),
  });
}
