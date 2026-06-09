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
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Shield, Users, BarChart3, Settings, Crown, TrendingUp } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
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
    console.log("Admin form submitted with data:", data)
    try {
      console.log("Attempting admin login...")
      const { user, token } = await authAPI.login(data.email, data.password)
      console.log("Admin login successful:", { user, token })

      // Verify admin role
      if (user.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "This is an admin-only portal. Please use the employee login.",
          variant: "destructive",
          onClose: () => {},
        })
        return
      }

      console.log('[ADMIN LOGIN] Setting token and user data...')
      setToken(token)
      setUser(user)

      toast({
        title: "Admin Access Granted",
        description: `Welcome back, ${user.name}! Accessing admin dashboard...`,
        onClose: () => {},
      })

      console.log('[ADMIN LOGIN] Waiting for cookies...')
      // Increased delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 200))

      console.log('[ADMIN LOGIN] Redirecting to admin dashboard')
      // Hard redirect to ensure middleware picks up the new cookies
      window.location.replace("/admin/dashboard")
      return // Exit early
    } catch (error: any) {
      console.error("Admin login error:", error)
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
        onClose: () => {},
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M50 0L60 20L80 20L65 35L70 55L50 45L30 55L35 35L20 20L40 20Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Employee Login Link */}
      <div className="absolute top-6 right-6 z-10">
        <Link href="/employee/login">
          <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
            Employee Login
          </Button>
        </Link>
      </div>

      <div className="relative flex min-h-screen">
        {/* Left Side - Admin Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-white/5 to-white/10 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Admin Portal
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Access the LeaveXact administrative dashboard to manage employees, approve leave requests, and oversee organizational policies.
              </p>
            </div>
            
            {/* Admin Features */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3 text-sm text-white/70">
                <Users className="h-4 w-4 text-yellow-400" />
                <span>Employee Management</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-white/70">
                <BarChart3 className="h-4 w-4 text-yellow-400" />
                <span>Analytics & Reports</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-white/70">
                <Settings className="h-4 w-4 text-yellow-400" />
                <span>System Configuration</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm text-white/70">
                <Shield className="h-4 w-4 text-yellow-400" />
                <span>Security & Access Control</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Admin Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
              <p className="text-sm text-white/80 mt-2">Administrative Access Only</p>
            </div>

            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/10 to-orange-500/10">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Administrator Sign In</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Access the administrative dashboard
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Admin Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@company.com"
                        {...register("email")}
                        className={`pl-10 h-12 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Admin Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        {...register("password")}
                        className={`pl-10 pr-12 h-12 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 mr-2" />
                      Access Admin Dashboard
                    </div>
                  </Button>
                </form>

                {/* Additional Links */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Need admin access?{" "}
                    <Link href="/register" className="text-yellow-600 hover:underline font-medium">
                      Contact System Administrator
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Employee? Use the{" "}
                    <Link href="/employee/login" className="text-blue-600 hover:underline">
                      Employee Login
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
