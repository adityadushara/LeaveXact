"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { leaveAPI, adminAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Check,
  X,
  Edit
} from "lucide-react"
import { format } from "date-fns"

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
    emergency: number
    maternity: number
    paternity: number
  }
}

interface LeaveRequest {
  id: string
  userId: string | {
    id: string
    name: string
    email: string
    department: string
    employeeId: string
    role: string
    leaveBalance: {
      annual: number
      sick: number
      personal: number
      emergency: number
      maternity: number
      paternity: number
    }
  }
  leaveType: "annual" | "sick" | "personal" | "emergency" | "maternity" | "paternity"
  startDate: string
  endDate: string
  reason: string
  status: "pending" | "approved" | "rejected"
  comment?: string
  appliedAt?: string
}

export default function EmployeeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    department: "",
    employeeId: ""
  })
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      fetchEmployeeData()
    }
  }, [params.id, router])

  const fetchEmployeeData = async () => {
    try {
      setIsLoading(true)
      const [users, allRequests] = await Promise.all([
        adminAPI.getEmployees(),
        leaveAPI.getAllRequests().catch((err) => {
          // Silently handle authentication errors - employee page will show without leave history
          console.log('Unable to fetch leave requests, showing employee details only')
          return []
        }),
        // Add a minimum delay to show skeleton animation (400ms)
        new Promise(resolve => setTimeout(resolve, 400))
      ])

      console.log('Looking for employee with ID:', params.id)
      console.log('Available users:', users.map((u: Employee) => ({
        id: u.id,
        _id: (u as any)._id,
        name: u.name
      })))

      // Try multiple ID matching strategies
      const emp = users.find((u: Employee) => {
        const userId = u.id || (u as any)._id;
        return userId === params.id ||
          String(userId) === String(params.id) ||
          (u as any)._id === params.id ||
          String((u as any)._id) === String(params.id);
      });

      if (!emp) {
        console.error('Employee not found. Searched for:', params.id);
        console.error('Available IDs:', users.map((u: Employee) => u.id || (u as any)._id));
        toast({
          title: "Employee Not Found",
          description: "The requested employee could not be found.",
          variant: "destructive",
          onClose: () => { }
        })
        router.push("/admin/employees")
        return
      }

      // Don't block viewing admin users, just show their details
      // if (emp.role === 'admin') {
      //   toast({
      //     title: "Employee Not Found",
      //     description: "The requested employee could not be found.",
      //     variant: "destructive",
      //   })
      //   router.push("/admin/employees")
      //   return
      // }

      // Filter requests for this employee - handle both ID and object userId structures
      const employeeRequests = allRequests.filter((r: any) => {
        // Handle different userId formats
        let requestUserId = r.userId
        if (typeof r.userId === 'object' && r.userId !== null) {
          requestUserId = r.userId.id || r.userId._id
        }

        // Handle different employee ID formats
        const employeeId = emp.id || (emp as any)._id

        // Compare as strings for consistency
        return String(requestUserId) === String(params.id) ||
          String(requestUserId) === String(employeeId)
      })

      setEmployee(emp)
      setRequests(employeeRequests)
      setIsLoading(false)

    } catch (error: any) {
      console.error('Error fetching employee data:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employee data",
        variant: "destructive",
        onClose: () => { }
      })
      setIsLoading(false)
      router.push("/admin/employees")
    }
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

  const getStatusBadge = (status: string, request?: any) => {
    switch (status) {
      case "approved":
        return <Badge className="text-white hover:opacity-90" style={{ backgroundColor: '#019866' }}>Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        // For pending requests, check if they're expired
        if (request && isLeaveRequestPast(request)) {
          return <Badge className="bg-gray-300 text-gray-700">Expired</Badge>
        }
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const isLeaveRequestPast = (request: LeaveRequest) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison
    const endDate = new Date(request.endDate)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today
  }

  const getTotalLeaveBalance = () => {
    if (!employee || !employee.leaveBalance) return 0
    const isFemale = employee.gender?.toLowerCase() === 'female'
    const isMale = employee.gender?.toLowerCase() === 'male'

    return (employee.leaveBalance.annual || 0) +
      (employee.leaveBalance.sick || 0) +
      (employee.leaveBalance.personal || 0) +
      (employee.leaveBalance.emergency || 0) +
      (isFemale ? (employee.leaveBalance.maternity || 0) : 0) +
      (isMale ? (employee.leaveBalance.paternity || 0) : 0)
  }

  const getLeaveStats = () => {
    const total = requests.length
    const approved = requests.filter(r => r.status === "approved").length
    const pending = requests.filter(r => r.status === "pending").length
    const rejected = requests.filter(r => r.status === "rejected").length
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0

    return { total, approved, pending, rejected, approvalRate }
  }

  const handleReviewRequest = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setReviewComment(request.comment || "")
    setIsReviewDialogOpen(true)
  }

  const handleApproveRequest = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await leaveAPI.updateRequestStatus(selectedRequest.id, "approved", reviewComment)

      toast({
        title: "Request Approved",
        description: "The leave request has been approved successfully.",
        onClose: () => { }
      })

      // Refresh the data
      await fetchEmployeeData()
      setIsReviewDialogOpen(false)
      setSelectedRequest(null)
      setReviewComment("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
        onClose: () => { }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await leaveAPI.updateRequestStatus(selectedRequest.id, "rejected", reviewComment)

      toast({
        title: "Request Rejected",
        description: "The leave request has been rejected.",
        onClose: () => { }
      })

      // Refresh the data
      await fetchEmployeeData()
      setIsReviewDialogOpen(false)
      setSelectedRequest(null)
      setReviewComment("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
        onClose: () => { }
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditClick = () => {
    if (employee) {
      setEditForm({
        name: employee.name,
        email: employee.email,
        department: employee.department,
        employeeId: employee.employeeId
      })
      setIsEditDialogOpen(true)
    }
  }

  const handleEditSubmit = async () => {
    if (!employee) return

    setIsProcessing(true)
    try {
      await adminAPI.updateEmployee(employee.id, {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department,
        employee_id: editForm.employeeId
      })

      toast({
        title: "Employee Updated",
        description: "Employee information has been updated successfully.",
        onClose: () => { }
      })

      // Refresh the data
      await fetchEmployeeData()
      setIsEditDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
        onClose: () => { }
      })
    } finally {
      setIsProcessing(false)
    }
  }




  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-40" />
            </div>
            <Skeleton className="h-9 w-64 mb-1" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Profile Card Skeleton */}
          <Card className="border-0 shadow-none bg-white mb-6">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-none bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Leave Requests Skeleton */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full">
          <div className="text-center py-20">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Not Found</h3>
            <p className="text-sm text-gray-500">The requested employee could not be found.</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4 hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stats = getLeaveStats()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleEditClick} className="bg-emerald-600 hover:bg-emerald-700">
              <Edit className="mr-2 h-4 w-4" />
              Edit Employee
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Employee Details</h1>
          <p className="text-gray-500">Complete information and leave history</p>
        </div>

        {/* Employee Profile Card */}
        <Card className="border-0 shadow-none bg-white mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-[#019866] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900">{employee.name}</h2>
                <p className="text-gray-500 text-sm mt-1 font-mono">{employee.employeeId}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-sm">{employee.department}</Badge>
                  <Badge className="text-sm bg-[#019866]/10 text-[#019866] hover:bg-[#019866]/10">
                    {employee.role}
                  </Badge>
                  {employee.gender && (
                    <Badge
                      variant="outline"
                      className={`text-sm ${employee.gender.toLowerCase() === 'female'
                        ? 'bg-pink-50 text-pink-700 border-pink-200'
                        : employee.gender.toLowerCase() === 'male'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : ''
                        }`}
                    >
                      {employee.gender}
                    </Badge>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <p className="text-sm text-gray-900">{employee.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Department</p>
                        <p className="text-sm text-gray-900">{employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Employee ID</p>
                        <p className="text-sm text-gray-900 font-mono">{employee.employeeId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Gender</p>
                        <p className="text-sm text-gray-900 capitalize">
                          {employee.gender || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600">{employee.leaveBalance?.annual || 0}</div>
                      <div className="text-xs text-blue-600 font-medium">Annual</div>
                      <div className="text-xs text-gray-500 mt-0.5">days remaining</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-2xl font-bold text-green-600">{employee.leaveBalance?.sick || 0}</div>
                      <div className="text-xs text-green-600 font-medium">Sick</div>
                      <div className="text-xs text-gray-500 mt-0.5">days remaining</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="text-2xl font-bold text-yellow-600">{employee.leaveBalance?.personal || 0}</div>
                      <div className="text-xs text-yellow-600 font-medium">Personal</div>
                      <div className="text-xs text-gray-500 mt-0.5">days remaining</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="text-2xl font-bold text-orange-600">{employee.leaveBalance?.emergency || 0}</div>
                      <div className="text-xs text-orange-600 font-medium">Emergency</div>
                      <div className="text-xs text-gray-500 mt-0.5">days remaining</div>
                    </div>
                    {employee.gender?.toLowerCase() === 'female' && (
                      <div className="text-center p-3 bg-pink-50 rounded-lg border border-pink-100">
                        <div className="text-2xl font-bold text-pink-600">{employee.leaveBalance?.maternity || 0}</div>
                        <div className="text-xs text-pink-600 font-medium">Maternity</div>
                        <div className="text-xs text-gray-500 mt-0.5">days remaining</div>
                      </div>
                    )}
                    {employee.gender?.toLowerCase() === 'male' && (
                      <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="text-2xl font-bold text-indigo-600">{employee.leaveBalance?.paternity || 0}</div>
                        <div className="text-xs text-indigo-600 font-medium">Paternity</div>
                        <div className="text-xs text-gray-500 mt-0.5">days remaining</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Total Available: <span className="font-bold text-lg text-gray-900">{getTotalLeaveBalance()} days</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500">all time</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Approval Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#019866]">{stats.approvalRate}%</div>
              <p className="text-xs text-gray-500">success rate</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-500">awaiting review</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Rejected</CardTitle>
              <TrendingDown className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-gray-500">not approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Leave History */}
        <Card className="border-0 shadow-none bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Leave History</CardTitle>
                <CardDescription className="text-sm text-gray-500">Complete record of all leave requests</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {requests.length} request{requests.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
                <p className="text-sm text-gray-500">This employee hasn't submitted any leave requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-100 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="mt-1">
                          {getStatusIcon(request.status, request)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">{request.leaveType} Leave</h3>
                            {getStatusBadge(request.status, request)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(request.startDate), "MMM dd, yyyy")} - {format(new Date(request.endDate), "MMM dd, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium text-gray-900">{calculateDays(request.startDate, request.endDate)} day{calculateDays(request.startDate, request.endDate) !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 lg:mt-0">
                        {request.status === "pending" && isLeaveRequestPast(request) ? (
                          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded">
                            Dates have passed
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewRequest(request)}
                            className="flex items-center gap-2 hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                          >
                            <Eye className="h-4 w-4" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Reason for Leave:</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{request.reason}</p>
                      </div>

                      {request.comment && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Admin Comments:</p>
                          <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-200">{request.comment}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span>Applied: {request.appliedAt ? format(new Date(request.appliedAt), "MMM dd, yyyy 'at' HH:mm") : "—"}</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">ID: {request.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Edit Employee</DialogTitle>
              <DialogDescription className="text-gray-500">
                Update employee information. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department
                </Label>
                <Input
                  id="department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder="Enter department"
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                  placeholder="Enter employee ID"
                  className="border-gray-200 font-mono"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isProcessing}
                className="hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Review Leave Request</DialogTitle>
              <DialogDescription className="text-gray-500">
                Review and approve or reject this leave request for {employee?.name}.
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Leave Type</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedRequest.leaveType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status, selectedRequest)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p className="text-base text-gray-900">{format(new Date(selectedRequest.startDate), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p className="text-base text-gray-900">{format(new Date(selectedRequest.endDate), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duration</p>
                    <p className="text-base font-medium text-gray-900">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} day{calculateDays(selectedRequest.startDate, selectedRequest.endDate) !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Applied On</p>
                    <p className="text-base text-gray-900">
                      {selectedRequest.appliedAt ? format(new Date(selectedRequest.appliedAt), "MMM dd, yyyy") : "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Reason for Leave</p>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.status === "pending" && !isLeaveRequestPast(selectedRequest) && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Add Comment (Optional)</p>
                    <Textarea
                      placeholder="Add your comments here..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="min-h-[100px]"
                      rows={3}
                    />
                  </div>
                )}

                {selectedRequest.comment && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Admin Comment</p>
                    <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.comment}</p>
                  </div>
                )}
              </div>
            )}

            {selectedRequest && selectedRequest.status === "pending" && !isLeaveRequestPast(selectedRequest) && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                  disabled={isProcessing}
                  className="hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectRequest}
                  disabled={isProcessing}
                  className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  {isProcessing ? "Rejecting..." : "Reject"}
                </Button>
                <Button
                  onClick={handleApproveRequest}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  {isProcessing ? "Approving..." : "Approve"}
                </Button>
              </DialogFooter>
            )}
            {selectedRequest && (selectedRequest.status !== "pending" || isLeaveRequestPast(selectedRequest)) && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                  className="hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                >
                  Close
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
