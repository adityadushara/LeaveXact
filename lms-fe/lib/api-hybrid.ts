// Hybrid API that falls back to original API if optimized fails
import { leaveAPI as originalLeaveAPI, adminAPI as originalAdminAPI, authAPI as originalAuthAPI } from './api'
import { leaveAPI as optimizedLeaveAPI, adminAPI as optimizedAdminAPI, authAPI as optimizedAuthAPI } from './api-optimized'

// Check if we're on client side and if localStorage is available
const isClientSide = typeof window !== 'undefined'
const hasLocalStorage = isClientSide && typeof localStorage !== 'undefined'

// Use optimized API on client side, original API on server side
export const leaveAPI = isClientSide ? optimizedLeaveAPI : originalLeaveAPI
export const adminAPI = isClientSide ? optimizedAdminAPI : originalAdminAPI  
export const authAPI = isClientSide ? optimizedAuthAPI : originalAuthAPI

// Export types
export type { Employee, LeaveRequest, LeaveRequestWithUser } from './api-optimized'
