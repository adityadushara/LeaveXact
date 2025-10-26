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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/toast"
import { authAPI } from "@/lib/api"
import { getUser, setUser, isAuthenticated } from "@/lib/auth"
import { User, Mail, Building, Calendar, Shield, Edit, Save, X, Lock, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [userProfile, setUserProfile] = useState(getUser())
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile?.name || "",
      email: userProfile?.email || "",
    },
  })

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    fetchProfile()
  }, [router])

  const fetchProfile = async () => {
    try {
      // Add a minimum delay to show skeleton animation (800ms)
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Get user data from localStorage (already available from auth system)
      const userData = getUser()
      if (userData) {
        setUserProfile(userData)
        reset({
          name: userData.name,
          email: userData.email,
        })
      }
      setIsPageLoading(false)
    } catch (error: any) {
      addToast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
      setIsPageLoading(false)
    }
  }



  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      // Note: In a real application, you would have an update profile endpoint
      // For now, we'll simulate the update
      addToast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
      setIsEditing(false)
    } catch (error: any) {
      addToast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset({
      name: userProfile?.name || "",
      email: userProfile?.email || "",
    })
    setIsEditing(false)
  }

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChangePassword = async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        addToast({ title: "Invalid Password", description: "New password must be at least 6 characters", variant: "destructive" })
        return
      }
      if (newPassword !== confirmPassword) {
        addToast({ title: "Mismatch", description: "New password and confirm password do not match", variant: "destructive" })
        return
      }
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword })
      addToast({ title: "Success", description: "Password changed successfully" })
      setIsChangingPassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: any) {
      addToast({ title: "Change Failed", description: e.message || "Failed to change password", variant: "destructive" })
    }
  }

  // Wait for client-side mount to avoid hydration mismatch
  if (!mounted || !userProfile || isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full px-6 py-8">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-5 w-96 bg-gray-200 rounded-md animate-pulse" />
              </div>
              <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Profile Information Card Skeleton */}
              <div className="md:col-span-2">
                <div className="rounded-lg border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 w-48 bg-gray-200 rounded-md animate-pulse" />
                    </div>
                    <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                  
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="space-y-6">
                {/* Avatar Card Skeleton */}
                <div className="rounded-lg border bg-card p-6 space-y-4">
                  <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse" />
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse" />
                    <div className="space-y-2 text-center w-full">
                      <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mx-auto" />
                      <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse mx-auto" />
                    </div>
                  </div>
                </div>

                {/* Leave Balance Card Skeleton */}
                <div className="rounded-lg border bg-card p-6 space-y-4">
                  <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse" />
                        <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-gray-200 animate-pulse" />
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-6 w-16 bg-gray-200 rounded-md animate-pulse" />
                  </div>
                </div>

                {/* Change Password Card Skeleton */}
                <div className="rounded-lg border bg-card p-6 space-y-4">
                  <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalLeaveBalance =
    (userProfile.leaveBalance?.annual || 0) + (userProfile.leaveBalance?.sick || 0) + (userProfile.leaveBalance?.personal || 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">Manage your account information and settings</p>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="transition-all duration-300 hover:scale-110">
              Back
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Information */}
            <div className="md:col-span-2">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center group">
                        <User className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Your account details and contact information</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="transition-all duration-300 hover:scale-110">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" {...register("name")} className={`transition-all duration-300 hover:scale-[1.02] ${errors.name ? "border-destructive" : ""}`} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          className={`transition-all duration-300 hover:scale-[1.02] ${errors.email ? "border-destructive" : ""}`}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>


                      <div className="flex space-x-2">
                        <Button type="submit" disabled={isLoading} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                          {isLoading ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading} className="transition-all duration-300 hover:scale-105">
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl font-medium text-primary">
                            {userProfile.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{userProfile.name}</h3>
                          <p className="text-muted-foreground">{userProfile.employeeId}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Department</p>
                            <p className="text-sm text-muted-foreground">{userProfile.department}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Role</p>
                            <Badge variant="outline" className="capitalize">
                              {userProfile.role}
                            </Badge>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <div className="rounded-md border p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <Lock className="mr-2 h-4 w-4" />
                                <p className="font-medium">Security</p>
                              </div>
                              {!isChangingPassword ? (
                                <Button size="sm" variant="outline" onClick={() => setIsChangingPassword(true)} className="transition-all duration-300 hover:scale-110">Change Password</Button>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={() => setIsChangingPassword(false)} className="transition-all duration-300 hover:scale-110">Close</Button>
                              )}
                            </div>
                            {isChangingPassword && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor="currentPassword">Current Password</Label>
                                  <div className="relative">
                                    <Input 
                                      id="currentPassword" 
                                      type={showCurrentPassword ? "text" : "password"} 
                                      value={currentPassword} 
                                      onChange={(e) => setCurrentPassword(e.target.value)} 
                                      className="transition-all duration-300 hover:scale-[1.02] pr-10" 
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newPassword">New Password</Label>
                                  <div className="relative">
                                    <Input 
                                      id="newPassword" 
                                      type={showNewPassword ? "text" : "password"} 
                                      value={newPassword} 
                                      onChange={(e) => setNewPassword(e.target.value)} 
                                      className="transition-all duration-300 hover:scale-[1.02] pr-10" 
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                                  <div className="relative">
                                    <Input 
                                      id="confirmPassword" 
                                      type={showConfirmPassword ? "text" : "password"} 
                                      value={confirmPassword} 
                                      onChange={(e) => setConfirmPassword(e.target.value)} 
                                      className="transition-all duration-300 hover:scale-[1.02] pr-10" 
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="sm:col-span-2">
                                  <Button onClick={handleChangePassword} className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg">Update Password</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Leave Balance & Stats */}
            <div className="space-y-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center group">
                    <Calendar className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Leave Balance
                  </CardTitle>
                  <CardDescription>Your current leave entitlements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{totalLeaveBalance}</div>
                    <p className="text-sm text-muted-foreground">Total Days Available</p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Leave</span>
                      <Badge variant="outline" className="font-medium">
                        {userProfile.leaveBalance?.annual || 0} days
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sick Leave</span>
                      <Badge variant="outline" className="font-medium">
                        {userProfile.leaveBalance?.sick || 0} days
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Personal Leave</span>
                      <Badge variant="outline" className="font-medium">
                        {userProfile.leaveBalance?.personal || 0} days
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() =>
                      router.push(userProfile.role === "admin" ? "/admin/dashboard" : "/employee/dashboard")
                    }
                  >
                    Go to Dashboard
                  </Button>
                  {userProfile.role === "employee" && (
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent transition-all duration-300 hover:scale-105"
                      onClick={() => router.push("/employee/apply")}
                    >
                      Apply for Leave
                    </Button>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

