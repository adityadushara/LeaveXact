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
import { adminAPI, holidaysAPI } from "@/lib/api"
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
    const [selectedDay, setSelectedDay] = useState<any>(null)
    const [todayEmployees, setTodayEmployees] = useState<any[]>([])
    const [upcomingLeaves, setUpcomingLeaves] = useState<any[]>([])
    const [upcomingHolidays, setUpcomingHolidays] = useState<any[]>([])

    useEffect(() => {
        if (!user) {
            router.replace("/login")
            return
        }
        setMounted(true)
        fetchCalendar()
        fetchTodayData()
    }, [currentDate])

    const fetchTodayData = async () => {
        try {
            const today = new Date()
            const todayStr = today.toISOString().split('T')[0]

            // Fetch employees on leave today using the main calendar endpoint with single date
            const todayData = await adminAPI.getCalendar({
                date: todayStr
            })

            // Extract today's employees (response is an array with one day)
            if (todayData && todayData.length > 0) {
                setTodayEmployees(todayData[0].employees_on_leave || [])
            } else {
                setTodayEmployees([])
            }

            // Fetch upcoming leaves (next 7 days)
            const nextWeek = new Date(today)
            nextWeek.setDate(today.getDate() + 7)

            const upcomingData = await adminAPI.getCalendar({
                start_date: todayStr,
                end_date: nextWeek.toISOString().split('T')[0],
            })

            // Extract unique upcoming leaves
            const upcomingLeavesMap = new Map()
            upcomingData.forEach((dayData: any) => {
                dayData.employees_on_leave?.forEach((employee: any) => {
                    const key = `${employee.employee_id}-${employee.leave_request_id}`
                    if (!upcomingLeavesMap.has(key)) {
                        upcomingLeavesMap.set(key, {
                            ...employee,
                            date: dayData.date
                        })
                    }
                })
            })
            setUpcomingLeaves(Array.from(upcomingLeavesMap.values()).slice(0, 5))

            // For holidays, we'll leave empty for now
            setUpcomingHolidays([])
        } catch (error) {
            console.error("Failed to fetch today's data:", error)
            // Set empty arrays on error to prevent UI issues
            setTodayEmployees([])
            setUpcomingLeaves([])
            setUpcomingHolidays([])
        }
    }

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
                // Fetch from admin calendar endpoint
                const calendarData = await adminAPI.getCalendar({
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                })



                // Fetch holidays for the same date range
                let holidaysData: any[] = []
                try {
                    holidaysData = await holidaysAPI.getHolidays({
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0],
                    })
                } catch (holidayError) {
                    console.error('Failed to fetch holidays:', holidayError)
                    // Continue without holidays if fetch fails
                    holidaysData = []
                }

                // Transform admin calendar response into calendar format
                const calendarLeaves: any[] = []
                const holidayData: any[] = []

                // Process each day's data
                calendarData.forEach((dayData: any, index: number) => {
                    // Normalize date format to YYYY-MM-DD
                    let date = dayData.date
                    if (date && date.includes('T')) {
                        date = date.split('T')[0]
                    }

                    // Process employees on leave for this day
                    if (dayData.employees_on_leave && Array.isArray(dayData.employees_on_leave)) {
                        dayData.employees_on_leave.forEach((employee: any) => {
                            calendarLeaves.push({
                                id: `${employee.leave_request_id}-${date}`,
                                date: date,
                                type: employee.leave_type,
                                status: 'approved',
                                reason: '', // Not provided in admin calendar response
                                duration: employee.duration || "Full Day",
                                startDate: employee.start_date,
                                endDate: employee.end_date,
                                employeeName: employee.employee_name,
                                employeeCode: employee.employee_code,
                                department: employee.department,
                                leaveRequestId: employee.leave_request_id
                            })
                        })
                    }
                })



                // Process holidays
                if (holidaysData && Array.isArray(holidaysData)) {
                    holidaysData.forEach((holiday: any) => {
                        // Normalize date format to YYYY-MM-DD
                        let date = holiday.date
                        if (date && date.includes('T')) {
                            date = date.split('T')[0]
                        }
                        holidayData.push({
                            id: `holiday-${date}`,
                            date: date,
                            name: holiday.name,
                            type: holiday.type,
                            status: 'holiday'
                        })
                    })
                }

                setLeaves(calendarLeaves)
                setHolidays(holidayData)
            } catch (calendarError) {
                console.error("Failed to fetch admin calendar:", calendarError)
                setLeaves([])
                setHolidays([])
                throw calendarError
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
                <p className="text-base text-gray-500">View employees on leave and public holidays</p>
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
                                    <span className="text-xs text-gray-500">On Leave</span>
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
                                today.setHours(0, 0, 0, 0) // Reset time for accurate comparison

                                const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                                currentDayDate.setHours(0, 0, 0, 0)

                                const isToday = day === today.getDate() &&
                                    currentDate.getMonth() === today.getMonth() &&
                                    currentDate.getFullYear() === today.getFullYear()

                                const isFutureDate = currentDayDate > today

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

                                        {/* Display summary badge - bottom aligned */}
                                        {items.length > 0 && (
                                            <div className="mt-auto">
                                                {/* Count employees on leave (excluding holidays) */}
                                                {(() => {
                                                    const leaveCount = items.filter(item => item.status !== 'holiday').length
                                                    const hasHoliday = items.some(item => item.status === 'holiday')

                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            {leaveCount > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                                                        setSelectedDay({
                                                                            date: dateStr,
                                                                            employees: items.filter(item => item.status !== 'holiday'),
                                                                            holiday: items.find(item => item.status === 'holiday')
                                                                        })
                                                                    }}
                                                                    className="text-xs font-medium leading-snug px-2 py-1 rounded text-left transition-all hover:scale-105 hover:shadow-md cursor-pointer bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                                >
                                                                    {leaveCount} on leave
                                                                </button>
                                                            )}
                                                            {hasHoliday && (
                                                                <button
                                                                    onClick={() => {
                                                                        const holiday = items.find(item => item.status === 'holiday')
                                                                        setSelectedItem(holiday)
                                                                    }}
                                                                    className="text-xs font-medium leading-snug px-2 py-1 rounded text-left transition-all hover:scale-105 hover:shadow-md cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 truncate"
                                                                >
                                                                    {items.find(item => item.status === 'holiday')?.name || 'Holiday'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Day Details Dialog - Shows list of employees on leave */}
            <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                            {selectedDay?.employees?.length || 0} on leave
                        </DialogTitle>
                        {selectedDay?.date && (
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(selectedDay.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        )}
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="space-y-3">
                            {selectedDay?.employees?.map((employee: any, idx: number) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar placeholder */}
                                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-emerald-700 font-semibold text-sm">
                                                {employee.employeeName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'NA'}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Employee name and type */}
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{employee.employeeName || 'Employee'}</h4>
                                                    {employee.employeeCode && (
                                                        <p className="text-xs text-gray-500">{employee.employeeCode}</p>
                                                    )}
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${employee.type === 'sick' ? 'bg-blue-100 text-blue-700' :
                                                    employee.type === 'annual' ? 'bg-emerald-100 text-emerald-700' :
                                                        employee.type === 'personal' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {employee.type?.charAt(0).toUpperCase() + employee.type?.slice(1) || 'Leave'}
                                                </span>
                                            </div>

                                            {/* Department */}
                                            {employee.department && (
                                                <p className="text-sm text-gray-600 mb-2">{employee.department}</p>
                                            )}

                                            {/* Reason */}
                                            {employee.reason && (
                                                <p className="text-sm text-gray-700 italic mb-2">"{employee.reason}"</p>
                                            )}

                                            {/* Duration */}
                                            {employee.startDate && employee.endDate && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>
                                                        {new Date(employee.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        {' - '}
                                                        {new Date(employee.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                        <label className="text-sm font-medium text-gray-500">Employee</label>
                                        <p className="text-base font-medium text-gray-900 mt-1">
                                            {selectedItem.employeeName || 'Employee'}
                                            {selectedItem.employeeCode && (
                                                <span className="text-sm text-gray-500 ml-2">({selectedItem.employeeCode})</span>
                                            )}
                                        </p>
                                    </div>
                                    {selectedItem.department && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Department</label>
                                            <p className="text-base font-medium text-gray-900 mt-1">
                                                {selectedItem.department}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Leave Type</label>
                                        <p className="text-base font-medium text-gray-900 mt-1 capitalize">
                                            {selectedItem.type || 'N/A'}
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
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
