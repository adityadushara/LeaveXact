"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/toast"
import { leaveAPI } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import {
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  FileText,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { cn } from "@/lib/utils"

export default function MyRequestsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const user = getUser()

  const [requests, setRequests] = useState<any[]>([])
  const [filteredRequests, setFilteredRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [editLeaveType, setEditLeaveType] = useState("")
  const [editStartDate, setEditStartDate] = useState<Date>()
  const [editEndDate, setEditEndDate] = useState<Date>()
  const [editReason, setEditReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingRequest, setDeletingRequest] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Helper function to get the applied date from a request (handles both appliedAt and applied_at)
  const getAppliedDate = (request: any) => {
    return request.appliedAt || request.applied_at || request.appliedDate || request.applied_date || request.createdAt || request.created_at
  }

  // View details dialog state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.replace("/login")
      return
    }
    if (!hasFetched) {
      fetchRequests()
    }
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchQuery, statusFilter, typeFilter])

  const fetchRequests = async (force = false) => {
    if (hasFetched && !force) return

    setIsLoading(true)
    setHasFetched(true)

    try {
      const data = await leaveAPI.getMyRequests()
      if (Array.isArray(data)) {
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = new Date(getAppliedDate(a) || a.startDate)
          const dateB = new Date(getAppliedDate(b) || b.startDate)
          return dateB.getTime() - dateA.getTime()
        })
        setRequests(sortedData)
      } else {
        setRequests([])
      }
    } catch (error: any) {
      console.error("Failed to fetch requests:", error)
      setRequests([])
      addToast({
        title: "Error",
        description: error.message || "Failed to fetch requests",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterRequests = () => {
    if (!requests || requests.length === 0) {
      setFilteredRequests([])
      return
    }

    let filtered = [...requests]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => {
        if (statusFilter === "expired") {
          return isLeaveRequestExpired(req) || req.status === "expired"
        }
        return req.status === statusFilter
      })
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((req) => getLeaveType(req) === typeFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (req) =>
          getLeaveType(req).toLowerCase().includes(query) ||
          req.reason?.toLowerCase().includes(query) ||
          req.status.toLowerCase().includes(query)
      )
    }

    setFilteredRequests(filtered)
  }

  const getLeaveType = (request: any) => {
    return request.leaveType || request.type || "unknown"
  }

  const isLeaveRequestExpired = (request: any) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(request.endDate)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today && request.status === "pending"
  }

  const getStatusBadge = (request: any) => {
    if (isLeaveRequestExpired(request) || request.status === "expired") {
      return (
        <Badge className="bg-gray-300 text-gray-700">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      )
    }

    switch (request.status) {
      case "approved":
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: "Annual Leave",
      sick: "Sick Leave",
      personal: "Personal Leave",
      emergency: "Emergency Leave",
      maternity: "Maternity Leave",
    }
    return labels[type] || type
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const safeFormatDate = (dateString: string, formatString: string = "PPP") => {
    try {
      const date = parseISO(dateString)
      if (isValid(date)) {
        return format(date, formatString)
      }
    } catch (error) {
      console.warn("Invalid date:", dateString)
    }
    return "Invalid date"
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
    setEditLeaveType(getLeaveType(request))
    setEditStartDate(parseISO(request.startDate))
    setEditEndDate(parseISO(request.endDate))
    setEditReason(request.reason)
    setIsStartDateOpen(false)
    setIsEndDateOpen(false)
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
        variant: "default",
      })

      setIsEditDialogOpen(false)
      await fetchRequests(true) // Force refresh
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

  const handleDelete = (request: any) => {
    if (request.status !== "pending") {
      addToast({
        title: "Cannot Delete",
        description: "Only pending requests can be deleted",
        variant: "destructive",
      })
      return
    }

    setDeletingRequest(request)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await leaveAPI.deleteRequest(deletingRequest.id)

      addToast({
        title: "Success",
        description: "Leave request deleted successfully",
        variant: "default",
      })

      setIsDeleteDialogOpen(false)
      await fetchRequests(true) // Force refresh
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "Failed to delete request",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDetails = (request: any) => {
    setViewingRequest(request)
    setIsViewDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse mb-2" />
              <div className="h-5 w-64 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="h-11 w-36 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Filters Card Skeleton */}
          <div className="bg-white rounded-xl shadow-sm mb-8 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <th key={i} className="px-8 py-5 text-left">
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-8 py-5">
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Skeleton */}
              <div className="px-8 py-5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
                  <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
              <p className="text-base text-gray-500">
                View and manage your leave requests ({requests.length} total)
              </p>
            </div>
            <Button
              onClick={() => router.push("/employee/apply")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-sm mb-8 bg-white rounded-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by type, reason, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-300 hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-300 hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="hover:bg-emerald-50 focus:bg-emerald-50">All Status</SelectItem>
                      <SelectItem value="pending" className="hover:bg-emerald-50 focus:bg-emerald-50">Pending</SelectItem>
                      <SelectItem value="approved" className="hover:bg-emerald-50 focus:bg-emerald-50">Approved</SelectItem>
                      <SelectItem value="rejected" className="hover:bg-emerald-50 focus:bg-emerald-50">Rejected</SelectItem>
                      <SelectItem value="expired" className="hover:bg-emerald-50 focus:bg-emerald-50">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Leave Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-300 hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="hover:bg-emerald-50 focus:bg-emerald-50">All Types</SelectItem>
                      <SelectItem value="annual" className="hover:bg-emerald-50 focus:bg-emerald-50">Annual Leave</SelectItem>
                      <SelectItem value="sick" className="hover:bg-emerald-50 focus:bg-emerald-50">Sick Leave</SelectItem>
                      <SelectItem value="personal" className="hover:bg-emerald-50 focus:bg-emerald-50">Personal Leave</SelectItem>
                      <SelectItem value="emergency" className="hover:bg-emerald-50 focus:bg-emerald-50">Emergency Leave</SelectItem>
                      <SelectItem value="maternity" className="hover:bg-emerald-50 focus:bg-emerald-50">Maternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          {filteredRequests.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="py-20 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
                  <p className="text-base text-gray-500 mb-8 max-w-md">
                    {requests.length === 0
                      ? "You haven't submitted any leave requests yet. Start by creating your first request."
                      : "No requests match your current filters. Try adjusting your search criteria."}
                  </p>
                  <Button
                    onClick={() => router.push("/employee/apply")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Leave Type
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Start Date
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          End Date
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {getLeaveTypeLabel(getLeaveType(request)).replace(' Leave', '')}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {safeFormatDate(request.startDate, "MMM dd, yyyy")}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {safeFormatDate(request.endDate, "MMM dd, yyyy")}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {calculateDays(request.startDate, request.endDate)} day{calculateDays(request.startDate, request.endDate) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            {isLeaveRequestExpired(request) || request.status === "expired" ? (
                              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1">
                                Expired
                              </Badge>
                            ) : request.status === "approved" ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-3 py-1">
                                Approved
                              </Badge>
                            ) : request.status === "rejected" ? (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 px-3 py-1">
                                Rejected
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-semibold text-gray-900">1-{filteredRequests.length}</span> of <span className="font-semibold text-gray-900">{requests.length}</span> requests
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white" disabled>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 px-4 bg-emerald-600 text-white hover:bg-emerald-700">
                      1
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-white" disabled>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 capitalize">
                  {viewingRequest && getLeaveTypeLabel(getLeaveType(viewingRequest))}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Detailed information about your leave request
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 py-2">
              {/* Status Badge */}
              <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">
                    {safeFormatDate(viewingRequest.startDate, "MMM dd, yyyy")} - {safeFormatDate(viewingRequest.endDate, "MMM dd, yyyy")}
                  </span>
                </div>
                <div>{getStatusBadge(viewingRequest)}</div>
              </div>

              {/* Request Information Section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Request Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Request ID</p>
                    <p className="text-sm font-medium text-slate-900">{viewingRequest.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Leave Type</p>
                    <p className="text-sm font-medium text-slate-900 capitalize">{getLeaveType(viewingRequest)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Duration</p>
                    <p className="text-sm font-medium text-slate-900">{calculateDays(viewingRequest.startDate, viewingRequest.endDate)} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Applied</p>
                    <p className="text-sm font-medium text-slate-900">
                      {safeFormatDate(getAppliedDate(viewingRequest) || viewingRequest.startDate, "MMM dd, yyyy")}
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
                    <p className="text-sm font-medium text-slate-900">{safeFormatDate(viewingRequest.startDate, "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">End Date</p>
                    <p className="text-sm font-medium text-slate-900">{safeFormatDate(viewingRequest.endDate, "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Days</p>
                    <p className="text-sm font-medium text-slate-900">{calculateDays(viewingRequest.startDate, viewingRequest.endDate)} days</p>
                  </div>
                </div>
              </div>

              {/* Reason Section */}
              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Reason for Leave</h3>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-700 leading-relaxed">{viewingRequest.reason || 'No reason provided'}</p>
                </div>
              </div>

              {/* Admin Comment if exists */}
              {viewingRequest.comment && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Admin Comment</h3>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-slate-700 leading-relaxed">{viewingRequest.comment}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {viewingRequest && viewingRequest.status === "pending" && !isLeaveRequestExpired(viewingRequest) && (
            <DialogFooter className="gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false)
                  handleEdit(viewingRequest)
                }}
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all duration-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Request
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewDialogOpen(false)
                  handleDelete(viewingRequest)
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={() => setIsViewDialogOpen(false)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 transition-all duration-200"
              >
                Close
              </Button>
            </DialogFooter>
          )}
          {viewingRequest && (viewingRequest.status !== "pending" || isLeaveRequestExpired(viewingRequest)) && (
            <DialogFooter className="pt-4 border-t">
              <Button
                onClick={() => setIsViewDialogOpen(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 transition-all duration-200"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="max-w-2xl"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when clicking on calendar popover
            const target = e.target as HTMLElement
            if (target.closest('[role="dialog"]') || target.closest('.rdp')) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Edit Leave Request</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Update your leave request details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Leave Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">
                Leave Type <span className="text-red-500">*</span>
              </Label>
              <Select value={editLeaveType} onValueChange={setEditLeaveType}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-300 hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual" className="hover:bg-emerald-50 focus:bg-emerald-50">Annual Leave</SelectItem>
                  <SelectItem value="sick" className="hover:bg-emerald-50 focus:bg-emerald-50">Sick Leave</SelectItem>
                  <SelectItem value="personal" className="hover:bg-emerald-50 focus:bg-emerald-50">Personal Leave</SelectItem>
                  <SelectItem value="emergency" className="hover:bg-emerald-50 focus:bg-emerald-50">Emergency Leave</SelectItem>
                  <SelectItem value="maternity" className="hover:bg-emerald-50 focus:bg-emerald-50">Maternity Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-gray-300 h-11 hover:border-emerald-500 hover:bg-gray-50 hover:text-gray-900 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-white data-[state=open]:border-emerald-500 transition-colors",
                        !editStartDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {editStartDate ? format(editStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={editStartDate}
                      onSelect={(date) => {
                        setEditStartDate(date)
                        setIsStartDateOpen(false)
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white border-gray-300 h-11 hover:border-emerald-500 hover:bg-gray-50 hover:text-gray-900 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-white data-[state=open]:border-emerald-500 transition-colors",
                        !editEndDate && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {editEndDate ? format(editEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="single"
                      selected={editEndDate}
                      onSelect={(date) => {
                        setEditEndDate(date)
                        setIsEndDateOpen(false)
                      }}
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
              <Label className="text-sm font-medium text-gray-600">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={5}
                placeholder="Provide a reason for your leave..."
                className="resize-none bg-gray-50 border-gray-300 hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRequest}
              disabled={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUpdating ? "Updating..." : "Update Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Delete Leave Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              This will permanently delete your leave request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
