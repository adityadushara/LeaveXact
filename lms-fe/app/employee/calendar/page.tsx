"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { leaveAPI } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { CustomScrollbar } from "@/components/ui/custom-scrollbar"

function CalendarSkeleton() {
    return (
        <div className="h-screen bg-gray-50 p-8 flex flex-col">
            <div className="mb-6">
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>

            <div className="flex-1 flex flex-col w-full">
                <Card className="border-0 shadow-none bg-white flex-1 flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded" />
                                <Skeleton className="h-9 w-[140px]" />
                                <Skeleton className="h-9 w-[100px]" />
                                <Skeleton className="h-8 w-8 rounded" />
                            </div>
                            <div className="flex items-center gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-4 w-20" />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <Skeleton key={day} className="h-5 w-full" />
                            ))}
                        </div>

                        <div className="flex-1 grid grid-cols-7 gap-2" style={{ gridAutoRows: '1fr' }}>
                            {Array.from({ length: 35 }).map((_, i) => (
                                <Skeleton key={i} className="w-full h-full rounded-md" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function CalendarPage() {
    const router = useRouter()
    const user = getUser()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [leaves, setLeaves] = useState<any[]>([])
    const [holidays, setHolidays] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<any>(null)

    useEffect(() => {
        if (!user) {
            router.replace("/login")
            return
        }
        setMounted(true)
        fetchCalendar()
    }, [currentDate])

    const fetchCalendar = async () => {
        if (!user) return

        try {
            setIsLoading(true)
            setError(null)

            // Get first and last day of current month
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth()
            const startDate = new Date(year, month, 1)
            const endDate = new Date(year, month + 1, 0)

            try {
                // Fetch from my-calendar endpoint (no userId needed)
                const calendarData = await leaveAPI.getCalendar(undefined, {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    include_holidays: true
                })

                // Transform all leaves into calendar format
                const calendarLeaves: any[] = []

                // Handle new backend response format with leave_durations
                const leaveDurations = calendarData.leave_durations || {}

                // Process all leave types: approved, pending, rejected, expired
                const leaveTypes = [
                    { status: 'approved', leaves: leaveDurations.approved?.leaves || [] },
                    { status: 'pending', leaves: leaveDurations.pending?.leaves || [] },
                    { status: 'rejected', leaves: leaveDurations.rejected?.leaves || [] },
                    { status: 'expired', leaves: leaveDurations.expired?.leaves || [] }
                ]

                leaveTypes.forEach(({ status, leaves }) => {
                    leaves.forEach((leave: any) => {
                        const leaveStartDate = new Date(leave.start_date)
                        const leaveEndDate = new Date(leave.end_date)

                        // Add each day in the range
                        for (let d = new Date(leaveStartDate); d <= leaveEndDate; d.setDate(d.getDate() + 1)) {
                            calendarLeaves.push({
                                id: `${leave.id}-${d.toISOString().split('T')[0]}`,
                                date: d.toISOString().split('T')[0],
                                type: leave.leave_type,
                                status: status,
                                reason: leave.reason,
                                duration: leave.duration || "Full Day",
                                startDate: leave.start_date,
                                endDate: leave.end_date,
                                adminComment: leave.admin_comment,
                                createdAt: leave.created_at
                            })
                        }
                    })
                })

                // Add holidays from public_holidays array
                const holidayData = calendarData.public_holidays?.map((holiday: any) => ({
                    id: `holiday-${holiday.date}`,
                    date: holiday.date,
                    type: 'holiday',
                    status: 'holiday',
                    reason: holiday.name,
                    duration: "Full Day",
                    name: holiday.name,
                })) || []

                setLeaves(calendarLeaves)
                setHolidays(holidayData)
            } catch (calendarError) {
                console.warn("Calendar endpoint not available, falling back to regular requests:", calendarError)

                try {
                    // Fallback: Use regular requests endpoint
                    const requests = await leaveAPI.getMyRequests()

                    // Filter for approved requests in current month
                    const calendarLeaves: any[] = []
                    requests.forEach((request: any) => {
                        if (request.status !== 'approved') return

                        const requestStartDate = new Date(request.startDate)
                        const requestEndDate = new Date(request.endDate)

                        // Add each day in the range
                        for (let d = new Date(requestStartDate); d <= requestEndDate; d.setDate(d.getDate() + 1)) {
                            calendarLeaves.push({
                                id: `${request.id}-${d.toISOString().split('T')[0]}`,
                                date: d.toISOString().split('T')[0],
                                type: request.leaveType || request.type,
                                status: 'approved',
                                reason: request.reason,
                                duration: "Full Day",
                                startDate: request.startDate,
                                endDate: request.endDate,
                            })
                        }
                    })

                    setLeaves(calendarLeaves)
                    setHolidays([]) // No holidays in fallback mode
                } catch (fallbackError) {
                    console.error("Fallback endpoint also failed:", fallbackError)
                    // Set empty data if both endpoints fail
                    setLeaves([])
                    setHolidays([])
                }
            }
        } catch (error: any) {
            console.error("Failed to fetch calendar:", error)
            setLeaves([])
            setHolidays([])
            setError(error.message || "Failed to connect to backend")
        } finally {
            setIsLoading(false)
        }
    }

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        return { daysInMonth, startingDayOfWeek }
    }

    const getItemsForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        // Get all leaves and holidays for this date
        const dayLeaves = leaves.filter(leave => leave.date === dateStr)
        const dayHolidays = holidays.filter(holiday => holiday.date === dateStr)
        return [...dayLeaves, ...dayHolidays]
    }

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const handleMonthChange = (month: string) => {
        setCurrentDate(new Date(currentDate.getFullYear(), parseInt(month), 1))
    }

    const handleYearChange = (year: string) => {
        setCurrentDate(new Date(parseInt(year), currentDate.getMonth(), 1))
    }

    // Generate year options (current year ± 5 years)
    const currentYear = new Date().getFullYear()
    const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

    if (!mounted || !user) return null

    if (isLoading) return <CalendarSkeleton />

    return (
        <div className="h-screen bg-gray-50 p-8 flex flex-col">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
                <p className="text-base text-gray-500">View your leave schedule and public holidays</p>
            </div>

            <div className="flex-1 flex flex-col w-full">
                <Card className="border-0 shadow-none bg-white flex-1 flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                    <strong>Error:</strong> {error}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Please ensure the backend server is running on port 8000.
                                </p>
                            </div>
                        )}

                        {/* Month Header with Holiday Legend */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={previousMonth}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors rounded-md"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                                        <SelectTrigger className="w-[140px] h-9 bg-white border-gray-300 focus:border-emerald-500 focus:ring-0 font-bold text-gray-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monthNames.map((month, index) => (
                                                <SelectItem key={index} value={index.toString()} className="focus:bg-emerald-500 focus:text-white">
                                                    {month}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                                        <SelectTrigger className="w-[100px] h-9 bg-white border-gray-300 focus:border-emerald-500 focus:ring-0 font-bold text-gray-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yearOptions.map((year) => (
                                                <SelectItem key={year} value={year.toString()} className="focus:bg-emerald-500 focus:text-white">
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    onClick={nextMonth}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors rounded-md"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Legend on the right */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs text-gray-500">Approved</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-xs text-gray-500">Pending</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <span className="text-xs text-gray-500">Rejected</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                    <span className="text-xs text-gray-500">Expired</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-xs text-gray-500">Holiday</span>
                                </div>
                            </div>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                                <div key={day} className={`text-center font-semibold text-sm ${index === 0 || index === 6 ? "text-emerald-600" : "text-gray-600"
                                    }`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="flex-1 grid grid-cols-7 gap-2" style={{ gridAutoRows: '1fr' }}>
                            {/* Empty cells for days before month starts */}
                            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                                <div key={`empty-${index}`} className="bg-gray-50 rounded-lg"></div>
                            ))}

                            {/* Calendar days */}
                            {Array.from({ length: daysInMonth }).map((_, index) => {
                                const day = index + 1
                                const items = getItemsForDate(day)
                                const today = new Date()
                                const isToday = day === today.getDate() &&
                                    currentDate.getMonth() === today.getMonth() &&
                                    currentDate.getFullYear() === today.getFullYear()

                                const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay()
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                                return (
                                    <div
                                        key={day}
                                        className={`relative p-2 rounded-md border flex flex-col ${isWeekend
                                            ? "bg-gray-50 border-gray-200"
                                            : "bg-white border-gray-200"
                                            } ${isToday ? "ring-2 ring-[#4FD1A1]" : ""}`}
                                    >
                                        {/* Date number in top right corner */}
                                        <div className="flex justify-end flex-shrink-0">
                                            <span className={`text-sm font-semibold ${isToday
                                                ? "bg-[#4FD1A1] text-white px-2 py-0.5 rounded-full"
                                                : isWeekend
                                                    ? "text-emerald-600"
                                                    : "text-gray-700"
                                                }`}>
                                                {day}
                                            </span>
                                        </div>

                                        {/* Display all items (holidays and leaves) - bottom aligned with max 5 items height */}
                                        {items.length > 0 && (
                                            <CustomScrollbar maxHeight="110px" className="mt-auto">
                                                <div className="flex flex-col gap-1 text-left">
                                                    {items.map((item, idx) => (
                                                        <button
                                                            key={`${item.id}-${idx}`}
                                                            onClick={() => setSelectedItem(item)}
                                                            className={`text-xs font-medium leading-snug px-2 py-1 rounded text-left transition-all hover:scale-105 hover:shadow-md cursor-pointer flex-shrink-0 truncate ${item.status === 'holiday'
                                                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                                : item.status === 'pending'
                                                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                                    : item.status === 'rejected'
                                                                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                                        : item.status === 'expired'
                                                                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                                }`}
                                                        >
                                                            {item.status === 'holiday'
                                                                ? item.name
                                                                : item.status.charAt(0).toUpperCase() + item.status.slice(1)
                                                            }
                                                        </button>
                                                    ))}
                                                </div>
                                            </CustomScrollbar>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leave/Holiday Details Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            {selectedItem?.status === 'holiday' ? 'Holiday Details' : 'Leave Details'}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Date</label>
                                <p className="text-base font-medium text-gray-900 mt-1">
                                    {selectedItem.date ? new Date(selectedItem.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'N/A'}
                                </p>
                            </div>

                            {selectedItem.status === 'holiday' ? (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Holiday Name</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">{selectedItem.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Type</label>
                                        <p className="text-base font-medium text-gray-900 mt-1 capitalize">
                                            {selectedItem.type || 'Public Holiday'}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Leave Type</label>
                                        <p className="text-base font-medium text-gray-900 mt-1 capitalize">
                                            {selectedItem.type || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <p className={`text-base font-medium mt-1 capitalize ${selectedItem.status === 'approved' ? 'text-emerald-600' :
                                            selectedItem.status === 'pending' ? 'text-amber-600' :
                                                'text-red-600'
                                            }`}>
                                            {selectedItem.status}
                                        </p>
                                    </div>
                                    {selectedItem.startDate && selectedItem.endDate && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Duration</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">
                                                {new Date(selectedItem.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                {' - '}
                                                {new Date(selectedItem.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                    {selectedItem.reason && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Reason</label>
                                            <p className="text-base text-gray-900 mt-1">{selectedItem.reason}</p>
                                        </div>
                                    )}
                                    {selectedItem.adminComment && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Admin Comment</label>
                                            <p className="text-base text-gray-900 mt-1">{selectedItem.adminComment}</p>
                                        </div>
                                    )}
                                    {selectedItem.createdAt && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Applied On</label>
                                            <p className="text-base text-gray-900 mt-1">
                                                {new Date(selectedItem.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
