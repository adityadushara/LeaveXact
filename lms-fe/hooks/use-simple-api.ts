import { useState, useEffect, useCallback } from 'react'
import { leaveAPI, adminAPI, authAPI } from '@/lib/api-external'
import { getToken } from '@/lib/auth'

// Simple hooks that work reliably
export function useMyRequests() {
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const requests = await leaveAPI.getMyRequests()
      setData(Array.isArray(requests) ? requests : [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data: data || [], isLoading, error, refetch: fetchData }
}

export function useAllRequests() {
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const requests = await leaveAPI.getAllRequests()
      setData(Array.isArray(requests) ? requests : [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data: data || [], isLoading, error, refetch: fetchData }
}

export function useEmployees() {
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const employees = await adminAPI.getEmployees()
      setData(Array.isArray(employees) ? employees : [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data: data || [], isLoading, error, refetch: fetchData }
}

export function useUserData(userId?: string) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use /auth/me endpoint to get current user data
      // This works for both admin and employee roles
      const userData = await authAPI.me()
      
      setUser(userData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return { user, isLoading, error, refetch: fetchUser }
}

export function useAuditLogs() {
  const [data, setData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const logs = await adminAPI.getAuditLogs()
      setData(Array.isArray(logs) ? logs : [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data: data || [], isLoading, error, refetch: fetchData }
}
