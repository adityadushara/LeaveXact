// API configuration for external backend server
import { getApiBaseUrl } from './api-config'

const API_BASE_URL = getApiBaseUrl()

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Handle 401 Unauthorized - Session expired
    if (response.status === 401) {
      console.log('[API] 401 Unauthorized - Token expired or invalid')
      
      // Clear stored auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax'
        document.cookie = 'role=; Max-Age=0; path=/; SameSite=Lax'
        
        // Redirect to login
        window.location.href = '/login'
      }
      
      throw new Error('Session expired. Please log in again.')
    }
    
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Authentication API
export const authAPI = {
  // Perform login, then fetch current user, and return both
  login: async (email: string, password: string) => {
    const response = await apiCall<{ access_token: string; token_type: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )

    // Persist token for subsequent authenticated calls
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access_token)
    }

    // Fetch current user info using the newly stored token
    const me = await apiCall<any>('/auth/me')

    // Normalize role to match app expectations ('admin' | 'employee')
    const normalizedRole = String(me.role || '').toLowerCase()
    const user = {
      ...me,
      role: normalizedRole === 'admin' ? 'admin' : 'employee',
    }

    return { user, token: response.access_token }
  },

  me: async () => {
    return apiCall('/auth/me')
  },

  logout: async () => {
    const response = await apiCall('/auth/logout', {
      method: 'POST',
    })
    
    // Clear token from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    
    return response
  },

  changePassword: async (params: { 
    current_password: string; 
    new_password: string;
    confirm_password?: string;
  }) => {
    // Add confirm_password if not provided (same as new_password)
    const payload = {
      ...params,
      confirm_password: params.confirm_password || params.new_password
    }
    return apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}

// Leave API
export const leaveAPI = {
  getMyRequests: async () => {
    return apiCall('/leaves/')
  },

  getAllRequests: async () => {
    return apiCall('/leaves/')
  },

  submitRequest: async (data: { 
    leave_type: string; 
    start_date: string; 
    end_date: string; 
    reason: string;
  }) => {
    return apiCall('/leaves/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateRequest: async (requestId: string, data: { 
    leave_type: string; 
    start_date: string; 
    end_date: string; 
    reason: string;
  }) => {
    return apiCall(`/leaves/${requestId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteRequest: async (requestId: string) => {
    return apiCall(`/leaves/${requestId}`, {
      method: 'DELETE',
    })
  },

  updateRequestStatus: async (requestId: string, status: 'approved' | 'rejected', comment?: string) => {
    const endpoint = status === 'approved' 
      ? `/admin/leaves/${requestId}/approve`
      : `/admin/leaves/${requestId}/reject`
    
    return apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ admin_comment: comment }),
    })
  },
}

// Employee/Admin API
export const adminAPI = {
  getEmployees: async (params?: { 
    skip?: number; 
    limit?: number; 
    department?: string; 
    role?: string;
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.department) searchParams.append('department', params.department)
    if (params?.role) searchParams.append('role', params.role)
    
    const query = searchParams.toString()
    return apiCall(`/employees/${query ? `?${query}` : ''}`)
  },

  getEmployee: async (employeeId: string) => {
    return apiCall(`/employees/${employeeId}`)
  },

  createEmployee: async (data: {
    name: string;
    email: string;
    department: string;
    role: string;
    password: string;
  }) => {
    return apiCall('/employees/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateEmployee: async (employeeId: string, data: {
    name?: string;
    email?: string;
    department?: string;
    employee_id?: string;
  }) => {
    return apiCall(`/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteEmployee: async (employeeId: string) => {
    return apiCall(`/employees/${employeeId}`, {
      method: 'DELETE',
    })
  },

  getAllLeaveRequests: async (params?: { 
    skip?: number; 
    limit?: number; 
    status?: string;
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.append('skip', params.skip.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.status) searchParams.append('status', params.status)
    
    const query = searchParams.toString()
    return apiCall(`/admin/leaves/${query ? `?${query}` : ''}`)
  },

  getEmployeeAnalytics: async (employeeId: string) => {
    return apiCall(`/analytics/employee/${employeeId}`)
  },

  getDepartmentAnalytics: async () => {
    return apiCall('/analytics/departments/')
  },

  getSummaryAnalytics: async () => {
    return apiCall('/analytics/summary/')
  },

  getAuditLogs: async (params?: { 
    skip?: number; 
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams()
    // Use paginated=false to get all items without pagination wrapper
    searchParams.append('paginated', 'false')
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    
    const query = searchParams.toString()
    return apiCall(`/api/logs/?${query}`)
  },
}

// Export a function to clear API cache (for compatibility)
export const clearAPICache = () => {
  // No-op for external API
}