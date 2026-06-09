// Optimized API client with caching and better error handling
export interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  employee_id: string
  annual_leave: number
  sick_leave: number
  personal_leave: number
  emergency_leave: number
  maternity_leave: number
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
    annual_leave: number
    sick_leave: number
    personal_leave: number
    emergency_leave: number
    maternity_leave: number
  }
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  comment?: string
  appliedAt: string
}

// Simple in-memory cache
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 30000) { // 30 seconds default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
}

const apiCache = new APICache()

// Optimized fetch with caching and error handling
async function fetchWithCache<T>(
  url: string, 
  options: RequestInit = {}, 
  cacheKey?: string,
  ttl: number = 30000
): Promise<T> {
  // Check cache first (only for GET requests or when cacheKey is provided)
  if (cacheKey && ttl > 0) {
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return cached
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Cache the result (only for GET requests or when cacheKey is provided)
    if (cacheKey && ttl > 0) {
      apiCache.set(cacheKey, data, ttl)
    }
    
    return data
  } catch (error) {
    console.error(`API Error for ${url}:`, error)
    throw error
  }
}

// Optimized API implementations
export const authAPI = {
  login: async (email: string, password: string) => {
    if (typeof window === 'undefined') throw new Error("Cannot login on server side")
    
    return fetchWithCache("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  },
  
  changePassword: async (params: { email: string; currentPassword?: string; newPassword: string; confirmPassword?: string }) => {
    if (typeof window === 'undefined') throw new Error("Cannot change password on server side")
    
    const body = {
      current_password: params.currentPassword,
      new_password: params.newPassword,
      confirm_password: params.confirmPassword || params.newPassword
    }
    
    return fetchWithCache("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    })
  },
  
  register: (_data: any) => Promise.reject(new Error("Registration is not available in demo mode")),
  me: () => Promise.reject(new Error("Not implemented in demo mode")),
}

export const leaveAPI = {
  getMyRequests: async (): Promise<LeaveRequestWithUser[]> => {
    if (typeof window === 'undefined') return []
    
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const cacheKey = `my-requests-${user.id}`
    
    const all = await fetchWithCache<LeaveRequestWithUser[]>("/api/leave", {}, cacheKey, 15000) // 15 seconds cache
    return all.filter((r: LeaveRequestWithUser) => r.userId.id === user.id)
  },
  
  getAllRequests: async (): Promise<LeaveRequestWithUser[]> => {
    return fetchWithCache<LeaveRequestWithUser[]>("/api/leave", {}, "all-requests", 10000) // 10 seconds cache
  },
  
  submitRequest: async (data: any) => {
    if (typeof window === 'undefined') throw new Error("Cannot submit request on server side")
    
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const result = await fetchWithCache("/api/leave", {
      method: "POST",
      body: JSON.stringify({ ...data, userId: user.id }),
    })
    
    // Clear related caches
    apiCache.delete("all-requests")
    apiCache.delete(`my-requests-${user.id}`)
    
    return result
  },
  
  updateRequestStatus: async (requestId: string, status: "approved" | "rejected", comment?: string) => {
    if (typeof window === 'undefined') throw new Error("Cannot update request on server side")
    
    const result = await fetchWithCache(`/api/leave/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, comment }),
    }, undefined, 0) // No caching for updates
    
    // Clear related caches immediately
    apiCache.clear()
    
    return result
  },
  
  updateRequest: async (requestId: string, data: { leaveType: string; startDate: string; endDate: string; reason: string }) => {
    if (typeof window === 'undefined') throw new Error("Cannot update request on server side")
    
    const result = await fetchWithCache(`/api/leave/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    
    // Clear related caches
    apiCache.clear()
    
    return result
  },
  
  deleteRequest: async (requestId: string) => {
    if (typeof window === 'undefined') throw new Error("Cannot delete request on server side")
    
    const result = await fetchWithCache(`/api/leave/${requestId}`, {
      method: "DELETE",
    })
    
    // Clear related caches
    apiCache.clear()
    
    return result
  },
}

export const adminAPI = {
  getEmployees: async (): Promise<Employee[]> => {
    return fetchWithCache<Employee[]>("/api/users", {}, "employees", 30000) // 30 seconds cache
  },
  
  createEmployee: async (data: { name: string; email: string; department: string }) => {
    if (typeof window === 'undefined') throw new Error("Cannot create employee on server side")
    
    const result = await fetchWithCache("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    })
    
    // Clear employees cache
    apiCache.delete("employees")
    
    return result
  },
  
  updateEmployee: async (id: string, data: { name?: string; email?: string; department?: string; employee_id?: string }) => {
    if (typeof window === 'undefined') throw new Error("Cannot update employee on server side")
    
    const result = await fetchWithCache(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    
    // Clear related caches
    apiCache.delete("employees")
    apiCache.delete(`user-${id}`)
    
    return result
  },
  
  deleteEmployee: async (id: string) => {
    if (typeof window === 'undefined') throw new Error("Cannot delete employee on server side")
    
    const result = await fetchWithCache(`/api/users/${id}`, { method: "DELETE" })
    
    // Clear related caches
    apiCache.delete("employees")
    apiCache.delete(`user-${id}`)
    
    return result
  },
  
  getAuditLogs: async (limit?: number) => {
    const url = limit ? `/api/audit-logs?limit=${limit}` : "/api/audit-logs"
    const cacheKey = limit ? `audit-logs-${limit}` : "audit-logs"
    
    return fetchWithCache(url, {}, cacheKey, 20000) // 20 seconds cache
  },
}

// Utility function to clear all caches (useful for logout)
export const clearAPICache = () => {
  apiCache.clear()
}

// Export cache for debugging
export { apiCache }
