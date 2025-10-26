"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { adminAPI } from "@/lib/api-external"
import { format } from "date-fns"
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"

interface ActivityLog {
  id: string
  userId: string
  userName?: string
  user?: {
    id: number
    name: string
    email: string
  }
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

interface ActivityLogProps {
  limit?: number
  showRefresh?: boolean
}

export default function ActivityLogComponent({ limit = 20, showRefresh = true }: ActivityLogProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const fetchActivityLogs = async () => {
    try {
      setIsLoading(true)
      const logs = await adminAPI.getAuditLogs(limit ? { limit } : undefined)
      setActivityLogs(Array.isArray(logs) ? logs : [])
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
      setActivityLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivityLogs()
  }, [limit])

  const getActionIcon = (action: string) => {
    switch (action) {
      case "leave_requested":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "leave_approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "leave_rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "leave_deleted":
        return <XCircle className="h-4 w-4 text-orange-600" />
      case "leave_updated":
        return <RefreshCw className="h-4 w-4 text-purple-600" />
      case "user_login":
        return <User className="h-4 w-4 text-green-600" />
      case "user_logout":
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "leave_requested":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Request Submitted</Badge>
      case "leave_approved":
        return <Badge className="text-white hover:opacity-90" style={{ backgroundColor: '#16A34A' }}>Approved</Badge>
      case "leave_rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "leave_deleted":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Deleted</Badge>
      case "leave_updated":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Updated</Badge>
      case "user_login":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Login</Badge>
      case "user_logout":
        return <Badge variant="secondary">Logout</Badge>
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const logTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return format(logTime, "MMM dd, yyyy")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Activity Log</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {showRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={fetchActivityLogs}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Recent system activities and user actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Activity Yet</h3>
            <p className="text-sm text-muted-foreground">Activity logs will appear here as users interact with the system</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActionBadge(log.action)}
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{log.userName || 'Unknown User'}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(log.timestamp), "MMM dd, yyyy 'at' HH:mm")}</span>
                  </div>
                  {showDetails && log.details && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      {log.details.leaveType && (
                        <div className="mb-1">
                          <span className="font-medium">Leave Type:</span> {log.details.leaveType}
                        </div>
                      )}
                      {log.details.startDate && log.details.endDate && (
                        <div className="mb-1">
                          <span className="font-medium">Dates:</span> {format(new Date(log.details.startDate), "MMM dd")} - {format(new Date(log.details.endDate), "MMM dd")}
                        </div>
                      )}
                      {log.details.previousStatus && log.details.newStatus && (
                        <div className="mb-1">
                          <span className="font-medium">Status Change:</span> {log.details.previousStatus} → {log.details.newStatus}
                        </div>
                      )}
                      {log.details.comment && (
                        <div>
                          <span className="font-medium">Comment:</span> {log.details.comment}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
