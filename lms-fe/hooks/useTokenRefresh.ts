import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, isTokenValid, isTokenExpiringSoon, removeToken } from '@/lib/auth'

export function useTokenRefresh() {
  const router = useRouter()

  const checkToken = useCallback(() => {
    const token = getToken()
    
    if (!token) {
      console.log('[TOKEN CHECK] No token found')
      return
    }

    // Check if token is expired
    if (!isTokenValid(token)) {
      console.log('[TOKEN CHECK] Token expired, logging out')
      removeToken()
      router.push('/login')
      return
    }

    // Check if token is expiring soon (within 5 minutes)
    if (isTokenExpiringSoon(token, 5)) {
      console.log('[TOKEN CHECK] Token expiring soon, please re-login')
      // You could show a notification here
    }
  }, [router])

  useEffect(() => {
    // Check token on mount
    checkToken()

    // Check token every minute
    const interval = setInterval(checkToken, 60000)

    return () => clearInterval(interval)
  }, [checkToken])

  return { checkToken }
}
