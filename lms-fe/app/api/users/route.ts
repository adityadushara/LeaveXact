import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

// Helper to transform user data from backend format to frontend format
function transformUser(user: any) {
  return {
    ...user,
    id: user.id || user._id,
    employeeId: user.employeeId || user.employee_id,
    leaveBalance: user.leaveBalance || {
      annual: user.annual_leave || 0,
      sick: user.sick_leave || 0,
      personal: user.personal_leave || 0,
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    
    // Proxy to backend employees endpoint
    const response = await proxyRequest('/api/admin/employees', {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    
    // Transform the data to ensure consistent field names
    const transformedData = Array.isArray(data) 
      ? data.map(transformUser)
      : transformUser(data);
    
    return NextResponse.json(transformedData, { status: response.status });
  } catch (error) {
    console.error('Get users proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
