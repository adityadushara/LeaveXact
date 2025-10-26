"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, logout, User } from "@/lib/auth"
import { usePathname } from "next/navigation"
import { LogOut, User as UserIcon, Menu } from "lucide-react"
import Image from "next/image"

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setUser(getUser())
    setIsHydrated(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Use consistent values for SSR and initial client render
  const homeHref = isHydrated && user?.role === "admin" ? "/admin/dashboard" : 
                   isHydrated && user?.role === "employee" ? "/employee/dashboard" : "/login"
  const initials = isHydrated && user?.name ? 
    user.name.split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() : "U"

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold hover:bg-blue-600" aria-label="Open menu">
            {initials}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end" forceMount>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleLogout() }} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
