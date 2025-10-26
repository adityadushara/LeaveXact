"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { adminAPI } from "@/lib/api"
import { format } from "date-fns"
import { Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface AuditLog {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  user?: {
    id: number
    name: string
    email: string
  }
  action: "leave_requested" | "leave_approved" | "leave_rejected" | "leave_updated" | "leave_deleted" | "leave_expired" | "user_login" | "user_logout"
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

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    try {
      const logs = await adminAPI.getAuditLogs()
      const logsArray = Array.isArray(logs) ? logs : []
      setAuditLogs(logsArray)
      setFilteredLogs(logsArray)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setAuditLogs([])
      setFilteredLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  useEffect(() => {
    let filtered = [...auditLogs]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(log => {
        const logDate = format(new Date(log.timestamp), "yyyy-MM-dd")
        return logDate === dateFilter
      })
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [searchQuery, actionFilter, dateFilter, auditLogs])

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "leave_requested":
        return "bg-blue-100 text-blue-700"
      case "leave_approved":
        return "bg-green-100 text-green-700"
      case "leave_rejected":
        return "bg-red-100 text-red-700"
      case "leave_expired":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getActionLabel = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse mb-1" />
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

            {/* Logs Card Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-2" />
                  <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Audit Logs</h1>
          <p className="text-gray-500">Track leave management approvals, rejections, and requests.</p>
        </div>

        <div className="space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-none bg-white mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
              <CardDescription className="text-sm text-gray-500">Search and filter audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-0 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-gray-200"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="border-0 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-gray-200">
                      <SelectValue placeholder="All Activity Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activity Types</SelectItem>
                      <SelectItem value="leave_requested">Requested</SelectItem>
                      <SelectItem value="leave_approved">Approved</SelectItem>
                      <SelectItem value="leave_rejected">Rejected</SelectItem>
                      <SelectItem value="leave_expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="pl-10 border-0 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-gray-200"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Audit Logs ({filteredLogs.length})
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Complete log of all system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {auditLogs.length === 0 ? "No Audit Logs" : "No Matching Logs"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {auditLogs.length === 0 ? "No audit logs found" : "No logs match your filters"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-4 font-semibold text-gray-700">User</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Action</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Details</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-semibold text-white">
                                    {getUserInitials(log.userName || 'Unknown User')}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{log.userName || 'Unknown User'}</div>
                                  <div className="text-xs text-gray-400">
                                    {log.userEmail || log.user?.email || ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={`${getActionBadgeColor(log.action)} border-0`}>
                                {getActionLabel(log.action)}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {log.description}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                              {format(new Date(log.timestamp), "yyyy-MM-dd hh:mm a")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="border-gray-200 hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-600" : "border-gray-200 hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="border-gray-200 hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
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
    </div>
  )
}


