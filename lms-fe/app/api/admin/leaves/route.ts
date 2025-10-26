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
    
    // Admin endpoint to get all leave requests
    const response = await proxyRequest(`/api/admin/leaves/?${searchParams.toString()}`, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    let data = await response.json();
    
    // Transform the data to ensure consistent field names
    if (Array.isArray(data)) {
      data = data.map(transformLeaveRequest);
      
      // Sort by latest update first (newest on top, oldest at bottom)
      data = data.sort((a: any, b: any) => {
        const dateA = new Date(a.appliedAt || a.applied_at || a.updatedAt || a.updated_at || 0).getTime();
        const dateB = new Date(b.appliedAt || b.applied_at || b.updatedAt || b.updated_at || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    } else {
      data = transformLeaveRequest(data);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get admin leaves proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
