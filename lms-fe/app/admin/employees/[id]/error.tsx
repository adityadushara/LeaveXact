"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  useEffect(() => {
    console.error("Employee details error:", error)
  }, [error])

  return (
    <div className="p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Something went wrong!</span>
          </CardTitle>
          <CardDescription>
            There was an error loading the employee details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
          <div className="flex space-x-2">
            <Button onClick={reset} variant="outline">
              Try again
            </Button>
            <Button onClick={() => { try { router.push("/admin/employees") } catch {} }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
