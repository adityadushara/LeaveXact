"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { authAPI } from "@/lib/api"
import { setToken, setUser, isAuthenticated, isAdmin } from "@/lib/auth"
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Calendar, Clock, CheckCircle, UserCheck, CalendarDays, TrendingUp, Users } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function EmployeeLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    console.log("Employee form submitted with data:", data)
    setIsLoading(true)
    try {
      console.log("Attempting employee login...")
      const { user, token } = await authAPI.login(data.email, data.password)
      console.log("Employee login successful:", { user, token })

      // Verify employee role
      if (user.role === "admin") {
        toast({
          title: "Wrong Portal",
          description: "You are an admin. Please use the admin login portal.",
          variant: "destructive",
          onClose: () => {},
        })
        setIsLoading(false)
        return
      }

      console.log('[EMPLOYEE LOGIN] Setting token and user data...')
      setToken(token)
      setUser(user)

      toast({
        title: "Welcome Back!",
        description: `Hello ${user.name}! Accessing your employee dashboard...`,
        onClose: () => {},
      })

      console.log('[EMPLOYEE LOGIN] Waiting for cookies...')
      // Increased delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 200))

      console.log('[EMPLOYEE LOGIN] Redirecting to employee dashboard')
      // Hard redirect to ensure middleware picks up the new cookies
      window.location.replace("/employee/dashboard")
      return // Exit early to prevent finally block
    } catch (error: any) {
      console.error("Employee login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Invalid employee credentials",
        variant: "destructive",
        onClose: () => {},
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2315803d' fill-opacity='0.05'%3E%3Cpath d='M40 0L50 20L70 20L55 35L60 55L40 45L20 55L25 35L10 20L30 20Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-white/50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Admin Login Link */}
      <div className="absolute top-6 right-6 z-10">
        <Link href="/admin/login">
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-white/50">
            Admin Login
          </Button>
        </Link>
      </div>

      <div className="relative flex min-h-screen">
        {/* Left Side - Employee Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-secondary/10 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
                <CalendarDays className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Employee Portal
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Access your personal LeaveXact dashboard to submit requests, track your time off, and manage your work-life balance.
              </p>
            </div>
            
            {/* Employee Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Submit Leave Requests</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Track Request Status</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>View Leave Balance</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Leave History & Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Employee Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <CalendarDays className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Employee Portal</h1>
              <p className="text-sm text-muted-foreground mt-2">Manage your time off efficiently</p>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Employee Sign In</CardTitle>
                <CardDescription className="text-base">
                  Access your personal leave dashboard
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Employee Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="employee@company.com"
                        {...register("email")}
                        className={`pl-10 h-12 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center">
                        <span className="w-1 h-1 bg-destructive rounded-full mr-2"></span>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Employee Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...register("password")}
                        className={`pl-10 pr-12 h-12 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center">
                        <span className="w-1 h-1 bg-destructive rounded-full mr-2"></span>
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                        Accessing Dashboard...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Access Employee Portal
                      </div>
                    )}
                  </Button>
                </form>

                {/* Additional Links */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Need access to the system?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                      Contact HR Department
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Administrator? Use the{" "}
                    <Link href="/admin/login" className="text-blue-600 hover:underline">
                      Admin Login
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
