import { User } from "./auth"

export interface LeaveRequest {
  id: string
  userId: string
  leaveType: "annual" | "sick" | "personal"
  startDate: string
  endDate: string
  status: "pending" | "approved" | "rejected"
  reason: string
  comment?: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: "leave_requested" | "leave_approved" | "leave_rejected" | "leave_updated" | "leave_deleted" | "user_login" | "user_logout"
  description: string
  details?: {
    leaveRequestId?: string
    leaveType?: string
    startDate?: string
    endDate?: string
    previousStatus?: string
    newStatus?: string
    comment?: string
  }
  timestamp: string
  ipAddress?: string
}

const seedUsers: User[] = [
  {
    id: "1",
    name: "John Admin",
    email: "admin@company.com",
    role: "admin",
    department: "Management",
    employee_id: "ADM001",
    annual_leave: 15,
    sick_leave: 10,
    personal_leave: 5,
    emergency_leave: 3,
    maternity_leave: 90
  },
  {
    id: "2",
    name: "Jane Employee",
    email: "employee@company.com",
    role: "employee",
    department: "Engineering",
    employee_id: "EMP001",
    annual_leave: 12,
    sick_leave: 8,
    personal_leave: 3,
    emergency_leave: 3,
    maternity_leave: 90
  }
]

const seedRequests: LeaveRequest[] = [
  {
    id: "1",
    userId: "2",
    leaveType: "annual",
    startDate: "2025-10-01",
    endDate: "2025-10-05",
    status: "approved",
    reason: "Family vacation",
    comment: "Approved. Have a great time!"
  },
  {
    id: "2",
    userId: "2",
    leaveType: "sick",
    startDate: "2025-09-15",
    endDate: "2025-09-16",
    status: "approved",
    reason: "Doctor's appointment",
  },
  {
    id: "3",
    userId: "2",
    leaveType: "personal",
    startDate: "2025-11-20",
    endDate: "2025-11-20",
    status: "pending",
    reason: "Personal matters"
  }
]

type LocalDb = {
  users: User[]
  requests: LeaveRequest[]
  activityLogs: ActivityLog[]
}

const DB_KEY = "leaveDb"

function loadDb(): LocalDb {
  if (typeof window === "undefined") return { users: seedUsers, requests: seedRequests, activityLogs: [] }
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const db: LocalDb = { users: seedUsers, requests: seedRequests, activityLogs: [] }
    localStorage.setItem(DB_KEY, JSON.stringify(db))
    return db
  }
  try {
    const parsed = JSON.parse(raw) as LocalDb
    // Ensure activityLogs exists for backward compatibility
    if (!parsed.activityLogs) {
      parsed.activityLogs = []
    }
    return parsed
  } catch {
    const db: LocalDb = { users: seedUsers, requests: seedRequests, activityLogs: [] }
    localStorage.setItem(DB_KEY, JSON.stringify(db))
    return db
  }
}

function saveDb(db: LocalDb) {
  if (typeof window === "undefined") return
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export const mockDataService = {
  login: (email: string, password: string): Promise<{ user: User; token: string }> => {
    return new Promise((resolve, reject) => {
      const db = loadDb()
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (user) {
        const token = btoa(JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
          exp: Date.now() + 24 * 60 * 60 * 1000,
        }))
        resolve({ user, token })
      } else {
        reject(new Error("Invalid credentials"))
      }
    })
  },

  getUsers: (): Promise<User[]> => {
    const db = loadDb()
    return Promise.resolve(db.users)
  },

  getUserById: (userId: string): Promise<User | undefined> => {
    const db = loadDb()
    return Promise.resolve(db.users.find(u => u.id === userId))
  },

  getMyRequests: (userId: string): Promise<LeaveRequest[]> => {
    const db = loadDb()
    const requests = db.requests.filter(r => r.userId === userId)
    return Promise.resolve(requests)
  },

  getAllRequests: (): Promise<LeaveRequest[]> => {
    const db = loadDb()
    return Promise.resolve(db.requests)
  },

  submitRequest: (request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    const db = loadDb()
    const newRequest: LeaveRequest = {
      ...request,
      id: (db.requests.length + 1).toString(),
      status: "pending",
    }
    db.requests.unshift(newRequest)
    saveDb(db)
    return Promise.resolve(newRequest)
  },

  updateRequestStatus: (requestId: string, status: "approved" | "rejected", comment?: string): Promise<LeaveRequest> => {
    const db = loadDb()
    const request = db.requests.find(r => r.id === requestId)
    if (!request) return Promise.reject(new Error("Request not found"))
    
    const previousStatus = request.status
    request.status = status
    request.comment = comment
    
    // Log the activity
    const user = db.users.find(u => u.id === request.userId)
    const adminUser = db.users.find(u => u.role === 'admin')
    
    if (user && adminUser) {
      const activityLog: ActivityLog = {
        id: (db.activityLogs.length + 1).toString(),
        userId: adminUser.id,
        userName: adminUser.name,
        action: status === "approved" ? "leave_approved" : "leave_rejected",
        description: `${adminUser.name} ${status} leave request from ${user.name}`,
        details: {
          leaveRequestId: request.id,
          leaveType: request.leaveType,
          startDate: request.startDate,
          endDate: request.endDate,
          previousStatus,
          newStatus: status,
          comment
        },
        timestamp: new Date().toISOString()
      }
      db.activityLogs.unshift(activityLog)
    }
    
    saveDb(db)
    return Promise.resolve(request)
  },

  logActivity: (userId: string, action: ActivityLog['action'], description: string, details?: ActivityLog['details']): Promise<ActivityLog> => {
    const db = loadDb()
    const user = db.users.find(u => u.id === userId)
    if (!user) return Promise.reject(new Error("User not found"))
    
    const activityLog: ActivityLog = {
      id: (db.activityLogs.length + 1).toString(),
      userId: user.id,
      userName: user.name,
      action,
      description,
      details,
      timestamp: new Date().toISOString()
    }
    
    db.activityLogs.unshift(activityLog)
    saveDb(db)
    return Promise.resolve(activityLog)
  },

  getActivityLogs: (limit?: number): Promise<ActivityLog[]> => {
    const db = loadDb()
    const logs = db.activityLogs
    if (limit) {
      return Promise.resolve(logs.slice(0, limit))
    }
    return Promise.resolve(logs)
  },
}
