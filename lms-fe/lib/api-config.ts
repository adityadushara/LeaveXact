// Centralized API configuration
// This ensures all API calls use the same base URL from environment variables

/**
 * Get the API base URL from environment variables
 * Uses BACKEND_URL from .env file
 * 
 * Note: For client-side access in Next.js, we need to expose this via next.config.mjs
 * or use NEXT_PUBLIC_ prefix. Since we're using API routes as a proxy, 
 * the client calls Next.js API routes, which then call the backend.
 */
export const getApiBaseUrl = (): string => {
  // Server-side: Read from process.env
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL || 'http://localhost:8000'
  }
  
  // Client-side: Use the injected value from publicRuntimeConfig or default
  // In Next.js 13+ with App Router, we need to use NEXT_PUBLIC_ prefix for client access
  // However, since most API calls go through Next.js API routes (proxy pattern),
  // the client doesn't need direct access to BACKEND_URL
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
}

// Export the base URL as a constant
export const API_BASE_URL = getApiBaseUrl()

// Helper to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${normalizedEndpoint}`
}
