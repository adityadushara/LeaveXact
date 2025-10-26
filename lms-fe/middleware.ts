import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /admin, /employee)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ["/", "/login", "/admin/login", "/employee/login"]

  // Check if the path is public
  const isPublicPath = publicPaths.includes(path)

  // Get the token and role from cookies
  const token = request.cookies.get("token")?.value || request.headers.get("authorization")?.replace("Bearer ", "")
  const role = request.cookies.get("role")?.value

  // If it's a public path and user has token, redirect to appropriate dashboard
  if (isPublicPath && token) {
    const target = role === "admin" ? "/admin/dashboard" : "/employee/dashboard"
    // Only redirect if not already on the target path
    if (path !== target) {
      return NextResponse.redirect(new URL(target, request.url))
    }
  }

  // If it's a protected path and no token, redirect to login
  if (!isPublicPath && !token) {
    // Only redirect if not already on login page
    if (path !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
