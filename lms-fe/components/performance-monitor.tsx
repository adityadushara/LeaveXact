"use client"

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  apiResponseTime: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    apiResponseTime: 0
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Measure page load time
    const loadTime = performance.now()
    setMetrics(prev => ({ ...prev, loadTime }))

    // Measure memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory as {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
      setMetrics(prev => ({ 
        ...prev, 
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) 
      }))
    }

    // Monitor API response times
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const start = performance.now()
      const response = await originalFetch(...args)
      const end = performance.now()
      
      setMetrics(prev => ({ 
        ...prev, 
        apiResponseTime: Math.round(end - start) 
      }))
      
      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor</div>
      <div>Load Time: {metrics.loadTime.toFixed(2)}ms</div>
      <div>Memory: {metrics.memoryUsage}MB</div>
      <div>API Response: {metrics.apiResponseTime}ms</div>
      <div className="mt-2 text-gray-400">Press Ctrl+Shift+P to toggle</div>
    </div>
  )
}

// Hook for measuring component render performance
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`)
    }
  })
}

// Hook for measuring API call performance
export function useAPIPerformance() {
  const [responseTimes, setResponseTimes] = useState<number[]>([])

  async function measureAPI<T>(apiCall: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await apiCall()
      const end = performance.now()
      const responseTime = end - start
      
      setResponseTimes(prev => [...prev.slice(-9), responseTime]) // Keep last 10 measurements
      return result
    } catch (error) {
      const end = performance.now()
      const responseTime = end - start
      setResponseTimes(prev => [...prev.slice(-9), responseTime])
      throw error
    }
  }

  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0

  return {
    measureAPI,
    averageResponseTime,
    responseTimes,
    clearMetrics: () => setResponseTimes([])
  }
}
