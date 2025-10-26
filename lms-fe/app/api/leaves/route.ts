import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

// Helper to transform leave request data
function transformLeaveRequest(req: any) {
  // Handle userId being either an object or a string
  const userId = req.userId || req.user_id;
  const transformedUserId = typeof userId === 'object' && userId !== null
    ? {
        ...userId,
        id: userId.id || userId._id,
        employeeId: userId.employeeId || userId.employee_id,
      }
    : userId;

  return {
    ...req,
    id: req.id || req._id,
    userId: transformedUserId,
    leaveType: req.leaveType || req.leave_type,
    startDate: req.startDate || req.start_date,
    endDate: req.endDate || req.end_date,
    appliedAt: req.appliedAt || req.applied_at || req.createdAt || req.created_at,
    appliedDate: req.appliedDate || req.applied_date || req.appliedAt || req.applied_at || req.createdAt || req.created_at,
    adminComments: req.adminComments || req.admin_comments,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    
    // Route to the correct backend endpoint - /api/leave/ returns all requests
    // Admin sees all, employees see only their own
    const response = await proxyRequest(`/api/leave/?${searchParams.toString()}`, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    // Try to parse the response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse backend response:', parseError);
      return NextResponse.json(
        { detail: 'Invalid response from backend' },
        { status: 500 }
      );
    }
    
    // If backend returns an error, return it with the same status
    if (!response.ok) {
      // Don't log auth errors as they're expected when not authenticated
      if (response.status !== 401 && response.status !== 403) {
        console.error('Backend error:', response.status, data);
      }
      return NextResponse.json(data, { status: response.status });
    }
    
    // Transform the data to ensure consistent field names
    let transformedData = Array.isArray(data) 
      ? data.map(transformLeaveRequest)
      : transformLeaveRequest(data);
    
    // Sort by latest update first (newest on top, oldest at bottom)
    if (Array.isArray(transformedData)) {
      transformedData = transformedData.sort((a, b) => {
        const dateA = new Date(a.appliedAt || a.applied_at || 0).getTime();
        const dateB = new Date(b.appliedAt || b.applied_at || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    }
    
    return NextResponse.json(transformedData, { status: response.status });
  } catch (error: any) {
    console.error('Get leaves proxy error:', error?.message || error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend', error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const body = await request.json();
    
    // Route to the correct backend endpoint - POST /api/leave/ creates a new request
    const response = await proxyRequest('/api/leave/', {
      method: 'POST',
      headers: authHeader ? { 'Authorization': authHeader } : {},
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Create leave request proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
