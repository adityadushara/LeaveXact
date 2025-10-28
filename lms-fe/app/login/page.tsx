"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { authAPI } from "@/lib/api"
import { setToken, setUser, isAuthenticated, isAdmin } from "@/lib/auth"
import { Eye, EyeOff, Lock, Mail, Shield, UserCircle, Briefcase, LogIn } from "lucide-react"

const loginSchema = z.object({
  role: z.enum(["admin", "employee"], {
    required_error: "Please select a role",
  }),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "employee",
    },
  })

  const selectedRole = watch("role")

  useEffect(() => {
    // Check if already authenticated and redirect
    if (isAuthenticated()) {
      const redirectUrl = isAdmin() ? "/admin/dashboard" : "/employee/dashboard"
      window.location.href = redirectUrl
    }
  }, [])

  const onSubmit = async (data: LoginForm) => {
    console.log('[LOGIN] Form submitted!', data)
    setIsLoading(true)
    try {
      console.log('[LOGIN] Calling authAPI.login...')
      const response = await authAPI.login(data.email, data.password)
      console.log('[LOGIN] API call successful!')
      console.log('[LOGIN] Full response:', response)

      // Handle different response formats from backend
      const user = response.user || response
      const token = response.token || response.access_token

      console.log('[LOGIN] Extracted user:', user)
      console.log('[LOGIN] Extracted token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN')

      // Verify role matches selection
      if (data.role === "admin" && user.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "This account is not authorized for admin access.",
          variant: "destructive",
          onClose: () => { },
        })
        setIsLoading(false)
        return
      }

      if (data.role === "employee" && user.role === "admin") {
        toast({
          title: "Wrong Portal",
          description: "This is an admin account. Please select Admin role.",
          variant: "destructive",
          onClose: () => { },
        })
        setIsLoading(false)
        return
      }

      console.log('[LOGIN] Setting token and user data...')
      setToken(token)
      setUser(user)

      console.log('[LOGIN] Token set, checking localStorage:', {
        hasToken: !!localStorage.getItem('access_token'),
        hasUser: !!localStorage.getItem('user')
      })

      console.log('[LOGIN] Showing success toast...')
      // Show toast but don't wait for it
      setTimeout(() => {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
          onClose: () => { },
        })
      }, 0)

      console.log('[LOGIN] Waiting 300ms for cookies to be set...')
      // Increased delay to ensure cookies are set
      await new Promise(resolve => setTimeout(resolve, 300))

      // Hard redirect to ensure middleware picks up the new cookies
      const redirectUrl = user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"
      console.log('[LOGIN] Redirecting to:', redirectUrl)
      console.log('[LOGIN] Current cookies:', document.cookie)

      // Try multiple redirect methods for maximum compatibility
      try {
        console.log('[LOGIN] Attempting window.location.replace...')
        window.location.replace(redirectUrl)
      } catch (e) {
        console.error('[LOGIN] location.replace failed:', e)
        try {
          console.log('[LOGIN] Attempting window.location.href...')
          window.location.href = redirectUrl
        } catch (e2) {
          console.error('[LOGIN] location.href failed:', e2)
          // Last resort: use router
          console.log('[LOGIN] Using router.push as fallback...')
          router.push(redirectUrl)
        }
      }
      console.log('[LOGIN] Redirect initiated')
      return // Exit early to prevent finally block
    } catch (error: any) {
      console.error('[LOGIN] Error occurred:', error)
      console.error('[LOGIN] Error message:', error.message)
      console.error('[LOGIN] Error stack:', error.stack)
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
        onClose: () => { },
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Floating Elements - Subtle and Modern */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-20 w-64 h-64 bg-green-100/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-0 shadow-lg bg-white animate-fade-in-scale">
          <CardHeader className="text-center pb-6 pt-10 space-y-4">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-300">
              <Shield className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-base text-gray-500">
                Sign in to your LeaveXact account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Role Selection - Modern Card Style */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Select Role</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setValue("role", value as "admin" | "employee")}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem value="employee" id="employee" className="peer sr-only" />
                    <Label
                      htmlFor="employee"
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all cursor-pointer ${selectedRole === "employee"
                        ? "bg-emerald-100 ring-2 ring-emerald-500 shadow-sm"
                        : "bg-emerald-50 hover:bg-emerald-100"
                        }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Employee</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem value="admin" id="admin" className="peer sr-only" />
                    <Label
                      htmlFor="admin"
                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl transition-all cursor-pointer ${selectedRole === "admin"
                        ? "bg-[#019866]/15 ring-2 ring-[#019866] shadow-sm"
                        : "bg-[#019866]/5 hover:bg-[#019866]/10"
                        }`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-[#019866] flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Admin</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.role.message}
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    {...register("email")}
                    className={`h-12 pl-11 pr-4 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className={`h-12 pl-11 pr-12 bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Security Notice */}
              <div className="pt-2">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Secure encrypted connection</span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
