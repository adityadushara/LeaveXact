import { useState, useCallback } from 'react'
import { leaveAPI } from '@/lib/api-external'

// Hook for optimistic updates on leave request status changes
export function useOptimisticLeaveUpdates() {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, any>>({})

  const updateRequestStatus = useCallback(async (
    requestId: string, 
    status: "approved" | "rejected", 
    comment?: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    // Optimistic update - immediately update the UI
    setOptimisticUpdates(prev => ({
      ...prev,
      [requestId]: { status, comment, isUpdating: true }
    }))

    try {
      const result = await leaveAPI.updateRequestStatus(requestId, status, comment)
      
      // Success - remove optimistic update
      setOptimisticUpdates(prev => {
        const { [requestId]: _, ...rest } = prev
        return rest
      })
      
      onSuccess?.()
      return result
    } catch (error) {
      // Error - remove optimistic update
      setOptimisticUpdates(prev => {
        const { [requestId]: _, ...rest } = prev
        return rest
      })
      
      onError?.(error as Error)
      throw error
    }
  }, [])

  const getOptimisticUpdate = useCallback((requestId: string) => {
    return optimisticUpdates[requestId]
  }, [optimisticUpdates])

  const clearOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates({})
  }, [])

  return {
    updateRequestStatus,
    getOptimisticUpdate,
    clearOptimisticUpdates,
    hasOptimisticUpdate: (requestId: string) => !!optimisticUpdates[requestId]
  }
}
