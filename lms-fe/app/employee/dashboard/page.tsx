"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getUser, setUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { leaveAPI } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import {
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  CalendarDays,
  TrendingUp,
  Clock,
  User,
  Heart,
  Coffee,
  Home,
  ArrowRight,
  Star,
  Activity,
  Sparkles,
  Zap,
  Edit,
  Trash2,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format, isValid, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

export default function EmployeeDashboard() {
  const router = useRouter()
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

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
    const type = request.leaveType || request.type
    // Capitalize first letter
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : type
  }
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const { addToast } = useToast()
  const user = getUser()
  const [currentUser, setCurrentUser] = useState<any>(user)

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [editLeaveType, setEditLeaveType] = useState("")
  const [editStartDate, setEditStartDate] = useState<Date>()
  const [editEndDate, setEditEndDate] = useState<Date>()
  const [editReason, setEditReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const isLeaveRequestExpired = (request: any) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison
    const endDate = new Date(request.endDate)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today && request.status === "pending"
  }

  const getStatusBadge = (request: any) => {
    if (isLeaveRequestExpired(request) || request.status === "expired") {
      return (
        <Badge className="bg-gray-300 text-gray-700 text-xs hover:scale-110 transition-transform duration-300">
          Expired
        </Badge>
      )
    }

    switch (request.status) {
      case "approved":
        return (
          <Badge className="text-white text-xs hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#16A34A' }}>
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="text-xs hover:scale-110 transition-transform duration-300">
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="text-yellow-800 text-xs hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#FEF8D9' }}>
            Pending
          </Badge>
        )
    }
  }

  useEffect(() => {
    setMounted(true)

    if (!user) {
      router.replace("/login")
      return
    }

    console.log('[DASHBOARD] User object:', user)
    console.log('[DASHBOARD] User ID:', user.id || (user as any)._id || user.employee_id)

    // Ultra-fast: Preload navigation links for instant switching
    const preloadLinks = () => {
      const links = ['/employee/apply', '/employee/requests']
      links.forEach(link => {
        const linkElement = document.createElement('link')
        linkElement.rel = 'prefetch'
        linkElement.href = link
        document.head.appendChild(linkElement)
      })
    }

    // Preload immediately
    preloadLinks()

    // Ultra-fast: No loading states, immediate rendering
    if (hasFetched) {
      return
    }

    // Background data fetch - completely non-blocking
    const fetchData = async () => {
      try {
        // Handle different user ID field names
        const userId = user.id || (user as any)._id || user.employee_id
        console.log('[DASHBOARD] Fetching user data with ID:', userId)

        const [requests, freshUser] = await Promise.all([
          leaveAPI.getMyRequests().catch(() => []),
          // Fetch fresh user data from /api/auth/me
          fetch(`/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          }).then((r) => {
            if (!r.ok) return user; // Fallback to cached user
            return r.json().then(data => {
              console.log('[DASHBOARD] Fresh user data:', data);
              // Ensure leaveBalance exists with all fields
              if (data && !data.leaveBalance) {
                data.leaveBalance = {
                  annual: data.annual_leave ?? data.leaveBalance?.annual ?? 20,
                  sick: data.sick_leave ?? data.leaveBalance?.sick ?? 10,
                  personal: data.personal_leave ?? data.leaveBalance?.personal ?? 5,
                  emergency: data.emergency_leave ?? data.leaveBalance?.emergency ?? 5,
                  maternity: data.maternity_leave ?? data.leaveBalance?.maternity ?? 90,
                  paternity: data.paternity_leave ?? data.leaveBalance?.paternity ?? 15
                };
              } else if (data && data.leaveBalance) {
                // Ensure all fields exist in leaveBalance
                data.leaveBalance = {
                  annual: data.leaveBalance.annual ?? 20,
                  sick: data.leaveBalance.sick ?? 10,
                  personal: data.leaveBalance.personal ?? 5,
                  emergency: data.leaveBalance.emergency ?? 5,
                  maternity: data.leaveBalance.maternity ?? 90,
                  paternity: data.leaveBalance.paternity ?? 15
                };
              }
              return data;
            });
          }).catch((err) => {
            console.error('[DASHBOARD] Error fetching user:', err);
            return user; // Fallback to cached user
          }),
          // Add a minimum delay to show skeleton animation (400ms)
          new Promise(resolve => setTimeout(resolve, 400))
        ])

        if (requests && requests.length > 0) {
          const sortedRequests = requests.sort((a: any, b: any) => {
            const dateA = new Date(a.appliedAt || a.startDate)
            const dateB = new Date(b.appliedAt || b.startDate)
            return dateB.getTime() - dateA.getTime()
          })
          setRecentRequests(sortedRequests.slice(0, 5))
        }

        if (freshUser) {
          setCurrentUser(freshUser)
          setUser(freshUser)
        }

        setHasFetched(true)
        setIsLoading(false)
      } catch (error) {
        // Silent error handling - don't block UI
        console.warn('Background data fetch failed:', error)
        setIsLoading(false)
      }
    }

    // Fire and forget - don't await
    fetchData()
  }, [hasFetched])

  const getStatusIcon = (status: string, request?: any) => {
    // Check if the request is expired
    if (request && (isLeaveRequestExpired(request) || request.status === "expired")) {
      return <Clock className="h-4 w-4 text-gray-500" />
    }

    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Calendar className="h-4 w-4 text-yellow-600" />
    }
  }

  const getHoverTextColor = (request: any) => {
    // Check if the request is expired
    if (isLeaveRequestExpired(request) || request.status === "expired") {
      return "group-hover:text-gray-600"
    }

    switch (request.status) {
      case "approved":
        return "group-hover:text-green-600"
      case "rejected":
        return "group-hover:text-red-600"
      default:
        return "group-hover:text-yellow-600"
    }
  }

  const handleLeaveCardClick = (leaveType: string) => {
    console.log('Leave card clicked:', leaveType)
    setSelectedLeaveType(leaveType)
    setIsDialogOpen(true)
  }

  const handleRequestCardClick = (request: any) => {
    console.log('Request card clicked:', request)
    setSelectedRequest(request)
    setIsRequestDialogOpen(true)
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleEdit = (request: any) => {
    if (request.status !== "pending") {
      addToast({
        title: "Cannot Edit",
        description: "Only pending requests can be edited",
        variant: "destructive",
      })
      return
    }

    if (isLeaveRequestExpired(request)) {
      addToast({
        title: "Cannot Edit",
        description: "Expired requests cannot be edited",
        variant: "destructive",
      })
      return
    }

    setEditingRequest(request)
    setEditLeaveType(request.leaveType || request.type)
    setEditStartDate(parseISO(request.startDate))
    setEditEndDate(parseISO(request.endDate))
    setEditReason(request.reason)
    setIsRequestDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleUpdateRequest = async () => {
    if (!editLeaveType || !editStartDate || !editEndDate || !editReason.trim()) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (editStartDate > editEndDate) {
      addToast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      await leaveAPI.updateRequest(editingRequest.id, {
        leave_type: editLeaveType,
        start_date: format(editStartDate, "yyyy-MM-dd"),
        end_date: format(editEndDate, "yyyy-MM-dd"),
        reason: editReason.trim(),
      })

      addToast({
        title: "Success",
        description: "Leave request updated successfully",
      })

      setIsEditDialogOpen(false)
      setHasFetched(false)
      // Refresh data
      window.location.reload()
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Ultra-fast: Memoize expensive calculations
  const getLeaveDetails = useMemo(() => (leaveType: string) => {
    const safeBalance = currentUser?.leaveBalance || { annual: 0, sick: 0, personal: 0, emergency: 0, maternity: 0, paternity: 0 }
    const details = {
      annual: {
        title: "Annual Leave",
        description: "Vacation days for personal time off and rest",
        totalDays: 20,
        usedDays: 20 - safeBalance.annual,
        remainingDays: safeBalance.annual,
        icon: <CalendarDays className="h-8 w-8 text-blue-500" />,
        color: "blue",
        benefits: [
          "Paid time off for personal activities",
          "Must be requested at least 2 weeks in advance",
          "Maximum 5 consecutive days per request",
          "Subject to manager approval"
        ]
      },
      sick: {
        title: "Sick Leave",
        description: "Time off for health-related issues and medical appointments",
        totalDays: 10,
        usedDays: 10 - safeBalance.sick,
        remainingDays: safeBalance.sick,
        icon: <Heart className="h-8 w-8 text-red-500" />,
        color: "red",
        benefits: [
          "Paid time off for illness or medical appointments",
          "Can be requested with short notice",
          "Medical certificate required for 3+ consecutive days",
          "Subject to manager approval"
        ]
      },
      personal: {
        title: "Personal Leave",
        description: "Flexible time off for personal matters and emergencies",
        totalDays: 5,
        usedDays: 5 - safeBalance.personal,
        remainingDays: safeBalance.personal,
        icon: <Coffee className="h-8 w-8 text-purple-500" />,
        color: "purple",
        benefits: [
          "Paid time off for personal matters",
          "Can be used for family emergencies",
          "Must be requested at least 1 week in advance",
          "Subject to manager approval"
        ]
      },
      emergency: {
        title: "Emergency Leave",
        description: "Immediate time off for urgent personal situations",
        totalDays: 5,
        usedDays: 5 - safeBalance.emergency,
        remainingDays: safeBalance.emergency,
        icon: <Home className="h-8 w-8 text-orange-500" />,
        color: "orange",
        benefits: [
          "Paid time off for emergency situations",
          "Can be requested with immediate notice",
          "For urgent personal or family matters",
          "Subject to manager approval"
        ]
      },
      maternity: {
        title: "Maternity Leave",
        description: "Extended time off for childbirth and recovery",
        totalDays: 90,
        usedDays: 90 - safeBalance.maternity,
        remainingDays: safeBalance.maternity,
        icon: <Heart className="h-8 w-8 text-pink-500" />,
        color: "pink",
        benefits: [
          "Paid time off for childbirth and recovery",
          "One-time use per pregnancy",
          "Must be requested at least 1 month in advance",
          "Subject to HR and manager approval"
        ]
      },
      paternity: {
        title: "Paternity Leave",
        description: "Time off for newborn care and family support",
        totalDays: 15,
        usedDays: 15 - safeBalance.paternity,
        remainingDays: safeBalance.paternity,
        icon: <User className="h-8 w-8 text-indigo-500" />,
        color: "indigo",
        benefits: [
          "Paid time off for newborn care",
          "Support your partner and family",
          "Must be requested at least 2 weeks in advance",
          "Subject to manager approval"
        ]
      }
    }
    return details[leaveType as keyof typeof details] || details.annual
  }, [currentUser?.leaveBalance])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse mb-1" />
          <div className="h-5 w-80 bg-gray-200 rounded-md animate-pulse" />
        </div>

        <div className="space-y-6">
          {/* Leave Balance Cards Skeleton - 5 cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-none bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse mb-2" />
                  <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="h-9 w-12 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 w-10 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-none bg-white">
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="md:col-span-2 border-0 shadow-none bg-white">
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-3 w-48 bg-gray-200 rounded-md animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Leave Requests */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-56 bg-gray-200 rounded-md animate-pulse" />
                </div>
                <div className="h-9 w-24 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {currentUser.name}!</p>
        </div>

        <div className="space-y-6">
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card
              className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white cursor-pointer"
              onClick={() => handleLeaveCardClick('annual')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <CalendarDays className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">Annual Leave</CardTitle>
                <CardDescription>Vacation days remaining</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold transition-colors duration-300 ${(currentUser.leaveBalance?.annual ?? 0) <= 2
                    ? 'text-red-600 group-hover:text-red-700'
                    : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                    {currentUser.leaveBalance?.annual ?? 0}
                  </span>
                  <span className="text-sm text-gray-500">days</span>
                  {(currentUser.leaveBalance?.annual ?? 0) <= 2 && (
                    <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${(currentUser.leaveBalance?.annual ?? 0) <= 2
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                    style={{ width: `${(((currentUser.leaveBalance?.annual ?? 0) / 20) * 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white cursor-pointer"
              onClick={() => handleLeaveCardClick('sick')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Heart className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <Activity className="h-4 w-4 text-red-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-red-600 transition-colors duration-300">Sick Leave</CardTitle>
                <CardDescription>Health-related days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold transition-colors duration-300 ${(currentUser.leaveBalance?.sick ?? 0) <= 2
                    ? 'text-red-600 group-hover:text-red-700'
                    : 'text-gray-900 group-hover:text-red-600'
                    }`}>
                    {currentUser.leaveBalance?.sick ?? 0}
                  </span>
                  <span className="text-sm text-gray-500">days</span>
                  {(currentUser.leaveBalance?.sick ?? 0) <= 2 && (
                    <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(((currentUser.leaveBalance?.sick ?? 0) / 10) * 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white cursor-pointer"
              onClick={() => handleLeaveCardClick('personal')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Coffee className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <Star className="h-4 w-4 text-purple-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-purple-600 transition-colors duration-300">Personal Leave</CardTitle>
                <CardDescription>Personal time off</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold transition-colors duration-300 ${(currentUser.leaveBalance?.personal ?? 0) <= 2
                    ? 'text-red-600 group-hover:text-red-700'
                    : 'text-gray-900 group-hover:text-purple-600'
                    }`}>
                    {currentUser.leaveBalance?.personal ?? 0}
                  </span>
                  <span className="text-sm text-gray-500">days</span>
                  {(currentUser.leaveBalance?.personal ?? 0) <= 2 && (
                    <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(((currentUser.leaveBalance?.personal ?? 0) / 5) * 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white cursor-pointer"
              onClick={() => handleLeaveCardClick('emergency')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Home className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <Activity className="h-4 w-4 text-orange-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-orange-600 transition-colors duration-300">Emergency Leave</CardTitle>
                <CardDescription>Emergency situations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold transition-colors duration-300 ${(currentUser.leaveBalance?.emergency ?? 0) <= 2
                    ? 'text-red-600 group-hover:text-red-700'
                    : 'text-gray-900 group-hover:text-orange-600'
                    }`}>
                    {currentUser.leaveBalance?.emergency ?? 0}
                  </span>
                  <span className="text-sm text-gray-500">days</span>
                  {(currentUser.leaveBalance?.emergency ?? 0) <= 2 && (
                    <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(((currentUser.leaveBalance?.emergency ?? 0) / 5) * 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Maternity Leave - Only for Female */}
            {currentUser.gender?.toLowerCase() === 'female' && (
              <Card
                className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white cursor-pointer"
                onClick={() => handleLeaveCardClick('maternity')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                      <Heart className="h-6 w-6 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                    </div>
                    <Star className="h-4 w-4 text-pink-500" />
                  </div>
                  <CardTitle className="text-lg font-semibold group-hover:text-pink-600 transition-colors duration-300">Maternity Leave</CardTitle>
                  <CardDescription>Childbirth & recovery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold transition-colors duration-300 ${(currentUser.leaveBalance?.maternity ?? 0) <= 2
                      ? 'text-red-600 group-hover:text-red-700'
                      : 'text-gray-900 group-hover:text-pink-600'
                      }`}>
                      {currentUser.leaveBalance?.maternity ?? 0}
                    </span>
                    <span className="text-sm text-gray-500">days</span>
                    {(currentUser.leaveBalance?.maternity ?? 0) <= 2 && (
                      <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                    )}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(((currentUser.leaveBalance?.maternity ?? 0) / 90) * 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paternity Leave - Only for Male */}
            {currentUser.gender?.toLowerCase() === 'male' && (
              <Card
                className="group hover:shadow-md transition-all duration-300 border-0 shadow-none bg-white cursor-pointer"
                onClick={() => handleLeaveCardClick('paternity')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                      <User className="h-6 w-6 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                    </div>
                    <Star className="h-4 w-4 text-indigo-500" />
                  </div>
                  <CardTitle className="text-lg font-semibold group-hover:text-indigo-600 transition-colors duration-300">Paternity Leave</CardTitle>
                  <CardDescription>Newborn care & support</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold transition-colors duration-300 ${(currentUser.leaveBalance?.paternity ?? 0) <= 2
                      ? 'text-red-600 group-hover:text-red-700'
                      : 'text-gray-900 group-hover:text-indigo-600'
                      }`}>
                      {currentUser.leaveBalance?.paternity ?? 0}
                    </span>
                    <span className="text-sm text-gray-500">days</span>
                    {(currentUser.leaveBalance?.paternity ?? 0) <= 2 && (
                      <Badge variant="destructive" className="text-xs">Low Balance</Badge>
                    )}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(((currentUser.leaveBalance?.paternity ?? 0) / 15) * 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions Card */}
            <Card className="border-0 shadow-none bg-white lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="text-sm text-gray-500">Manage your leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/employee/apply" className="block">
                    <div className="p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Plus className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Apply for Leave</div>
                          <div className="text-xs text-gray-500">Submit a new leave request</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/employee/requests" className="block">
                    <div className="p-4 rounded-xl bg-[#019866]/5 hover:bg-[#019866]/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#019866] flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">View Requests</div>
                          <div className="text-xs text-gray-500">Check status of your requests</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/employee/calendar" className="block">
                    <div className="p-4 rounded-xl bg-[#4FD1A1]/10 hover:bg-[#4FD1A1]/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#4FD1A1] flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Check Calendar</div>
                          <div className="text-xs text-gray-500">View your leave schedule</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card className="border-0 shadow-none bg-white lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="text-sm text-gray-500">Your latest leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.slice(0, 3).map((request, index) => (
                      <div
                        key={`${request.id}-${request.startDate}-${request.endDate}-${index}`}
                        className="flex items-start gap-3 p-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleRequestCardClick(request)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(request.status, request)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{getLeaveType(request)} Leave {request.status === "approved" ? "Approved" : request.status === "rejected" ? "Rejected" : "Submitted"}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {request.status === "approved" ? "Your " + getLeaveType(request).toLowerCase() + " leave has been approved." :
                                  request.status === "rejected" ? "Your " + getLeaveType(request).toLowerCase() + " leave request was rejected." :
                                    "You submitted a request for " + getLeaveType(request).toLowerCase() + " leave."}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 whitespace-nowrap">
                              {safeFormatDate(getAppliedDate(request), "MMM d")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-transparent rounded-xl">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No recent requests</p>
                    <p className="text-xs text-gray-500 mt-1">New activities will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Leave Requests */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">All Leave Requests</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Your complete leave history</CardDescription>
                </div>
                <Link href="/employee/requests">
                  <Button variant="outline" size="sm" className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 transition-colors">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request, index) => (
                    <div
                      key={`${request.id}-${request.startDate}-${request.endDate}-${index}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-300 group cursor-pointer"
                      onClick={() => handleRequestCardClick(request)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="group-hover:scale-110 transition-transform duration-300">
                          {getStatusIcon(request.status, request)}
                        </div>
                        <div>
                          <div className={`font-semibold text-gray-900 transition-colors duration-300 ${getHoverTextColor(request)}`}>{getLeaveType(request)} Leave</div>
                          <div className="text-sm text-gray-600">{request.reason}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {safeFormatDate(request.startDate, "MMM d, yyyy")} - {safeFormatDate(request.endDate, "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(request)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="relative">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave requests yet</h3>
                  <p className="text-gray-500 mb-4">Start by applying for your first leave request</p>
                  <Link href="/employee/apply">
                    <Button className="group hover:scale-105 transition-all duration-300 hover:shadow-lg">
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Apply for Leave
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Leave Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          console.log('Dialog state changing:', open)
          setIsDialogOpen(open)
        }}>
          <DialogContent className="max-w-2xl animate-in fade-in duration-500">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedLeaveType && getLeaveDetails(selectedLeaveType).icon}
                {selectedLeaveType && getLeaveDetails(selectedLeaveType).title}
              </DialogTitle>
              <DialogDescription>
                {selectedLeaveType && getLeaveDetails(selectedLeaveType).description}
              </DialogDescription>
            </DialogHeader>

            {selectedLeaveType && (
              <div className="space-y-6">
                {/* Leave Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {getLeaveDetails(selectedLeaveType).totalDays}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Days</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">
                      {getLeaveDetails(selectedLeaveType).usedDays}
                    </div>
                    <div className="text-sm text-muted-foreground">Used Days</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-500">
                      {getLeaveDetails(selectedLeaveType).remainingDays}
                    </div>
                    <div className="text-sm text-muted-foreground">Remaining</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leave Usage</span>
                    <span>{getLeaveDetails(selectedLeaveType).usedDays} / {getLeaveDetails(selectedLeaveType).totalDays} days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ease-out ${selectedLeaveType === 'annual' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        selectedLeaveType === 'sick' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}
                      style={{
                        width: `${(getLeaveDetails(selectedLeaveType).usedDays / getLeaveDetails(selectedLeaveType).totalDays) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Benefits and Rules */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Leave Policy & Benefits</h4>
                  <ul className="space-y-2">
                    {getLeaveDetails(selectedLeaveType).benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 group hover:scale-105 transition-all duration-300 hover:shadow-lg"
                    onClick={() => {
                      setIsDialogOpen(false)
                      // Navigate to apply page with pre-selected leave type
                      try { router.push(`/employee/apply?type=${selectedLeaveType}`) } catch { }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                    Apply for {getLeaveDetails(selectedLeaveType).title}
                  </Button>
                  <Button
                    variant="outline"
                    className="group hover:scale-105 transition-all duration-300 hover:shadow-md"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Request Details Dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={(open) => {
          console.log('Request dialog state changing:', open)
          setIsRequestDialogOpen(open)
        }}>
          <DialogContent className="max-w-xl">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-900 capitalize">
                    {selectedRequest && `${getLeaveType(selectedRequest)} Leave`}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Detailed information about your leave request
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 py-2">
                {/* Status Badge */}
                <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {safeFormatDate(selectedRequest.startDate, "MMM dd, yyyy")} - {safeFormatDate(selectedRequest.endDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div>{getStatusBadge(selectedRequest)}</div>
                </div>

                {/* Request Information Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Request Information</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Request ID</p>
                      <p className="text-sm font-medium text-slate-900">{selectedRequest.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Leave Type</p>
                      <p className="text-sm font-medium text-slate-900 capitalize">{getLeaveType(selectedRequest)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Duration</p>
                      <p className="text-sm font-medium text-slate-900">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Applied</p>
                      <p className="text-sm font-medium text-slate-900">
                        {safeFormatDate(getAppliedDate(selectedRequest), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Dates</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-slate-900">{safeFormatDate(selectedRequest.startDate, "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">End Date</p>
                      <p className="text-sm font-medium text-slate-900">{safeFormatDate(selectedRequest.endDate, "MMM dd, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Days</p>
                      <p className="text-sm font-medium text-slate-900">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                    </div>
                  </div>
                </div>

                {/* Reason Section */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Reason for Leave</h3>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedRequest.reason || 'No reason provided'}</p>
                  </div>
                </div>

                {/* Admin Comment if exists */}
                {selectedRequest.comment && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Admin Comment</h3>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedRequest.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedRequest && selectedRequest.status === "pending" && !isLeaveRequestExpired(selectedRequest) && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(selectedRequest)}
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this request?')) {
                      console.log('Delete request:', selectedRequest.id)
                      setIsRequestDialogOpen(false)
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => setIsRequestDialogOpen(false)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 transition-all duration-200"
                >
                  Close
                </Button>
              </div>
            )}
            {selectedRequest && (selectedRequest.status !== "pending" || isLeaveRequestExpired(selectedRequest)) && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => setIsRequestDialogOpen(false)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-200"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Edit Leave Request</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Update your leave request details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Leave Type <span className="text-red-500">*</span>
                </Label>
                <Select value={editLeaveType} onValueChange={setEditLeaveType}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-50 border-slate-200 h-11 hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-colors",
                          !editStartDate && "text-slate-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                        {editStartDate ? format(editStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={editStartDate}
                        onSelect={setEditStartDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-50 border-slate-200 h-11 hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-colors",
                          !editEndDate && "text-slate-400"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                        {editEndDate ? format(editEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={editEndDate}
                        onSelect={setEditEndDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          (editStartDate ? date < editStartDate : false)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={5}
                  placeholder="Provide a reason for your leave..."
                  className="resize-none bg-slate-50 border-slate-200 hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg transition-colors"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-6 border-t-0">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)} 
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRequest}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
              >
                {isUpdating ? "Updating..." : "Update Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}


