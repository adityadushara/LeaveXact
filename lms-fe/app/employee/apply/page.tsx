"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/toast"
import { leaveAPI } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { CalendarIcon, Send, AlertCircle, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function ApplyLeavePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const user = getUser()

  const [leaveType, setLeaveType] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.replace("/login")
      return
    }
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [user, router])

  const leaveTypes = [
    { value: "annual", label: "Annual Leave", available: user?.leaveBalance?.annual ?? 0 },
    { value: "sick", label: "Sick Leave", available: user?.leaveBalance?.sick ?? 0 },
    { value: "personal", label: "Personal Leave", available: user?.leaveBalance?.personal ?? 0 },
    { value: "emergency", label: "Emergency Leave", available: user?.leaveBalance?.emergency ?? 0 },
    { value: "maternity", label: "Maternity Leave", available: user?.leaveBalance?.maternity ?? 0 },
  ]

  const calculateDays = () => {
    if (!startDate || !endDate) return 0
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!leaveType) {
      newErrors.leaveType = "Please select a leave type"
    }

    if (!startDate) {
      newErrors.startDate = "Please select a start date"
    }

    if (!endDate) {
      newErrors.endDate = "Please select an end date"
    }

    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "End date must be after start date"
    }

    if (!reason.trim()) {
      newErrors.reason = "Please provide a reason for your leave"
    } else if (reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters"
    }

    const requestedDays = calculateDays()
    const selectedLeave = leaveTypes.find(lt => lt.value === leaveType)
    if (selectedLeave && requestedDays > selectedLeave.available) {
      newErrors.leaveType = `Insufficient balance. You have ${selectedLeave.available} days available`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      addToast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await leaveAPI.submitRequest({
        leave_type: leaveType,
        start_date: format(startDate!, "yyyy-MM-dd"),
        end_date: format(endDate!, "yyyy-MM-dd"),
        reason: reason.trim(),
      })

      addToast({
        title: "Success!",
        description: "Your leave request has been submitted successfully",
        variant: "default",
      })

      // Reset form
      setLeaveType("")
      setStartDate(undefined)
      setEndDate(undefined)
      setReason("")
      setErrors({})

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/employee/dashboard")
      }, 1500)
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestedDays = calculateDays()
  const selectedLeave = leaveTypes.find(lt => lt.value === leaveType)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse mb-1" />
          <div className="h-5 w-64 bg-gray-200 rounded-md animate-pulse" />
        </div>

        {/* Two Column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
          {/* Left Column - Form Skeleton */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="mb-6">
                <div className="h-7 w-56 bg-gray-200 rounded-md animate-pulse mb-2" />
                <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse" />
              </div>
              
              <div className="space-y-6">
                {/* Leave Type Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
                </div>

                {/* Date Range Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-11 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>

                {/* Reason Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-32 w-full bg-gray-100 rounded-lg animate-pulse" />
                </div>

                {/* Buttons Skeleton */}
                <div className="flex gap-3 pt-4">
                  <div className="h-11 w-24 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-11 w-40 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            {/* Request Summary Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Balance Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 w-36 bg-gray-200 rounded-md animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
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
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Apply for Leave</h1>
        <p className="text-gray-500">Submit a new leave request</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        {/* Left Column - Form (75%) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-900">Leave Request Form</CardTitle>
              <CardDescription className="text-base text-gray-500 mt-2">
                Fill in the details below to submit your leave request
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType" className="text-sm font-medium text-gray-600">
                    Leave Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className={cn("bg-gray-50 border-gray-300 h-11 hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors", errors.leaveType && "border-red-500")}>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="hover:bg-emerald-50 focus:bg-emerald-50">
                          {type.label} ({type.available} days available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.leaveType && (
                    <p className="text-xs text-red-500">{errors.leaveType}</p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-gray-50 border-gray-300 h-11 hover:border-emerald-500 hover:bg-emerald-50 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors",
                            !startDate && "text-gray-400",
                            errors.startDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-xs text-red-500">{errors.startDate}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-gray-50 border-gray-300 h-11 hover:border-emerald-500 hover:bg-emerald-50 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors",
                            !endDate && "text-gray-400",
                            errors.endDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => {
                            const today = new Date(new Date().setHours(0, 0, 0, 0))
                            return date < today || (startDate ? date < startDate : false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-xs text-red-500">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium text-gray-600">
                    Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason for your leave request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={5}
                    className={cn("bg-gray-50 border-gray-300 resize-none hover:border-emerald-500 focus:border-emerald-500 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-colors", errors.reason && "border-red-500")}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Minimum 10 characters required</span>
                    <span>{reason.length} characters</span>
                  </div>
                  {errors.reason && (
                    <p className="text-xs text-red-500">{errors.reason}</p>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/employee/dashboard")}
                    className="px-8 border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Important Information */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-0 shadow-none bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm">
                  i
                </div>
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manager Approval */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-default">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Manager Approval</h4>
                  <p className="text-xs text-gray-600">All leave requests are subject to manager approval.</p>
                </div>
              </div>

              {/* Notifications */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-default">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Notifications</h4>
                  <p className="text-xs text-gray-600">You will be notified once your request has been processed.</p>
                </div>
              </div>

              {/* Annual Leave */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-default">
                <div className="flex-shrink-0 mt-0.5">
                  <CalendarIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Annual Leave</h4>
                  <p className="text-xs text-gray-600">Request at least 2 weeks in advance.</p>
                </div>
              </div>

              {/* Sick Leave */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-default">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Sick Leave</h4>
                  <p className="text-xs text-gray-600">A medical certificate may be required for 3+ consecutive days.</p>
                </div>
              </div>

              {/* Emergency Leave */}
              <div className="flex gap-3 p-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-default">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">Emergency Leave</h4>
                  <p className="text-xs text-gray-600">Can be requested with immediate notice.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
