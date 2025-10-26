import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ToastProvider } from "@/components/ui/toast"
import { SessionExpiredDialog } from "@/components/session-expired-dialog"
// import { PerformanceMonitor } from "@/components/performance-monitor"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "LeaveXact",
  description: "LeaveXact - Professional Leave Management System for Organizations",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ToastProvider>
            {children}
            <SessionExpiredDialog />
          </ToastProvider>
          <Analytics />
        </Suspense>
        {/* <PerformanceMonitor /> */}
      </body>
    </html>
  )
}
