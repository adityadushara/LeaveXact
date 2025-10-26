"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminAPI, leaveAPI } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { Users, Search, Filter, Calendar, Mail, Building, Plus, Trash2, User, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Employee {
  id: string
  name: string
  email: string
  employeeId: string
  department: string
  role: string
  gender?: string
  leaveBalance: {
    annual: number
    sick: number
    personal: number
    emergency: number
    maternity: number
    paternity: number
  }
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [employeeRequests, setEmployeeRequests] = useState<{ [key: string]: any[] }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const { addToast } = useToast()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newDept, setNewDept] = useState("")
  const [newDeptOther, setNewDeptOther] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editDept, setEditDept] = useState("")
  const [editEmpId, setEditEmpId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, departmentFilter])

  const fetchEmployees = async () => {
    try {
      const [users, allRequests] = await Promise.all([
        adminAPI.getEmployees(),
        leaveAPI.getAllRequests()
          .catch(() => {
            console.log('Unable to fetch leave requests, showing employees without leave data')
            return []
          }),
        // Add a minimum delay to show skeleton animation (400ms)
        new Promise(resolve => setTimeout(resolve, 400))
      ])

      // Filter out admin users - only show regular employees
      const employeesOnly = users.filter((user: Employee) => user.role !== 'admin')
      setEmployees(employeesOnly)

      // Group requests by employee ID
      const requestsByEmployee: { [key: string]: any[] } = {}
      employeesOnly.forEach((emp: Employee) => {
        requestsByEmployee[emp.id] = allRequests.filter((req: any) => {
          const requestUserId = typeof req.userId === 'object' ? req.userId.id : req.userId
          return requestUserId === emp.id
        })
      })
      setEmployeeRequests(requestsByEmployee)
      setIsLoading(false)
    } catch (error: any) {
      addToast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter((employee) => employee.department.toLowerCase() === departmentFilter.toLowerCase())
    }

    setFilteredEmployees(filtered)
  }

  const handleCreate = async () => {
    const finalDept = newDept === 'other' ? newDeptOther : newDept
    if (!newName || !newEmail || !finalDept) {
      addToast({ title: "Missing info", description: "Please fill name, email and department", variant: "destructive" })
      return
    }
    try {
      setSubmitting(true)
      // Generate a default password (you may want to make this configurable)
      const defaultPassword = "Welcome@123"
      await adminAPI.createEmployee({ name: newName, email: newEmail, password: defaultPassword, department: finalDept })
      setIsCreateOpen(false)
      setNewName("")
      setNewEmail("")
      setNewDept("")
      setNewDeptOther("")
      await fetchEmployees()
      addToast({ title: "Employee created", description: `Default password: ${defaultPassword}` })
    } catch (e: any) {
      addToast({ title: "Failed", description: e?.message || "Could not create employee", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee? This also removes their requests and logs.")) return
    try {
      await adminAPI.deleteEmployee(id)
      await fetchEmployees()
      addToast({ title: "Employee deleted" })
    } catch (e: any) {
      addToast({ title: "Failed", description: e?.message || "Could not delete", variant: "destructive" })
    }
  }

  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setEditName(emp.name)
    setEditEmail(emp.email)
    setEditDept(emp.department)
    setEditEmpId(emp.employeeId)
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editTarget) return
    if (!editName || !editEmail || !editDept) {
      addToast({ title: "Missing info", description: "Please fill name, email and department", variant: "destructive" })
      return
    }
    try {
      setSubmitting(true)
      await adminAPI.updateEmployee(editTarget.id, { name: editName, email: editEmail, department: editDept, employee_id: editEmpId })
      setIsEditOpen(false)
      setEditTarget(null)
      await fetchEmployees()
      addToast({ title: "Employee updated" })
    } catch (e: any) {
      addToast({ title: "Failed", description: e?.message || "Could not update employee", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const getDepartments = () => {
    // Only count departments from regular employees (exclude admin)
    const employeeDepartments = employees.filter(emp => emp.role !== 'admin').map((emp) => emp.department)
    const departments = [...new Set(employeeDepartments)]
    return departments.sort()
  }

  const getTotalLeaveBalance = (leaveBalance: Employee["leaveBalance"], gender?: string) => {
    if (!leaveBalance) return 0
    const isFemale = gender?.toLowerCase() === 'female'
    const isMale = gender?.toLowerCase() === 'male'
    
    return (leaveBalance.annual || 0) + 
           (leaveBalance.sick || 0) + 
           (leaveBalance.personal || 0) + 
           (leaveBalance.emergency || 0) + 
           (isFemale ? (leaveBalance.maternity || 0) : 0) +
           (isMale ? (leaveBalance.paternity || 0) : 0)
  }

  const isLeaveRequestExpired = (endDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const requestEndDate = new Date(endDate)
    requestEndDate.setHours(0, 0, 0, 0)
    return requestEndDate < today
  }

  const hasExpiredPendingRequests = (employeeId: string) => {
    const requests = employeeRequests[employeeId] || []
    return requests.some((req: any) =>
      req.status === 'pending' && isLeaveRequestExpired(req.endDate)
    )
  }

  // Show skeleton loading while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="w-full mx-auto px-4">
          <div className="mb-8">
            <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse mb-2" />
            <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
                </div>
                <div className="h-9 w-12 bg-gray-200 rounded-md animate-pulse" />
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="rounded-lg bg-white p-6 mb-6 space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse" />
            <div className="flex gap-4">
              <div className="h-10 flex-1 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-10 w-48 bg-gray-200 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Employee Cards Skeleton */}
          <div className="rounded-lg bg-white p-6 space-y-4">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-16 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-16 bg-gray-200 rounded-md animate-pulse" />
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="w-full mx-auto px-4">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Employee Management</h1>
            <p className="text-gray-500">View and manage all registered employees</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] rounded-xl">
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>Create a new employee record.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      autoFocus
                      placeholder="e.g., Jane Doe"
                      className="pl-9 !border-emerald-500 focus-visible:!ring-emerald-500"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      aria-invalid={!newName ? true : false}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-9 !border-emerald-500 focus-visible:!ring-emerald-500"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      aria-invalid={!newEmail ? true : false}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dept">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={newDept} onValueChange={(v) => setNewDept(v)}>
                      <SelectTrigger id="dept" className="pl-9">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDepartments().map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                        <SelectItem value="other">Other…</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newDept === 'other' && (
                    <div className="relative">
                      <Input
                        placeholder="Type a department name"
                        value={newDeptOther}
                        onChange={(e) => setNewDeptOther(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateOpen(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={submitting || !newName || !newEmail || (!newDept || (newDept === 'other' && !newDeptOther))} 
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-none group hover:shadow-md transition-all duration-300 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Users className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-purple-600 transition-colors duration-300">Total Employees</CardTitle>
                <CardDescription>Registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{employees.length}</span>
                  <span className="text-sm text-gray-500">users</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none group hover:shadow-md transition-all duration-300 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Building className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <Building className="h-4 w-4 text-blue-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">Departments</CardTitle>
                <CardDescription>Active departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{getDepartments().length}</span>
                  <span className="text-sm text-gray-500">departments</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-none group hover:shadow-md transition-all duration-300 bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 relative overflow-hidden">
                    <Calendar className="h-6 w-6 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                  </div>
                  <Calendar className="h-4 w-4 text-green-500" />
                </div>
                <CardTitle className="text-lg font-semibold group-hover:text-green-600 transition-colors duration-300">Avg Leave Balance</CardTitle>
                <CardDescription>Days per employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                    {employees.length > 0
                      ? Math.round(
                        employees.reduce((acc, emp) => acc + getTotalLeaveBalance(emp.leaveBalance, emp.gender), 0) / employees.length,
                      )
                      : 0}
                  </span>
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
              <CardDescription className="text-sm text-gray-500">Search and filter employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search employees by name, email, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-0 bg-gray-50 focus:bg-white focus:border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {getDepartments().map((dept) => (
                        <SelectItem key={dept} value={dept.toLowerCase()}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employees List */}
          <Card className="border-0 shadow-none bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Employees ({filteredEmployees.length})
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">All registered employees and their information</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {employees.length === 0 ? "No Employees" : "No Matching Employees"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {employees.length === 0 ? "No employees found" : "No employees match your filters"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEmployees.map((employee) => (
                    <Card
                      key={employee.id}
                      className="bg-white border border-gray-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-pointer focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      onClick={() => router.push(`/admin/employees/${employee.id}`)}
                      role="button"
                      aria-label={`View details for ${employee.name}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="h-12 w-12 rounded-full bg-[#019866] flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-white">
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-[#019866] transition-colors">{employee.name}</CardTitle>
                              <p className="text-xs text-gray-500 mt-0.5">{employee.employeeId}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className="text-xs bg-[#019866]/10 text-[#019866] hover:bg-[#019866]/20">
                                  {employee.role}
                                </Badge>
                                {hasExpiredPendingRequests(employee.id) && (
                                  <Badge className="text-xs bg-gray-300 text-gray-700">
                                    Expired
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {employee.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(employee.id)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-end">
                          {employee.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(employee)
                              }}
                              className="gap-2 hover:bg-[#ECFCF4] hover:text-emerald-600 hover:border-emerald-600"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate">{employee.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Building className="h-4 w-4 text-gray-400" />
                            <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 capitalize">
                              {employee.gender || 'Not specified'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-3 text-center text-gray-900">Leave Balance</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                              <div className="text-base font-bold text-blue-600">{employee.leaveBalance?.annual || 0}</div>
                              <div className="text-xs text-blue-600/70">Annual</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded-lg">
                              <div className="text-base font-bold text-green-600">{employee.leaveBalance?.sick || 0}</div>
                              <div className="text-xs text-green-600/70">Sick</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded-lg">
                              <div className="text-base font-bold text-yellow-600">{employee.leaveBalance?.personal || 0}</div>
                              <div className="text-xs text-yellow-600/70">Personal</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded-lg">
                              <div className="text-base font-bold text-orange-600">{employee.leaveBalance?.emergency || 0}</div>
                              <div className="text-xs text-orange-600/70">Emergency</div>
                            </div>
                            {employee.gender?.toLowerCase() === 'female' && (
                              <div className="text-center p-2 bg-pink-50 rounded-lg">
                                <div className="text-base font-bold text-pink-600">{employee.leaveBalance?.maternity || 0}</div>
                                <div className="text-xs text-pink-600/70">Maternity</div>
                              </div>
                            )}
                            {employee.gender?.toLowerCase() === 'male' && (
                              <div className="text-center p-2 bg-indigo-50 rounded-lg">
                                <div className="text-base font-bold text-indigo-600">{employee.leaveBalance?.paternity || 0}</div>
                                <div className="text-xs text-indigo-600/70">Paternity</div>
                              </div>
                            )}
                          </div>
                          <div className="mt-2 text-center">
                            <p className="text-xs text-gray-500">
                              Total: <span className="font-medium text-[#019866]">{getTotalLeaveBalance(employee.leaveBalance, employee.gender)} days</span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t text-center">
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs text-[#019866] hover:text-[#017a52]"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/admin/employees/${employee.id}`)
                            }}
                          >
                            Click to view details →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Employee Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[520px] rounded-xl">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>Update employee details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-empid">Employee ID</Label>
                  <Input id="edit-empid" value={editEmpId} onChange={(e) => setEditEmpId(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-dept">Department</Label>
                  <Select value={editDept} onValueChange={setEditDept}>
                    <SelectTrigger id="edit-dept">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDepartments().map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditOpen(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={submitting || !editName || !editEmail || !editDept || !editEmpId}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}




