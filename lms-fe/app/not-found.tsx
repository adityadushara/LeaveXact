"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#019866]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Top Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-[#019866] via-emerald-500 to-teal-500"></div>
          
          <div className="p-12 text-center">
            {/* Icon */}
            <div className="mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-[#019866]/10 rounded-full blur-2xl"></div>
              <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-[#019866] to-emerald-600 rounded-3xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <FileQuestion className="h-16 w-16 text-white" strokeWidth={1.5} />
              </div>
            </div>

            {/* 404 Text */}
            <div className="mb-6">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-[#019866] to-emerald-600 bg-clip-text text-transparent mb-2">
                404
              </h1>
              <div className="h-1 w-24 mx-auto bg-gradient-to-r from-[#019866] to-emerald-600 rounded-full"></div>
            </div>

            {/* Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto">
              Oops! The page you're looking for doesn't exist or has been moved to a new location.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link href="/" className="flex-1">
                <Button className="w-full h-12 bg-[#019866] hover:bg-[#017a52] text-white font-medium rounded-xl shadow-lg shadow-[#019866]/20 hover:shadow-xl hover:shadow-[#019866]/30 transition-all duration-300 transform hover:-translate-y-0.5">
                  <Home className="mr-2 h-5 w-5" />
                  Go Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="flex-1 h-12 border-2 border-gray-200 hover:border-[#019866] hover:bg-[#019866]/5 font-medium rounded-xl transition-all duration-300 transform hover:-translate-y-0.5" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </div>

            {/* Help Text */}
            <p className="mt-8 text-sm text-gray-500">
              Need help? <Link href="/contact" className="text-[#019866] hover:text-[#017a52] font-medium underline">Contact support</Link>
            </p>
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Error Code: 404 • Page Not Found
          </p>
        </div>
      </div>
    </div>
  )
}
