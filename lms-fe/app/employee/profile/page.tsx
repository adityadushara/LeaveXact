"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { getUser, setUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    User,
    Mail,
    Briefcase,
    Shield,
    Edit,
    Save,
    X,
    Lock,
    Eye,
    EyeOff,
    UserCircle2,
    BadgeCheck
} from "lucide-react"

export default function ProfilePage() {
    const router = useRouter()
    const { addToast } = useToast()
    const user = getUser()

    const [isEditing, setIsEditing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department: "",
    })

    useEffect(() => {
        if (!user) {
            router.replace("/login")
            return
        }

        if (!mounted) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                department: user.department || "",
            })
            setMounted(true)
        }
    }, [mounted, router])

    const handleSave = async () => {
        try {
            // Update user data
            if (user) {
                const updatedUser = { ...user, ...formData }
                setUser(updatedUser as any)

                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('userUpdated'))

                addToast({
                    title: "Success!",
                    description: "Your profile has been updated successfully",
                })

                setIsEditing(false)
            }
        } catch (error: any) {
            addToast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive",
            })
        }
    }

    const handleCancel = () => {
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
            department: user?.department || "",
        })
        setIsEditing(false)
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            })
            return
        }

        if (passwordData.newPassword.length < 6) {
            addToast({
                title: "Error",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            })
            return
        }

        try {
            // Here you would call your password change API
            addToast({
                title: "Success!",
                description: "Your password has been changed successfully",
            })

            setIsPasswordDialogOpen(false)
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } catch (error: any) {
            addToast({
                title: "Error",
                description: error.message || "Failed to change password",
                variant: "destructive",
            })
        }
    }

    if (!mounted || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-slate-50 p-4 md:p-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-6">
                        <Skeleton className="h-8 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>

                    {/* Profile Card Skeleton */}
                    <Card className="border border-slate-200/60 shadow-lg shadow-emerald-100/50 bg-white overflow-hidden">
                        <CardHeader className="pb-6 border-b border-slate-100">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                {/* Avatar and Info Skeleton */}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full" />
                                        <Skeleton className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-7 w-40" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                {/* Buttons Skeleton */}
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-9 w-36" />
                                    <Skeleton className="h-9 w-28" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            {/* Section Title Skeleton */}
                            <div className="mb-6">
                                <Skeleton className="h-5 w-40 mb-1" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            {/* Form Fields Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-11 w-full rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">My Profile</h1>
                    <p className="text-sm text-slate-600">Manage your personal information and settings</p>
                </div>

                {/* Profile Card */}
                <Card className="border border-slate-200/60 shadow-lg shadow-emerald-100/50 bg-white overflow-hidden">
                    <CardHeader className="pb-6 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                                        <UserCircle2 className="h-9 w-9 md:h-11 md:w-11 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-3 border-white flex items-center justify-center">
                                        <BadgeCheck className="h-3.5 w-3.5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-900">{formData.name}</CardTitle>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                            <Briefcase className="h-3 w-3" />
                                            {formData.department || "No Department"}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 capitalize">
                                            <Shield className="h-3 w-3" />
                                            {user?.role || "Employee"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {!isEditing ? (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={() => setIsPasswordDialogOpen(true)}
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 transition-all duration-200"
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Change Password
                                    </Button>
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        size="sm"
                                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 transition-all duration-200"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        size="sm"
                                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 md:p-8">
                        <div className="mb-6">
                            <h3 className="text-base font-semibold text-slate-900 mb-1">Personal Information</h3>
                            <p className="text-sm text-slate-600">Your account details and contact information</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-emerald-600" />
                                    Full Name
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-slate-50 border-slate-200 h-11 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                        placeholder="Enter your full name"
                                    />
                                ) : (
                                    <div className="h-11 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                                        <p className="text-sm font-medium text-slate-900">{formData.name || "—"}</p>
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-emerald-600" />
                                    Email Address
                                </Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="bg-slate-50 border-slate-200 h-11 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                        type="email"
                                        placeholder="Enter your email"
                                    />
                                ) : (
                                    <div className="h-11 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                                        <p className="text-sm font-medium text-slate-900">{formData.email || "—"}</p>
                                    </div>
                                )}
                            </div>

                            {/* Employee ID */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Employee ID
                                </Label>
                                <div className="h-11 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                                    <p className="text-sm font-medium text-slate-900">{user?.employee_id || user?.id || "—"}</p>
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-emerald-600" />
                                    Gender
                                </Label>
                                <div className="h-11 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                                    <p className="text-sm font-medium text-slate-900 capitalize">
                                        {(user as any)?.gender || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                <Lock className="h-5 w-5 text-white" />
                            </div>
                            Change Password
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600">
                            Secure your account with a strong password
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                Current Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="bg-slate-50 border-slate-200 h-11 pr-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="bg-slate-50 border-slate-200 h-11 pr-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                Must be at least 6 characters
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="bg-slate-50 border-slate-200 h-11 pr-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-lg"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsPasswordDialogOpen(false)
                                setPasswordData({
                                    currentPassword: "",
                                    newPassword: "",
                                    confirmPassword: "",
                                })
                            }}
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400 transition-all duration-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePasswordChange}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
