import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeeDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header Section Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Leave Balance Cards Skeleton - 5 cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-white/80 backdrop-blur-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-9 w-12" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Recent Activity - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions Card */}
          <div className="rounded-lg bg-white/80 backdrop-blur-sm p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="rounded-lg bg-white/80 backdrop-blur-sm p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Leave Requests Card */}
        <div className="rounded-lg bg-white/80 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
