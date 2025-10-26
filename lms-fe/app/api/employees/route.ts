import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

// Helper to transform employee data from backend format to frontend format
function transformEmployee(emp: any) {
  const transformed = {
    ...emp,
    id: emp._id || emp.id, // Prioritize _id from MongoDB
    employeeId: emp.employeeId || emp.employee_id,
    leaveBalance: emp.leaveBalance || {
      annual: emp.annual_leave || 0,
      sick: emp.sick_leave || 0,
      personal: emp.personal_leave || 0,
    }
  };
  console.log('Transformed employee:', { original: emp._id, transformed: transformed.id, name: emp.name });
  return transformed;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    
    const response = await proxyRequest(`/api/admin/employees?${searchParams.toString()}`, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();
    
    // Transform the data to ensure consistent field names
    const transformedData = Array.isArray(data) 
      ? data.map(transformEmployee)
      : transformEmployee(data);
    
    return NextResponse.json(transformedData, { status: response.status });
  } catch (error) {
    console.error('Get employees proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const body = await request.json();
    
    const response = await proxyRequest('/api/admin/employees', {
      method: 'POST',
      headers: authHeader ? { 'Authorization': authHeader } : {},
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Create employee proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
