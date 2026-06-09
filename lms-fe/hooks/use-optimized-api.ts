import { useState, useEffect, useCallback, useRef } from 'react'
import { leaveAPI, adminAPI, authAPI, clearAPICache } from '@/lib/api-external'

// Generic hook for API calls with caching and error handling
export function useAPI<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    enabled?: boolean
    refetchInterval?: number
    onError?: (error: Error) => void
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { enabled = true, refetchInterval, onError } = options
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!enabled || typeof window === 'undefined') return
    
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      const result = await apiCall()
      
      if (mountedRef.current) {
        setData(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      if (mountedRef.current) {
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [apiCall, enabled, onError])

  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    mountedRef.current = true
    fetchData()

    // Set up interval refetch if specified
    if (refetchInterval && refetchInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(true)
      }, refetchInterval)
    }

    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, refetchInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    isRefreshing,
    refetch,
  }
}

// Specific hooks for common API calls
export function useMyRequests() {
  return useAPI(() => leaveAPI.getMyRequests(), [], {
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useAllRequests() {
  return useAPI(() => leaveAPI.getAllRequests(), [], {
    refetchInterval: 15000, // Refetch every 15 seconds
  })
}

export function useEmployees() {
  return useAPI(() => adminAPI.getEmployees(), [], {
    refetchInterval: 60000, // Refetch every minute
  })
}

export function useAuditLogs(limit?: number) {
  return useAPI(() => adminAPI.getAuditLogs(limit ? { limit } : undefined), [limit], {
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Hook for user data with automatic refresh
export function useUserData() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    if (typeof window === 'undefined') return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Use /auth/me endpoint to get current user data
      // This works for both admin and employee roles
      const userData = await authAPI.me()
      
      setUser(userData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUser()
    }
  }, [fetchUser])

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  }
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T, optimisticUpdate: Partial<T>) => T
) {
  const [data, setData] = useState<T>(initialData)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const optimisticUpdate = useCallback((optimisticData: Partial<T>) => {
    setData(prev => updateFn(prev, optimisticData))
    setIsOptimistic(true)
  }, [updateFn])

  const confirmUpdate = useCallback((confirmedData: T) => {
    setData(confirmedData)
    setIsOptimistic(false)
  }, [])

  const revertUpdate = useCallback(() => {
    setData(initialData)
    setIsOptimistic(false)
  }, [initialData])

  return {
    data,
    isOptimistic,
    optimisticUpdate,
    confirmUpdate,
    revertUpdate,
  }
}

// Hook for managing loading states across multiple operations
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates,
  }
}

// Utility hook for clearing all caches
export function useClearCache() {
  return useCallback(() => {
    clearAPICache()
  }, [])
}
