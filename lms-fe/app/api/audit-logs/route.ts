import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, getAuthHeader } from '@/lib/proxy';

// Helper function to transform audit log from backend to frontend format
function transformAuditLog(log: any) {
  if (!log) return log;

  // Parse details if it's a JSON string
  let details = log.details;
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch (e) {
      details = {};
    }
  }

  // Transform details keys from snake_case to camelCase
  let transformedDetails = details;
  if (details && typeof details === 'object') {
    transformedDetails = {
      leaveRequestId: details.leave_request_id,
      leaveType: details.leave_type,
      startDate: details.start_date,
      endDate: details.end_date,
      previousStatus: details.previous_status,
      newStatus: details.new_status,
      comment: details.comment || details.admin_comment,
      employeeId: details.employee_id,
      duration: details.duration,
    };
  }

  // Extract user name and email from various possible fields
  let userName = 'Unknown User';
  let userEmail = '';
  
  if (log.user?.name) {
    userName = log.user.name;
    userEmail = log.user.email || '';
  } else if (log.user_name) {
    userName = log.user_name;
    userEmail = log.user_email || '';
  } else if (log.userName) {
    userName = log.userName;
    userEmail = log.userEmail || '';
  } else if (log.employee?.name) {
    userName = log.employee.name;
    userEmail = log.employee.email || '';
  } else if (log.employee_name) {
    userName = log.employee_name;
    userEmail = log.employee_email || '';
  }

  // Improve description formatting
  let description = log.description;
  if (description && transformedDetails?.leaveType) {
    // Replace "LeaveType.SICK" with "SICK" or format it better
    const leaveType = transformedDetails.leaveType.replace('LeaveType.', '');
    description = description.replace(/LeaveType\.\w+/g, leaveType);
    
    // Add user name to description if not already present
    if (!description.includes(userName) && userName !== 'Unknown User') {
      if (log.action === 'leave_requested') {
        description = `${userName} submitted ${leaveType} leave request`;
      } else if (log.action === 'leave_approved') {
        description = description.replace('Approved leave request', `Approved ${leaveType} leave request`);
      } else if (log.action === 'leave_rejected') {
        description = description.replace('Rejected leave request', `Rejected ${leaveType} leave request`);
      }
    }
  }

  return {
    id: log.id,
    userId: log.user_id || log.user?.id || log.employee_id,
    userName: userName,
    userEmail: userEmail,
    user: log.user,
    action: log.action,
    description: description,
    details: transformedDetails,
    timestamp: log.timestamp || log.created_at,
    ipAddress: log.ip_address,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const { searchParams } = new URL(request.url);
    
    // Add paginated=false to get raw array instead of paginated response
    searchParams.set('paginated', 'false');
    
    // Set a higher default limit if not specified (backend default is 5)
    if (!searchParams.has('limit')) {
      searchParams.set('limit', '100');
    }

    const response = await proxyRequest(`/api/logs/?${searchParams.toString()}`, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    });

    const data = await response.json();

    // Transform backend response to frontend format
    // Backend returns array when paginated=false, or {items: [...]} when paginated=true
    let transformedData = Array.isArray(data)
      ? data.map(transformAuditLog)
      : (data.items || []).map(transformAuditLog);

    // Sort by timestamp - latest first (descending order)
    if (Array.isArray(transformedData)) {
      transformedData.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA; // Descending order (latest first)
      });
    }

    // Return with no-cache headers to prevent stale data
    return NextResponse.json(transformedData, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Get audit logs proxy error:', error);
    return NextResponse.json(
      { detail: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}
