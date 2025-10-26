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
import { Eye, EyeOff, Info, Lock, Mail, User, Shield } from "lucide-react"

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-teal-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 bg-green-200/30 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-36 h-36 bg-emerald-200/20 rounded-full blur-3xl"></div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md shadow-lg border border-gray-200 bg-white">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
            <CardDescription className="text-sm text-gray-500 mt-1">
              Sign in to your LeaveXact account
            </CardDescription>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">Secure Login</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">Your connection is encrypted and secure</p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  <span className="text-red-500">*</span> Role
                </Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setValue("role", value as "admin" | "employee")}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="employee" id="employee" />
                    <Label htmlFor="employee" className="text-sm font-normal cursor-pointer">Employee</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="text-sm font-normal cursor-pointer">Admin</Label>
                  </div>
                </RadioGroup>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  <span className="text-red-500">*</span> Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register("email")}
                    className={`h-11 pl-10 bg-white border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${errors.email ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    <span className="text-red-500">*</span> Password
                  </Label>
                  <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Info className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className={`h-11 pl-10 pr-10 bg-white border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${errors.password ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
