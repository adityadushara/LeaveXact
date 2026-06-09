import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const includeHolidays = searchParams.get('include_holidays')
    
    // Build backend URL with query params
    const backendUrl = new URL(`${API_BASE_URL}/api/leave/calendar/${userId}`)
    if (startDate) backendUrl.searchParams.append('start_date', startDate)
    if (endDate) backendUrl.searchParams.append('end_date', endDate)
    if (includeHolidays) backendUrl.searchParams.append('include_holidays', includeHolidays)

    // Get auth token from request headers
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { detail: "Authorization header missing" },
        { status: 401 }
      )
    }

    // Forward request to backend
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Calendar API Error:", error)
    return NextResponse.json(
      { detail: error.message || "Failed to fetch calendar" },
      { status: 500 }
    )
  }
}
