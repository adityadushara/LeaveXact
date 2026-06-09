// Type definitions
export interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  employee_id: string
  gender?: string
  annual_leave: number
  sick_leave: number
  personal_leave: number
  emergency_leave?: number
  maternity_leave?: number
  paternity_leave?: number
}

export interface LeaveRequest {
  id: string
  userId: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  comment?: string
  appliedAt: string
}

export interface LeaveRequestWithUser {
  id: string
  userId: {
    id: string
    name: string
    email: string
    role: string
    department: string
    employee_id: string
    gender?: string
    annual_leave: number
    sick_leave: number
    personal_leave: number
    emergency_leave?: number
    maternity_leave?: number
    paternity_leave?: number
  }
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  comment?: string
  appliedAt: string
}

// Backend URL - use environment variable from centralized config
import { getApiBaseUrl } from './api-config'

const BACKEND_URL = getApiBaseUrl()

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Helper to build API URL - use backend directly for admin endpoints
const getApiUrl = (endpoint: string) => {
  // For admin endpoints, always use backend directly
  if (endpoint.startsWith('/api/admin/') || endpoint.startsWith('/api/employees')) {
    return `${BACKEND_URL}${endpoint}`
  }
  // For other endpoints, use Next.js proxy
  return endpoint
}

// API implementations
export const authAPI = {
  login: async (email: string, password: string) => {
    // Step 1: Get the access token
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Login failed")
    }
    const tokenData = await res.json()
    const token = tokenData.access_token || tokenData.token
    
    if (!token) {
      throw new Error("No token received from server")
    }
    
    // Step 2: Fetch user data using the token
    const userRes = await fetch("/api/auth/me", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    
    if (!userRes.ok) {
      throw new Error("Failed to fetch user data")
    }
    
    const user = await userRes.json()
    
    // Return both user and token in expected format
    return {
      user,
      token,
      access_token: token
    }
  },
  register: async (data: { name: string; email: string; password: string; department: string }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Registration failed")
    }
    return res.json()
  },
  me: async () => {
    const res = await fetch("/api/auth/me", {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to get user info")
    }
    return res.json()
  },
  logout: async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Logout failed")
    }
    return res.json()
  },
  changePassword: async (params: { current_password: string; new_password: string; confirm_password?: string }) => {
    const body = {
      current_password: params.current_password,
      new_password: params.new_password,
      confirm_password: params.confirm_password || params.new_password
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to change password")
    }
    return res.json()
  },
  updateProfile: async (data: { name: string }) => {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to update profile")
    }
    return res.json()
  },
  updateFullProfile: async (data: { name?: string; email?: string; department?: string; gender?: string; password?: string }) => {
    const res = await fetch("/api/auth/profile/full", {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to update profile")
    }
    return res.json()
  },
  changeEmail: async (data: { new_email: string; password: string }) => {
    const res = await fetch("/api/auth/change-email", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to change email")
    }
    return res.json()
  },
}

export const leaveAPI = {
  getCalendar: async (userId?: string, params?: { start_date?: string; end_date?: string; include_holidays?: boolean }) => {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.include_holidays !== undefined) queryParams.append('include_holidays', params.include_holidays.toString())
    
    // Use my-calendar endpoint for current user
    const url = `/api/leave/calendar/my-calendar${queryParams.toString() ? `?${queryParams}` : ''}`
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch calendar")
    }
    return res.json()
  },
  getMyRequests: async () => {
    const res = await fetch("/api/leaves", {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch requests")
    }
    return res.json()
  },
  getAllRequests: async () => {
    const res = await fetch("/api/leaves", {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || error.message || "Failed to fetch requests")
    }
    const requests = await res.json()
    
    // Transform the response to ensure consistent structure
    const transformed = requests.map((req: any) => {
      // The API returns employee data in the 'employee' field
      // Transform it to match the UI expectations
      const userId = req.employee ? {
        id: String(req.employee.id),
        name: req.employee.name,
        email: req.employee.email,
        department: req.employee.department,
        employeeId: req.employee.employee_id,
        role: req.employee.role,
        leaveBalance: {
          annual: req.employee.annual_leave || 0,
          sick: req.employee.sick_leave || 0,
          personal: req.employee.personal_leave || 0,
          emergency: req.employee.emergency_leave || 0,
          maternity: req.employee.maternity_leave || 0,
        }
      } : (req.employee_id || req.user_id)
      
      return {
        id: req.id,
        userId: userId,
        leaveType: req.leave_type || req.leaveType,
        startDate: req.start_date || req.startDate,
        endDate: req.end_date || req.endDate,
        reason: req.reason,
        status: (req.status || "").toLowerCase(),
        comment: req.admin_comment || req.comment,
        appliedAt: req.created_at || req.applied_at || req.appliedAt,
        duration: req.duration,
      }
    })
    
    return transformed
  },
  submitRequest: async (data: { leave_type: string; start_date: string; end_date: string; reason: string }) => {
    const res = await fetch("/api/leaves", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to submit request")
    }
    return res.json()
  },
  // Admin approve endpoint - PUT /api/admin/leaves/{request_id}/approve
  approveRequest: async (requestId: string, admin_comment?: string) => {
    const res = await fetch(`/api/admin/leaves/${requestId}/approve`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ admin_comment }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to approve request")
    }
    return res.json()
  },
  // Admin reject endpoint - PUT /api/admin/leaves/{request_id}/reject
  rejectRequest: async (requestId: string, admin_comment?: string) => {
    const res = await fetch(`/api/admin/leaves/${requestId}/reject`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ admin_comment }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to reject request")
    }
    return res.json()
  },
  // Legacy method for backward compatibility
  updateRequestStatus: async (requestId: string, status: "approved" | "rejected", comment?: string) => {
    if (status === "approved") {
      return leaveAPI.approveRequest(requestId, comment)
    } else {
      return leaveAPI.rejectRequest(requestId, comment)
    }
  },
  // Employee edit endpoint - PUT /api/leaves/{request_id}
  // Allows employees to edit their own pending requests
  // Admins can edit any pending request
  updateRequest: async (requestId: string, data: { leave_type?: string; start_date?: string; end_date?: string; reason?: string }) => {
    const res = await fetch(`/api/leaves/${requestId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      let errorMessage = "Failed to update request"
      try {
        const error = await res.json()
        errorMessage = error.detail || errorMessage
      } catch (e) {
        errorMessage = `Server error: ${res.status} ${res.statusText}`
      }
      throw new Error(errorMessage)
    }
    return res.json()
  },
  deleteRequest: async (requestId: string) => {
    const res = await fetch(`/api/leaves/${requestId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to delete request")
    }
    return res.json()
  },
  getLeaveById: async (requestId: string) => {
    const res = await fetch(`/api/leave/${requestId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch leave request")
    }
    return res.json()
  },
}

export const adminAPI = {
  getEmployees: async () => {
    const url = '/api/employees'
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch employees")
    }
    const employees = await res.json()
    
    // Transform API response to match UI expectations
    return employees.map((emp: any) => ({
      id: emp.id?.toString() || emp.employee_id,
      name: emp.name,
      email: emp.email,
      employeeId: emp.employee_id || `EMP${emp.id}`,
      department: emp.department,
      role: emp.role,
      gender: emp.gender,
      leaveBalance: {
        annual: emp.annual_leave || 0,
        sick: emp.sick_leave || 0,
        personal: emp.personal_leave || 0,
        emergency: emp.emergency_leave || 0,
        maternity: emp.maternity_leave || 0,
        paternity: emp.paternity_leave || 0,
      }
    }))
  },
  createEmployee: async (data: { name: string; email: string; password: string; department: string }) => {
    const url = '/api/employees'
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to create employee")
    }
    return res.json()
  },
  updateEmployee: async (id: string, data: { name?: string; email?: string; department?: string; employee_id?: string }) => {
    const url = `/api/employees/${id}`
    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to update employee")
    }
    return res.json()
  },
  deleteEmployee: async (id: string) => {
    const url = `/api/employees/${id}`
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to delete employee")
    }
    return res.json()
  },
  getAuditLogs: async (limit?: number) => {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    
    const res = await fetch(`/api/audit-logs?${params}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch audit logs")
    }
    const response = await res.json()
    
    // The API returns {items: [...], total: ..., page: ..., limit: ...}
    // Extract the items array
    const logs = response.items || response || []
    
    // Transform audit logs to match UI expectations
    return logs.map((log: any) => ({
      id: log.id,
      userId: log.user_id || log.userId,
      userName: log.user?.name || log.user_name || log.userName || 'Unknown User',
      userEmail: log.user?.email || log.user_email || log.userEmail,
      user: log.user,
      action: log.action,
      description: log.description,
      details: log.details,
      timestamp: log.timestamp || log.created_at,
      ipAddress: log.ip_address || log.ipAddress,
    }))
  },
  resetAuditLogs: async () => {
    const res = await fetch("/api/audit-logs/reset", {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to reset audit logs")
    }
    return res.json()
  },
  getAnalyticsSummary: async () => {
    const res = await fetch("/api/analytics/summary", {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch analytics summary")
    }
    return res.json()
  },
  getEmployeeAnalytics: async (employeeId: string) => {
    const res = await fetch(`/api/analytics/employee/${employeeId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch employee analytics")
    }
    return res.json()
  },
  getDepartmentAnalytics: async () => {
    const res = await fetch("/api/analytics/departments", {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch department analytics")
    }
    return res.json()
  },
  getCalendar: async (params?: { date?: string; start_date?: string; end_date?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.date) queryParams.append('date', params.date)
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    
    // Use Next.js API proxy to avoid CORS issues
    const url = `/api/admin/calendar${queryParams.toString() ? `?${queryParams}` : ''}`
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      let errorMessage = "Failed to fetch admin calendar"
      try {
        const error = await res.json()
        errorMessage = error.detail || errorMessage
      } catch (e) {
        // Response is not JSON (might be HTML error page)
        errorMessage = `Server error: ${res.status} ${res.statusText}`
      }
      throw new Error(errorMessage)
    }
    return res.json()
  },
  getTodayCalendar: async () => {
    const res = await fetch("/api/admin/calendar/today", {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      let errorMessage = "Failed to fetch today's calendar"
      try {
        const error = await res.json()
        errorMessage = error.detail || errorMessage
      } catch (e) {
        // Response is not JSON (might be HTML error page)
        errorMessage = `Server error: ${res.status} ${res.statusText}`
      }
      throw new Error(errorMessage)
    }
    return res.json()
  },
  getEmployeeById: async (employeeId: string) => {
    const url = getApiUrl(`/api/employees/${employeeId}`)
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch employee")
    }
    return res.json()
  },
  getAllLeaveRequests: async (params?: { skip?: number; limit?: number; status?: string; employee_id?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
    else queryParams.append('limit', '1000')
    if (params?.status) queryParams.append('status', params.status)
    if (params?.employee_id !== undefined) queryParams.append('employee_id', params.employee_id.toString())
    
    const url = `/api/admin/leaves${queryParams.toString() ? `?${queryParams}` : ''}`
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch leave requests")
    }
    const requests = await res.json()
    
    return requests.map((req: any) => {
      const userId = req.employee ? {
        id: String(req.employee.id),
        name: req.employee.name,
        email: req.employee.email,
        department: req.employee.department,
        employeeId: req.employee.employee_id,
        role: req.employee.role,
        leaveBalance: {
          annual: req.employee.annual_leave || 0,
          sick: req.employee.sick_leave || 0,
          personal: req.employee.personal_leave || 0,
          emergency: req.employee.emergency_leave || 0,
          maternity: req.employee.maternity_leave || 0,
        }
      } : (req.employee_id || req.user_id)
      
      return {
        id: req.id,
        userId: userId,
        leaveType: req.leave_type || req.leaveType,
        startDate: req.start_date || req.startDate,
        endDate: req.end_date || req.endDate,
        reason: req.reason,
        status: (req.status || "").toLowerCase(),
        comment: req.admin_comment || req.comment,
        appliedAt: req.created_at || req.applied_at || req.appliedAt,
        duration: req.duration,
      }
    })
  },
  expireOldLeaves: async () => {
    const res = await fetch("/api/analytics/expire-old-leaves", {
      method: "POST",
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to expire old leaves")
    }
    return res.json()
  },
}

// Public Holidays API (if needed separately)
export const holidaysAPI = {
  getHolidays: async (params?: { start_date?: string; end_date?: string; days?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.start_date) queryParams.append('start_date', params.start_date)
    if (params?.end_date) queryParams.append('end_date', params.end_date)
    if (params?.days) queryParams.append('days', params.days.toString())
    
    // Use Next.js API proxy to avoid CORS issues
    const url = `/api/admin/calendar/holidays${queryParams.toString() ? `?${queryParams}` : ''}`
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to fetch holidays")
    }
    const data = await res.json()
    // Return just the holidays array for easier consumption
    return data.holidays || []
  },
}
