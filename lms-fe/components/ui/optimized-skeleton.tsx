import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Optimized skeleton components with better performance
export function OptimizedSkeletonCard() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export function OptimizedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OptimizedSkeletonCard key={i} />
      ))}
    </div>
  )
}

export function OptimizedSkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

// Lazy loading wrapper
export function LazyWrapper({ 
  children, 
  fallback = <OptimizedSkeletonCard />,
  delay = 100 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number 
}) {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return show ? <>{children}</> : <>{fallback}</>
}

// Virtualized list for large datasets
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 80,
  containerHeight = 400,
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
}) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )

  const visibleItems = items.slice(visibleStart, visibleEnd)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStart * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={visibleStart + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Memoized components for better performance
export const MemoizedSkeletonCard = React.memo(OptimizedSkeletonCard)
export const MemoizedSkeletonList = React.memo(OptimizedSkeletonList)
export const MemoizedSkeletonStats = React.memo(OptimizedSkeletonStats)
