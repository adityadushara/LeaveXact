"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { getUser, logout } from "@/lib/auth"
import { Calendar, LayoutDashboard, Users, FileText, BarChart3, Shield, User as UserIcon, LogOut, ChevronUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setUser(getUser())
    setMounted(true)

    // Listen for user updates
    const handleUserUpdate = () => {
      setUser(getUser())
    }

    // Listen for storage changes (when user is updated in another tab or component)
    window.addEventListener('storage', handleUserUpdate)
    // Listen for custom user update event
    window.addEventListener('userUpdated', handleUserUpdate)

    return () => {
      window.removeEventListener('storage', handleUserUpdate)
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [])

  const adminRoutes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      label: "All Requests",
      icon: FileText,
      href: "/admin/requests",
    },
    {
      label: "Employees",
      icon: Users,
      href: "/admin/employees",
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/admin/calendar",
    },
    {
      label: "Audit Logs",
      icon: Shield,
      href: "/admin/audit-logs",
    },
  ]

  const employeeRoutes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/employee/dashboard",
    },
    {
      label: "Apply for Leave",
      icon: Calendar,
      href: "/employee/apply",
    },
    {
      label: "My Requests",
      icon: FileText,
      href: "/employee/requests",
    },
    {
      label: "Calendar",
      icon: Calendar,
      href: "/employee/calendar",
    },
  ]

  const routes = user?.role === "admin" ? adminRoutes : employeeRoutes

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn("pb-12 w-64", className)}>
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="space-y-1">
              {/* Render placeholder to match server HTML */}
              <div className="h-12 bg-muted/10 rounded-lg animate-pulse" />
              <div className="h-12 bg-muted/10 rounded-lg animate-pulse" />
              <div className="h-12 bg-muted/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full w-64 border-r border-emerald-100", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-emerald-100">
        <h1 className="text-xl font-bold text-emerald-600">LeaveXact</h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        <div className="px-3">
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                prefetch={true}
                className={cn(
                  "text-sm group flex items-center px-3 py-2.5 w-full font-medium cursor-pointer rounded-lg transition-colors",
                  pathname === route.href
                    ? "text-white bg-emerald-600 hover:bg-emerald-700"
                    : "text-gray-700 hover:bg-emerald-50",
                )}
              >
                <route.icon className="h-4 w-4 mr-3" />
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User Info at Bottom */}
      <div className="p-4 border-t border-emerald-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                {user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "N"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Nathan"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "nathan@leavexact.com"}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            <DropdownMenuItem
              onClick={() => router.push(user?.role === "admin" ? "/admin/profile" : "/employee/profile")}
              className="cursor-pointer hover:!bg-gray-100 focus:!bg-gray-100 hover:!text-gray-900 focus:!text-gray-900 focus-visible:!ring-0 focus-visible:!ring-offset-0"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                router.push("/login")
              }}
              className="cursor-pointer text-red-600 hover:!bg-red-50 focus:!bg-red-50 hover:!text-red-700 focus:!text-red-700 focus-visible:!ring-0 focus-visible:!ring-offset-0"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
