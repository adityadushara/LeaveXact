import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

// Skeleton components for different UI elements
function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-xl animate-delay-100" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px] animate-delay-200" />
            <Skeleton className="h-4 w-[160px] animate-delay-300" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-[100px] animate-delay-400" />
          <Skeleton className="h-2 w-full rounded-full animate-delay-500" />
        </div>
      </div>
    </div>
  )
}

function SkeletonButton() {
  return (
    <div className="flex h-12 w-full items-center space-x-3 rounded-md border bg-card p-3 animate-in fade-in duration-300">
      <Skeleton className="h-4 w-4 animate-delay-100" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-[120px] animate-delay-200" />
        <Skeleton className="h-3 w-[80px] animate-delay-300" />
      </div>
      <Skeleton className="h-4 w-4 animate-delay-400" />
    </div>
  )
}

function SkeletonRequestItem() {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 animate-in fade-in duration-300">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-4 rounded-full animate-delay-100" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[120px] animate-delay-200" />
          <Skeleton className="h-3 w-[100px] animate-delay-300" />
          <Skeleton className="h-3 w-[80px] animate-delay-400" />
        </div>
      </div>
      <Skeleton className="h-6 w-[80px] rounded-full animate-delay-500" />
    </div>
  )
}

function SkeletonActivityItem() {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted p-3 animate-in fade-in duration-300">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-4 w-4 rounded-full animate-delay-100" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-[100px] animate-delay-200" />
          <Skeleton className="h-3 w-[80px] animate-delay-300" />
        </div>
      </div>
      <Skeleton className="h-5 w-[60px] rounded-full animate-delay-400" />
    </div>
  )
}

function SkeletonHeader() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 animate-in fade-in duration-500">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 animate-in fade-in duration-500 delay-100">
            <Skeleton className="h-8 w-[300px] animate-delay-200" />
            <Skeleton className="h-4 w-[200px] animate-delay-300" />
          </div>
          <div className="flex items-center space-x-3 animate-in fade-in duration-500 delay-200">
            <div className="text-right space-y-1">
              <Skeleton className="h-3 w-[80px] animate-delay-300" />
              <Skeleton className="h-4 w-[60px] animate-delay-400" />
            </div>
            <Skeleton className="h-12 w-12 rounded-full animate-delay-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonButton, 
  SkeletonRequestItem, 
  SkeletonActivityItem,
  SkeletonHeader 
}