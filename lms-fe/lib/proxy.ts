// Proxy helper for forwarding requests to external backend
import { getApiBaseUrl } from './api-config'

const BACKEND_URL = getApiBaseUrl()

export async function proxyRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${BACKEND_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    return response
  } catch (error) {
    console.error('Proxy error:', error)
    throw error
  }
}

export function getAuthHeader(request: Request): string | null {
  return request.headers.get('authorization')
}
