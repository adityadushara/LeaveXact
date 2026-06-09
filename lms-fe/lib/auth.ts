import { jwtDecode } from "jwt-decode"
import { authAPI } from "./api-external"

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "employee"
  department: string
  employee_id: string
  employeeId?: string
  annual_leave?: number
  sick_leave?: number
  personal_leave?: number
  emergency_leave?: number
  maternity_leave?: number
  leaveBalance?: {
    annual: number
    sick: number
    personal: number
    emergency: number
    maternity: number
  }
}

export interface AuthToken {
  user_id: string
  email: string
  role: string
  exp: number
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("access_token", token)
  try {
    const oneDay = 24 * 60 * 60
    document.cookie = `token=${token}; max-age=${oneDay}; path=/; SameSite=Lax`
  } catch (error) {
    console.error('Failed to set token cookie:', error)
  }
}

export const removeToken = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("access_token")
  localStorage.removeItem("user")
  try {
    document.cookie = "token=; Max-Age=0; path=/; SameSite=Lax"
    document.cookie = "role=; Max-Age=0; path=/; SameSite=Lax"
  } catch (error) {
    console.error('Failed to remove cookies:', error)
  }
}

export const getUser = (): User | null => {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  if (!userStr || userStr === "undefined" || userStr === "null") return null
  try {
    return JSON.parse(userStr)
  } catch {
    try { localStorage.removeItem("user") } catch {}
    return null
  }
}

export const setUser = (user: User): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("user", JSON.stringify(user))
  try {
    const oneDay = 24 * 60 * 60
    document.cookie = `role=${user.role}; max-age=${oneDay}; path=/; SameSite=Lax`
  } catch (error) {
    console.error('Failed to set role cookie:', error)
  }
}

export const isTokenValid = (token: string): boolean => {
  try {
    const decoded: AuthToken = jwtDecode(token)
    const isValid = decoded.exp * 1000 > Date.now()
    
    // If token is expired, clean up
    if (!isValid) {
      console.log('[AUTH] Token expired, cleaning up')
      removeToken()
    }
    
    return isValid
  } catch {
    return false
  }
}

export const isTokenExpiringSoon = (token: string, minutesThreshold: number = 5): boolean => {
  try {
    const decoded: AuthToken = jwtDecode(token)
    const expiryTime = decoded.exp * 1000
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now
    const thresholdMs = minutesThreshold * 60 * 1000
    
    return timeUntilExpiry < thresholdMs && timeUntilExpiry > 0
  } catch {
    return false
  }
}

export const isAuthenticated = (): boolean => {
  const token = getToken()
  if (!token) return false
  
  const valid = isTokenValid(token)
  
  // If token is invalid/expired, redirect to login
  if (!valid && typeof window !== "undefined") {
    console.log('[AUTH] Invalid token detected, redirecting to login')
    removeToken()
    window.location.href = "/login"
    return false
  }
  
  return valid
}

export const isAdmin = (): boolean => {
  const user = getUser()
  return user?.role === "admin"
}

export const logout = async (): Promise<void> => {
  try {
    await authAPI.logout()
  } catch (error) {
    console.error('Logout API error:', error)
  } finally {
    removeToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }
}
