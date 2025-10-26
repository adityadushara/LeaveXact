"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { leaveAPI, adminAPI } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  TrendingUp,
  FileText,
  AlertCircle,
  Eye,
  Check,
  X,
  User,
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit
} from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import Link from "next/link"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  employeeId: string
  gender?: string
  leaveBalance?: {
    annual: number
    sick: number
    personal: number
  }
}

interface LeaveRequest {
  id: string
  userId: {
    id: string
    name: string
    email: string
    role: string
    department: string
    employeeId: string
    gender?: string
    leaveBalance?: {
      annual: number
      sick: number
      personal: number
    }
  } | string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  comment?: string
  appliedAt: string
}

interface DashboardStats {
  totalEmployees: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  currentlyOnLeave: number
  upcomingLeaves: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    currentlyOnLeave: 0,
    upcomingLeaves: 0
  })
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [adminComments, setAdminComments] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [currentOnLeavePage, setCurrentOnLeavePage] = useState(1)
  const [upcomingLeavesPage, setUpcomingLeavesPage] = useState(1)
  const [pendingRequestsPage, setPendingRequestsPage] = useState(1)
  const [rejectedRequestsPage, setRejectedRequestsPage] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const itemsPerPage = 5

  const { addToast } = useToast()

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string | undefined, formatString: string, fallback: string = "—") => {
    if (!dateString) return fallback

    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString)
      if (isValid(date)) {
        return format(date, formatString)
      }
    } catch (error) {
      console.warn('Invalid date format:', dateString, error)
    }

    return fallback
  }

  // Helper function to get the applied date from a request (handles both appliedAt and appliedDate)
  const getAppliedDate = (request: any) => {
    return request.appliedAt || request.appliedDate
  }

  // Helper function to get the leave type from a request (handles both leaveType and type)
  const getLeaveType = (request: any) => {
    return request.leaveType || request.type
  }

  // Helper function to get employee details from a request
  const getEmployeeFromRequest = (request: LeaveRequest, employeesList: Employee[] = employees): Employee | null => {
    // If userId is an object with user details, return it directly
    if (request.userId && typeof request.userId === 'object') {
      if ('name' in request.userId && request.userId.name) {
        return request.userId as any as Employee
      }
    }

    // Otherwise, try to find the employee in the employees list using the ID
    const userId = typeof request.userId === 'object' ? (request.userId as any).id : request.userId

    const employee = employeesList.find(emp => {
      return emp.id === userId ||
        emp.id === String(userId) ||
        String(emp.id) === String(userId) ||
        emp.employeeId === userId ||
        emp.employeeId === String(userId)
    })

    return employee || null
  }

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Helper to normalize date to YYYY-MM-DD format
  const normalizeDateString = (dateStr: string) => {
    if (!dateStr) return ''
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
    // Otherwise parse and format
    return new Date(dateStr).toISOString().split('T')[0]
  }

  const isLeaveRequestPast = (request: LeaveRequest) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison
    const endDate = new Date(request.endDate)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today
  }

  const fetchDashboardData = async () => {
    try {
      const [allRequestsData, users] = await Promise.all([
        leaveAPI.getAllRequests(),
        adminAPI.getEmployees(),
        // Add a minimum delay to show skeleton animation (400ms)
        new Promise(resolve => setTimeout(resolve, 400))
      ])

      // Set employees first so helper functions can use it
      setEmployees(users)

      // Filter out admin users - only count regular employees
      const totalEmployees = users.filter((user: any) => user.role !== 'admin').length
      const pendingRequests = allRequestsData.filter((r: LeaveRequest) => r.status === "pending" && !isLeaveRequestPast(r)).length
      const approvedRequests = allRequestsData.filter((r: LeaveRequest) => r.status === "approved").length
      const rejectedRequests = allRequestsData.filter((r: LeaveRequest) => r.status === "rejected").length

      // Calculate currently on leave and upcoming leaves
      const todayStr = getTodayString()

      const currentlyOnLeave = allRequestsData.filter((r: LeaveRequest) => {
        const normalizedStart = normalizeDateString(r.startDate)
        const normalizedEnd = normalizeDateString(r.endDate)
        return r.status === "approved" && normalizedStart <= todayStr && todayStr <= normalizedEnd
      }).length

      // Calculate upcoming leaves for next 7 days
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const nextWeekStr = nextWeek.toISOString().split('T')[0]

      const upcomingLeaves = allRequestsData.filter((r: LeaveRequest) => {
        if (r.status !== "approved") return false
        const normalizedStart = normalizeDateString(r.startDate)
        return normalizedStart > todayStr && normalizedStart <= nextWeekStr
      }).length

      setStats({ totalEmployees, pendingRequests, approvedRequests, rejectedRequests, currentlyOnLeave, upcomingLeaves })
      setAllRequests(allRequestsData)
      setEmployees(users)
      setIsLoading(false)
    } catch (error: any) {
      addToast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const getEmployeesOnLeave = () => {
    const today = new Date()
    const todayStr = getTodayString()

    const employeesOnLeave: Array<{
      employee: Employee
      request: LeaveRequest
      daysRemaining: number
    }> = []

    allRequests.forEach((request: LeaveRequest) => {
      const normalizedStart = normalizeDateString(request.startDate)
      const normalizedEnd = normalizeDateString(request.endDate)
      const isOnLeave = request.status === "approved" &&
        normalizedStart <= todayStr &&
        todayStr <= normalizedEnd

      if (isOnLeave) {
        const employee = getEmployeeFromRequest(request)
        if (employee) {
          const endDate = new Date(request.endDate)
          const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          employeesOnLeave.push({
            employee,
            request,
            daysRemaining: Math.max(0, daysRemaining)
          })
        }
      }
    })

    return employeesOnLeave
  }

  const getPendingRequests = () => {
    return allRequests
      .filter((request: LeaveRequest) => request.status === "pending")
      .sort((a, b) => {
        // Sort expired requests to the end
        const aExpired = isLeaveRequestPast(a)
        const bExpired = isLeaveRequestPast(b)
        if (aExpired && !bExpired) return 1
        if (!aExpired && bExpired) return -1
        // Otherwise sort by applied date (newest first)
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      })
  }

  const getRejectedRequests = () => {
    return allRequests
      .filter((request: LeaveRequest) => request.status === "rejected")
      .sort((a, b) => {
        // Sort by applied date (newest first)
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      })
  }

  const getUpcomingLeaves = () => {
    const today = new Date()
    const todayStr = getTodayString()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    const upcomingLeaves: Array<{
      employee: Employee
      request: LeaveRequest
      daysUntilStart: number
    }> = []

    allRequests.forEach((request: LeaveRequest) => {
      if (request.status === "approved") {
        const normalizedStart = normalizeDateString(request.startDate)
        const isUpcoming = normalizedStart > todayStr && normalizedStart <= nextWeekStr

        if (isUpcoming) {
          const employee = getEmployeeFromRequest(request)
          if (employee) {
            const startDate = new Date(request.startDate)
            const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            upcomingLeaves.push({
              employee,
              request,
              daysUntilStart
            })
          }
        }
      }
    })

    return upcomingLeaves.sort((a, b) => a.daysUntilStart - b.daysUntilStart)
  }

  const getStatusIcon = (status: string, request?: any) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        if (request && isLeaveRequestPast(request)) {
          return <Clock className="h-4 w-4 text-gray-400" />
        }
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="text-white hover:opacity-90" style={{ backgroundColor: '#16A34A' }}>Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleRequestCardClick = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setAdminComments(request.comment || "")
    setIsRequestDialogOpen(true)
  }

  const handleStatusUpdate = async (requestId: string, status: "approved" | "rejected") => {
    setIsUpdating(true)
    try {
      await leaveAPI.updateRequestStatus(requestId, status, adminComments)

      addToast({
        title: "Request Updated",
        description: `Leave request has been ${status}`,
      })

      // Refresh data
      await fetchDashboardData()
      setIsRequestDialogOpen(false)
      setAdminComments("")
    } catch (error: any) {
      addToast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update request",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    setIsDeleting(true)
    try {
      await leaveAPI.deleteRequest(requestId)

      addToast({
        title: "Request Deleted",
        description: "Leave request has been deleted successfully",
      })

      // Refresh data
      await fetchDashboardData()
      setIsDeleteDialogOpen(false)
      setRequestToDelete(null)
    } catch (error: any) {
      addToast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to delete request",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Show skeleton loading while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse" />
        </div>

        <div className="space-y-6">
          {/* Stats Cards Skeleton - 6 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white shadow-sm p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
              </div>
            ))}
          </div>

          {/* Employees on Leave & Upcoming Leaves Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currently on Leave Skeleton */}
            <div className="rounded-lg bg-white shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-6 w-56 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse" />
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse ml-auto" />
                        <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse ml-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Leaves Skeleton */}
            <div className="rounded-lg bg-white shadow-sm p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-56 bg-gray-100 rounded-md animate-pulse" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse" />
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse ml-auto" />
                        <div className="h-4 w-28 bg-gray-100 rounded-md animate-pulse ml-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Requests Card Skeleton */}
          <div className="rounded-lg bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-64 bg-gray-100 rounded-md animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejected Requests Card Skeleton */}
          <div className="rounded-lg bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <div className="h-6 w-56 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-72 bg-gray-100 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-24 bg-gray-100 rounded-md animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-500">Manage leave requests and monitor team activity</p>
        </div>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Clock className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"></div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">Pending</CardTitle>
                <CardDescription className="text-sm text-gray-500">Awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground group-hover:text-yellow-600 transition-colors duration-300">
                    {stats.pendingRequests}
                  </span>
                  <span className="text-sm text-muted-foreground">requests</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <User className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"></div>
                  </div>
                  <Activity className="h-4 w-4 text-orange-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">On Leave</CardTitle>
                <CardDescription className="text-sm text-gray-500">Absent today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground group-hover:text-orange-600 transition-colors duration-300">
                    {stats.currentlyOnLeave}
                  </span>
                  <span className="text-sm text-muted-foreground">employees</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Calendar className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"></div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Upcoming</CardTitle>
                <CardDescription className="text-sm text-gray-500">Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                    {stats.upcomingLeaves}
                  </span>
                  <span className="text-sm text-muted-foreground">leaves</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Users className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"></div>
                  </div>
                  <Activity className="h-4 w-4 text-purple-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">Employees</CardTitle>
                <CardDescription className="text-sm text-gray-500">Total in system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground group-hover:text-purple-600 transition-colors duration-300">
                    {stats.totalEmployees}
                  </span>
                  <span className="text-sm text-muted-foreground">users</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <CheckCircle className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"></div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">Approved</CardTitle>
                <CardDescription className="text-sm text-gray-500">Total approved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground group-hover:text-green-600 transition-colors duration-300">
                    {stats.approvedRequests}
                  </span>
                  <span className="text-sm text-muted-foreground">requests</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <XCircle className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl"></div>
                  </div>
                  <Activity className="h-4 w-4 text-red-500" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors duration-300">Rejected</CardTitle>
                <CardDescription className="text-sm text-gray-500">Total rejected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground group-hover:text-red-600 transition-colors duration-300">
                    {stats.rejectedRequests}
                  </span>
                  <span className="text-sm text-muted-foreground">requests</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employees Currently on Leave & Upcoming Leaves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employees Currently on Leave */}
            <Card className="border-0 shadow-none bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Employees Currently on Leave</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {getEmployeesOnLeave().length} employee{getEmployeesOnLeave().length !== 1 ? 's' : ''} absent today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getEmployeesOnLeave().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Employees on Leave</h3>
                    <p className="text-sm text-muted-foreground">All employees are present today</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {getEmployeesOnLeave()
                        .slice((currentOnLeavePage - 1) * itemsPerPage, currentOnLeavePage * itemsPerPage)
                        .map(({ employee, request, daysRemaining }) => (
                          <div
                            key={request.id}
                            className="group p-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer border border-gray-100"
                            onClick={() => handleRequestCardClick(request)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-semibold text-white">
                                    {employee?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                    {employee?.name || 'Unknown'}
                                  </h3>
                                  <p className="text-sm text-gray-500">{employee?.department || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="capitalize mb-1">{getLeaveType(request)}</Badge>
                                <p className="text-sm font-medium text-foreground">
                                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {getEmployeesOnLeave().length > itemsPerPage && (
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {((currentOnLeavePage - 1) * itemsPerPage) + 1} to {Math.min(currentOnLeavePage * itemsPerPage, getEmployeesOnLeave().length)} of {getEmployeesOnLeave().length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentOnLeavePage(prev => Math.max(1, prev - 1))}
                            disabled={currentOnLeavePage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentOnLeavePage(prev => Math.min(Math.ceil(getEmployeesOnLeave().length / itemsPerPage), prev + 1))}
                            disabled={currentOnLeavePage >= Math.ceil(getEmployeesOnLeave().length / itemsPerPage)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Leaves */}
            <Card className="border-0 shadow-none bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Leaves</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {getUpcomingLeaves().length} leave{getUpcomingLeaves().length !== 1 ? 's' : ''} starting in the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getUpcomingLeaves().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Leaves</h3>
                    <p className="text-sm text-muted-foreground">No employees are starting their leave in the next 7 days</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {getUpcomingLeaves()
                        .slice((upcomingLeavesPage - 1) * itemsPerPage, upcomingLeavesPage * itemsPerPage)
                        .map(({ employee, request, daysUntilStart }) => (
                          <div
                            key={request.id}
                            className="group p-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer border border-gray-100"
                            onClick={() => handleRequestCardClick(request)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-semibold text-white">
                                    {employee?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                    {employee?.name || 'Unknown'}
                                  </h3>
                                  <p className="text-sm text-gray-500">{employee?.department || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="capitalize mb-1">{getLeaveType(request)}</Badge>
                                <p className="text-sm font-medium text-foreground">
                                  Starts in {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {getUpcomingLeaves().length > itemsPerPage && (
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {((upcomingLeavesPage - 1) * itemsPerPage) + 1} to {Math.min(upcomingLeavesPage * itemsPerPage, getUpcomingLeaves().length)} of {getUpcomingLeaves().length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUpcomingLeavesPage(prev => Math.max(1, prev - 1))}
                            disabled={upcomingLeavesPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUpcomingLeavesPage(prev => Math.min(Math.ceil(getUpcomingLeaves().length / itemsPerPage), prev + 1))}
                            disabled={upcomingLeavesPage >= Math.ceil(getUpcomingLeaves().length / itemsPerPage)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>


          {/* Pending Leave Requests */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Pending Leave Requests</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                {getPendingRequests().length} request{getPendingRequests().length !== 1 ? 's' : ''} awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getPendingRequests().length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Pending Requests</h3>
                  <p className="text-sm text-muted-foreground">All leave requests have been processed</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {getPendingRequests()
                      .slice((pendingRequestsPage - 1) * itemsPerPage, pendingRequestsPage * itemsPerPage)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="group p-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 border border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => handleRequestCardClick(request)}>
                              <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00A73F' }}>
                                <span className="text-sm font-semibold text-white">
                                  {getEmployeeFromRequest(request)?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-[#00A73F]">
                                  {getEmployeeFromRequest(request)?.name || 'Unknown'}
                                </h3>
                                <p className="text-sm text-gray-500">{getEmployeeFromRequest(request)?.department || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                  <Badge variant="outline" className="capitalize">{getLeaveType(request)}</Badge>
                                  {request.status === "pending" && isLeaveRequestPast(request) && (
                                    <Badge variant="destructive" className="bg-muted-foreground hover:bg-muted-foreground/90">Expired</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {safeFormatDate(request.startDate, "MMM dd")} - {safeFormatDate(request.endDate, "MMM dd")}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {request.status === "pending" && !isLeaveRequestPast(request) && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusUpdate(request.id, "rejected")
                                      }}
                                      disabled={isUpdating}
                                      title="Reject request"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusUpdate(request.id, "approved")
                                      }}
                                      disabled={isUpdating}
                                      title="Approve request"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {request.status === "pending" && isLeaveRequestPast(request) && (
                                  <>
                                    <Badge variant="outline" className="text-muted-foreground">
                                      Past Date
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {getPendingRequests().length > itemsPerPage && (
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {((pendingRequestsPage - 1) * itemsPerPage) + 1} to {Math.min(pendingRequestsPage * itemsPerPage, getPendingRequests().length)} of {getPendingRequests().length}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingRequestsPage(prev => Math.max(1, prev - 1))}
                          disabled={pendingRequestsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingRequestsPage(prev => Math.min(Math.ceil(getPendingRequests().length / itemsPerPage), prev + 1))}
                          disabled={pendingRequestsPage >= Math.ceil(getPendingRequests().length / itemsPerPage)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Rejected Leave Requests */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Rejected Leave Requests</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                {getRejectedRequests().length} request{getRejectedRequests().length !== 1 ? 's' : ''} have been rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getRejectedRequests().length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Rejected Requests</h3>
                  <p className="text-sm text-muted-foreground">No leave requests have been rejected</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {getRejectedRequests()
                      .slice((rejectedRequestsPage - 1) * itemsPerPage, rejectedRequestsPage * itemsPerPage)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="group p-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer border border-gray-100"
                          onClick={() => handleRequestCardClick(request)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-white">
                                  {getEmployeeFromRequest(request)?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                                  {getEmployeeFromRequest(request)?.name || 'Unknown'}
                                </h3>
                                <p className="text-sm text-gray-500">{getEmployeeFromRequest(request)?.department || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                  <Badge variant="outline" className="capitalize">{getLeaveType(request)}</Badge>
                                  <Badge variant="destructive">Rejected</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {safeFormatDate(request.startDate, "MMM dd")} - {safeFormatDate(request.endDate, "MMM dd")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {getRejectedRequests().length > itemsPerPage && (
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {((rejectedRequestsPage - 1) * itemsPerPage) + 1} to {Math.min(rejectedRequestsPage * itemsPerPage, getRejectedRequests().length)} of {getRejectedRequests().length}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectedRequestsPage(prev => Math.max(1, prev - 1))}
                          disabled={rejectedRequestsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRejectedRequestsPage(prev => Math.min(Math.ceil(getRejectedRequests().length / itemsPerPage), prev + 1))}
                          disabled={rejectedRequestsPage >= Math.ceil(getRejectedRequests().length / itemsPerPage)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Leave Request Details</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">Review and manage this leave request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Employee</p>
                  <p className="text-base font-semibold text-slate-900">{getEmployeeFromRequest(selectedRequest)?.name || 'Unknown'}</p>
                  <p className="text-sm text-slate-600">{getEmployeeFromRequest(selectedRequest)?.employeeId || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Department</p>
                  <p className="text-base font-medium text-slate-900">{getEmployeeFromRequest(selectedRequest)?.department || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Leave Type</p>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 capitalize">
                    {getLeaveType(selectedRequest)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</p>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date</p>
                  <p className="text-base font-medium text-slate-900">{safeFormatDate(selectedRequest.startDate, "MMMM dd, yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</p>
                  <p className="text-base font-medium text-slate-900">{safeFormatDate(selectedRequest.endDate, "MMMM dd, yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Duration</p>
                  <p className="text-base font-semibold text-slate-900">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Applied On</p>
                  <p className="text-base font-medium text-slate-900">
                    {safeFormatDate(getAppliedDate(selectedRequest), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reason</p>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                  <p className="text-sm text-slate-700">{selectedRequest.reason || 'No reason provided'}</p>
                </div>
              </div>
              {selectedRequest.status === "pending" && !isLeaveRequestPast(selectedRequest) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Add Comment (Optional)</p>
                  <Textarea
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                    placeholder="Add a comment for the employee..."
                    rows={3}
                    className="bg-slate-50 border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-400 rounded-lg resize-none"
                    disabled={isUpdating}
                  />
                </div>
              )}
              {selectedRequest.status !== "pending" && selectedRequest.comment && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Admin Comment</p>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-700">{selectedRequest.comment}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedRequest && selectedRequest.status === "pending" && !isLeaveRequestPast(selectedRequest) && (
            <DialogFooter className="gap-2 pt-6 border-t-0">
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
                disabled={isUpdating}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate(selectedRequest.id, "rejected")}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedRequest.id, "approved")}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}
          {selectedRequest && (selectedRequest.status !== "pending" || isLeaveRequestPast(selectedRequest)) && (
            <DialogFooter>
              <Button
                onClick={() => setIsRequestDialogOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setRequestToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
