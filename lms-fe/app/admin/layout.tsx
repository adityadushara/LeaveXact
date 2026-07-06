"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, isAdmin, getUser } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Only run authentication check once on mount
    const checkAuth = () => {
      console.log('[Admin Layout] Checking authentication...')
      
      if (!isAuthenticated()) {
        console.log('[Admin Layout] Not authenticated, redirecting to login')
        router.push("/login")
        return
      }
      
      const user = getUser()
      if (!user) {
        console.log('[Admin Layout] No user data, redirecting to login')
        router.push("/login")
        return
      }

      console.log('[Admin Layout] User:', user.name, 'Role:', user.role)
      
      if (!isAdmin()) {
        console.log('[Admin Layout] Not admin, redirecting to employee dashboard')
        router.push("/employee/dashboard")
        return
      }
      
      console.log('[Admin Layout] Authentication successful')
    }
    
    checkAuth()
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row max-w-full overflow-x-hidden">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Open menu" className="h-9 w-9 rounded-lg hover:bg-emerald-50 hover:text-emerald-600">
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              LX
            </div>
            <span className="font-bold text-gray-900 tracking-tight">LeaveXact</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/50">
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay & Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={toggleMobileMenu} />
          <div className="relative z-10 flex flex-col w-72 max-w-[85vw] bg-white h-full shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  LX
                </div>
                <span className="font-bold text-gray-900 tracking-tight">LeaveXact</span>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="h-8 w-8 rounded-lg hover:bg-emerald-100">
                <X className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar className="w-full border-r-0" />
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 md:pl-64 min-w-0 max-w-full overflow-x-hidden">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
