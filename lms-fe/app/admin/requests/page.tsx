"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { leaveAPI, adminAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Clock, CheckCircle, XCircle, Search, Filter, FileText, Activity, Check, X, Info } from "lucide-react"
import { format } from "date-fns"

interface User {
    id: string
    name: string
    employeeId: string
    department: string
    email: string
}

interface LeaveRequest {
    id: string
    userId: User
    leaveType: "annual" | "sick" | "personal" | "emergency" | "maternity"
    startDate: string
    endDate: string
    reason: string
    status: "pending" | "approved" | "rejected" | "expired"
    comment?: string
    appliedAt?: string
    adminComments?: string
    reviewedAt?: string
    reviewedBy?: {
        name: string
    }
}

export default function AllRequestsPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([])
    const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [leaveTypeFilter, setLeaveTypeFilter] = useState("all")
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [adminComments, setAdminComments] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const { toast } = useToast()

    // Helper function to get the applied date from a request (handles both appliedAt and applied_at)
    const getAppliedDate = (request: any) => {
        return request.appliedAt || request.applied_at || request.appliedDate || request.applied_date || request.createdAt || request.created_at
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    useEffect(() => {
        filterRequests()
    }, [requests, searchTerm, statusFilter, leaveTypeFilter])

    const fetchRequests = async () => {
        setIsLoading(true)
        try {
            const [requestsData, employees] = await Promise.all([
                leaveAPI.getAllRequests(),
                adminAPI.getEmployees()
            ])
            
            // Enrich requests with employee data if userId is just an ID
            const enrichedRequests = requestsData.map((req: any) => {
                // If userId is already an object with user details, use it
                if (req.userId && typeof req.userId === 'object' && 'name' in req.userId) {
                    return req
                }
                
                // Otherwise, find the employee by ID
                const userId = typeof req.userId === 'object' ? req.userId.id : req.userId
                const employee = employees.find((emp: any) => 
                    emp.id === userId || emp.id === String(userId) || String(emp.id) === String(userId)
                )
                
                if (employee) {
                    return {
                        ...req,
                        userId: {
                            id: employee.id,
                            name: employee.name,
                            employeeId: employee.employeeId,
                            department: employee.department,
                            email: employee.email
                        }
                    }
                }
                
                return req
            })
            
            // Filter out any requests without valid user data
            const validRequests = enrichedRequests.filter((req: any) =>
                req.userId && typeof req.userId === 'object' && req.userId.name
            )
            
            setRequests(validRequests)
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to fetch leave requests",
                variant: "destructive",
                onClose: () => { }
            })
        } finally {
            setIsLoading(false)
        }
    }

    const filterRequests = () => {
        let filtered = requests

        if (searchTerm) {
            filtered = filtered.filter(
                (request) =>
                    request.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.userId?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.userId?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    request.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter((request) => request.status === statusFilter)
        }

        if (leaveTypeFilter !== "all") {
            filtered = filtered.filter((request) => request.leaveType === leaveTypeFilter)
        }

        // Sort: Pending first, then by applied date (newest first)
        filtered = filtered.sort((a, b) => {
            // Priority 1: Pending status comes first
            if (a.status === 'pending' && b.status !== 'pending') return -1
            if (a.status !== 'pending' && b.status === 'pending') return 1
            
            // Priority 2: Sort by applied date (newest first)
            const dateA = new Date(getAppliedDate(a) || 0).getTime()
            const dateB = new Date(getAppliedDate(b) || 0).getTime()
            return dateB - dateA
        })

        setFilteredRequests(filtered)
    }

    const handleRequestClick = (request: LeaveRequest) => {
        setSelectedRequest(request)
        setAdminComments(request.comment || "")
        setIsDialogOpen(true)
    }

    const handleStatusUpdate = async (requestId: string, status: "approved" | "rejected") => {
        setIsUpdating(true)
        try {
            if (status === "approved") {
                await leaveAPI.approveRequest(requestId, adminComments)
            } else {
                await leaveAPI.rejectRequest(requestId, adminComments)
            }
            toast({
                title: "Request Updated",
                description: `Leave request has been ${status}`,
                onClose: () => { }
            })
            await fetchRequests()
            setIsDialogOpen(false)
            setAdminComments("")
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update request",
                variant: "destructive",
                onClose: () => { }
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case "rejected":
                return <XCircle className="h-4 w-4 text-red-600" />
            case "expired":
                return <Clock className="h-4 w-4 text-gray-500" />
            default:
                return <Clock className="h-4 w-4 text-yellow-600" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="text-white hover:opacity-90" style={{ backgroundColor: '#16A34A' }}>Approved</Badge>
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>
            case "expired":
                return <Badge className="text-xs bg-gray-300 text-gray-700">Expired</Badge>
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

    const getLeaveTypeColor = (leaveType: string) => {
        switch (leaveType) {
            case "annual":
                return "bg-blue-100 text-blue-800"
            case "sick":
                return "bg-red-100 text-red-800"
            case "personal":
                return "bg-purple-100 text-purple-800"
            case "emergency":
                return "bg-orange-100 text-orange-800"
            case "maternity":
                return "bg-pink-100 text-pink-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const isPastRequest = (request: LeaveRequest) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const endDate = new Date(request.endDate)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="w-full">
                    {/* Header Skeleton */}
                    <div className="mb-6">
                        <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse mb-1" />
                        <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse" />
                    </div>

                    <div className="space-y-6">
                        {/* Filters Card Skeleton */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-2" />
                            <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse mb-4" />
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 h-10 bg-gray-100 rounded-md animate-pulse" />
                                <div className="w-full sm:w-48 h-10 bg-gray-100 rounded-md animate-pulse" />
                                <div className="w-full sm:w-48 h-10 bg-gray-100 rounded-md animate-pulse" />
                            </div>
                        </div>

                        {/* Table Card Skeleton */}
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-6 border-b">
                                <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse mb-2" />
                                <div className="h-4 w-80 bg-gray-200 rounded-md animate-pulse" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr className="border-b border-gray-200">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <th key={i} className="px-6 py-3">
                                                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                                                        <div className="space-y-2">
                                                            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                                                            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                                                        </div>
                                                    </div>
                                                </td>
                                                {Array.from({ length: 7 }).map((_, j) => (
                                                    <td key={j} className="px-6 py-4">
                                                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Skeleton */}
                            <div className="px-6 py-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center justify-between">
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
            </div>
        )
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">All Leave Requests</h1>
                        <p className="text-gray-500">Manage and review all employee leave requests</p>
                    </div>

                    <div className="space-y-6">
                        {/* Filters */}
                        <Card className="border-0 shadow-none bg-white mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
                                <CardDescription className="text-sm text-gray-500">Search and filter leave requests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                            <Input
                                                placeholder="Search by name, employee ID, department, or email..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value)
                                                    setCurrentPage(1)
                                                }}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-48">
                                        <Select value={statusFilter} onValueChange={(value) => {
                                            setStatusFilter(value)
                                            setCurrentPage(1)
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="expired">Expired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full sm:w-48">
                                        <Select value={leaveTypeFilter} onValueChange={(value) => {
                                            setLeaveTypeFilter(value)
                                            setCurrentPage(1)
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="annual">Annual</SelectItem>
                                                <SelectItem value="sick">Sick</SelectItem>
                                                <SelectItem value="personal">Personal</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                                <SelectItem value="maternity">Maternity</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requests Table */}
                        <Card className="border-0 shadow-none bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Leave Requests ({filteredRequests.length})
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-500">
                                    All employee leave requests with management actions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {filteredRequests.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {requests.length === 0 ? "No Leave Requests" : "No Matching Requests"}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {requests.length === 0 ? "No leave requests found" : "No requests match your filters"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                                    <th className="text-left px-6 py-3 pr-12 text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {paginatedRequests.map((request, index) => (
                                                    <tr
                                                        key={`${request.id}-${request.userId.id}-${request.startDate}-${index}`}
                                                        className="border-b border-gray-200"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                                                    <span className="text-sm font-semibold text-white">
                                                                        {request.userId?.name ? request.userId.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">{request.userId?.name || 'Unknown'}</div>
                                                                    <div className="text-sm text-gray-500">{request.userId?.employeeId || '—'}</div>
                                                                    <div className="text-xs text-gray-500">{request.userId?.department || '—'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 pr-12">
                                                            <Badge variant="outline" className="capitalize">
                                                                {request.leaveType}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(request.startDate), "MMM dd, yyyy")}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(request.endDate), "MMM dd, yyyy")}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{calculateDays(request.startDate, request.endDate)} days</td>
                                                        <td className="px-6 py-4">
                                                            {getStatusBadge(request.status)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {getAppliedDate(request) ? format(new Date(getAppliedDate(request)), "MMM dd, yyyy") : "—"}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRequestClick(request)}
                                                                    className="hover:bg-[#ECFCF4] hover:text-emerald-600"
                                                                >
                                                                    <Info className="h-4 w-4" />
                                                                </Button>
                                                                {request.status === "pending" && !isPastRequest(request) && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedRequest(request)
                                                                                handleStatusUpdate(request.id, "rejected")
                                                                            }}
                                                                            disabled={isUpdating}
                                                                            className="text-slate-600 hover:bg-red-50 hover:text-red-600"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedRequest(request)
                                                                                handleStatusUpdate(request.id, "approved")
                                                                            }}
                                                                            disabled={isUpdating}
                                                                            className="text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
                                                                        >
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {filteredRequests.length > 0 && (
                                    <div className="px-6 py-4 border-t border-gray-200 bg-white">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className="hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                                                >
                                                    Previous
                                                </Button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                        <Button
                                                            key={page}
                                                            variant={currentPage === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-600" : "hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"}
                                                        >
                                                            {page}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Request Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                                    <p className="text-base font-semibold text-slate-900">{selectedRequest.userId?.name || 'Unknown'}</p>
                                    <p className="text-sm text-slate-600">{selectedRequest.userId?.employeeId || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Department</p>
                                    <p className="text-base font-medium text-slate-900">{selectedRequest.userId?.department || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Leave Type</p>
                                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 capitalize">
                                        {selectedRequest.leaveType}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</p>
                                    <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Start Date</p>
                                    <p className="text-base font-medium text-slate-900">{format(new Date(selectedRequest.startDate), "MMMM dd, yyyy")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">End Date</p>
                                    <p className="text-base font-medium text-slate-900">{format(new Date(selectedRequest.endDate), "MMMM dd, yyyy")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Duration</p>
                                    <p className="text-base font-semibold text-slate-900">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} days</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Applied On</p>
                                    <p className="text-base font-medium text-slate-900">
                                        {getAppliedDate(selectedRequest) ? format(new Date(getAppliedDate(selectedRequest)), "MMM dd, yyyy") : "—"}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Reason</p>
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                                    <p className="text-sm text-slate-700">{selectedRequest.reason}</p>
                                </div>
                            </div>
                            {selectedRequest.status === "pending" && !isPastRequest(selectedRequest) && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Add Comment (Optional)</p>
                                    <Textarea
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                        placeholder="Add a comment for the employee..."
                                        rows={3}
                                        className="bg-slate-50 border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-400 rounded-lg resize-none"
                                    />
                                </div>
                            )}
                            {selectedRequest.comment && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Admin Comment</p>
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                        <p className="text-sm text-slate-700">{selectedRequest.comment}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {selectedRequest && selectedRequest.status === "pending" && !isPastRequest(selectedRequest) && (
                        <DialogFooter className="gap-2 pt-6 border-t-0">
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
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
                </DialogContent>
            </Dialog>
        </>
    )
}
