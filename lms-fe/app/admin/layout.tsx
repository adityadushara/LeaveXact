"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, isAdmin, getUser } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
  }, []) // Remove router dependency to prevent re-runs

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 md:pl-64">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
