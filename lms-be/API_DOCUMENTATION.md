# LeaveXact API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Get your token by logging in via `/api/auth/login`.

---

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Employee Management](#employee-management)
3. [Leave Requests](#leave-requests)
4. [Admin Operations](#admin-operations)
5. [Analytics](#analytics)
6. [Audit Logs](#audit-logs)
7. [Holidays](#holidays)
8. [Response Codes](#response-codes)

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user (Admin only).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "department": "Engineering",
  "role": "employee",
  "gender": "male"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "employee_id": "EMP001",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "role": "employee",
  "gender": "male",
  "annual_leave": 20,
  "sick_leave": 10,
  "personal_leave": 5,
  "emergency_leave": 5,
  "maternity_leave": 0,
  "paternity_leave": 15,
  "created_at": "2025-10-29T10:00:00",
  "updated_at": null
}
```

---

### POST /api/auth/login
Login and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### GET /api/auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "employee_id": "EMP001",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "role": "employee",
  "gender": "male",
  "annual_leave": 20,
  "sick_leave": 10,
  "personal_leave": 5,
  "emergency_leave": 5,
  "maternity_leave": 0,
  "paternity_leave": 15,
  "created_at": "2025-10-29T10:00:00",
  "updated_at": null
}
```

---

### POST /api/auth/change-password
Change password for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "confirm_password": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

### PUT /api/auth/profile
Update current user's name.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "employee_id": "EMP001",
  "name": "John Smith",
  ...
}
```

---

### POST /api/auth/change-email
Change email for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "new_email": "newemail@example.com",
  "password": "Password123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email changed successfully",
  "new_email": "newemail@example.com"
}
```

---

### PATCH /api/auth/profile/full
Update full profile (name, email, department, gender).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "department": "Product",
  "gender": "male",
  "password": "Password123!"
}
```

**Note:** Password required only when changing email.

**Response:** `200 OK`
```json
{
  "id": 1,
  "employee_id": "EMP001",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "department": "Product",
  ...
}
```

---

### POST /api/auth/logout
Logout (token invalidation handled client-side).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

---

## Employee Management

### GET /api/employees/
Get all employees with pagination and filtering (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, default: 0): Number of records to skip
- `limit` (int, default: 100, max: 1000): Number of records to return
- `search` (string, optional): Search by name or email
- `department` (string, optional): Filter by department

**Example:** `/api/employees/?skip=0&limit=10&department=Engineering`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "employee_id": "EMP001",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "role": "employee",
    "annual_leave": 20,
    ...
  }
]
```

---

### GET /api/employees/{employee_id}
Get employee by ID (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": 1,
  "employee_id": "EMP001",
  "name": "John Doe",
  ...
}
```

---

### POST /api/employees/
Create new employee (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "Password123!",
  "department": "Marketing",
  "role": "employee",
  "gender": "female"
}
```

**Response:** `201 Created`

---

### PUT /api/employees/{employee_id}
Update employee information (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "department": "Sales",
  "email": "jane.doe@example.com"
}
```

**Response:** `200 OK`

---

### DELETE /api/employees/{employee_id}
Delete employee (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Employee deleted successfully"
}
```

---

## Leave Requests

### POST /api/leave/
Submit a new leave request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "leave_type": "annual",
  "start_date": "2025-11-01T00:00:00",
  "end_date": "2025-11-05T00:00:00",
  "reason": "Family vacation"
}
```

**Leave Types:**
- `annual` - Annual Leave
- `sick` - Sick Leave
- `personal` - Personal Leave
- `emergency` - Emergency Leave
- `maternity` - Maternity Leave (female only)
- `paternity` - Paternity Leave (male only)

**Response:** `201 Created`
```json
{
  "id": 1,
  "employee_id": 1,
  "leave_type": "annual",
  "start_date": "2025-11-01T00:00:00",
  "end_date": "2025-11-05T00:00:00",
  "duration": 5,
  "reason": "Family vacation",
  "status": "pending",
  "admin_comment": null,
  "created_at": "2025-10-29T10:00:00",
  "employee": {
    "id": 1,
    "name": "John Doe",
    ...
  }
}
```

---

### GET /api/leave/my-requests
Get current user's leave requests.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `status` (string, optional): Filter by status (pending, approved, rejected, expired)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "leave_type": "annual",
    "start_date": "2025-11-01T00:00:00",
    "end_date": "2025-11-05T00:00:00",
    "duration": 5,
    "status": "pending",
    ...
  }
]
```

---

### GET /api/leave/
Get leave requests (Admin sees all, Employee sees own).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `status` (string, optional)

**Response:** `200 OK`

---

### GET /api/leave/{request_id}
Get leave request by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

### PUT /api/leave/{request_id}
Update leave request (only pending requests).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "leave_type": "sick",
  "start_date": "2025-11-02T00:00:00",
  "end_date": "2025-11-04T00:00:00",
  "reason": "Medical appointment"
}
```

**Response:** `200 OK`

---

### DELETE /api/leave/{request_id}
Delete leave request (only pending requests).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Leave request deleted successfully"
}
```

---

### GET /api/leave/calendar/my-calendar
Get leave calendar for authenticated employee.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (string, required): Start date (YYYY-MM-DD)
- `end_date` (string, required): End date (YYYY-MM-DD)
- `include_holidays` (bool, default: true): Include public holidays

**Example:** `/api/leave/calendar/my-calendar?start_date=2025-11-01&end_date=2025-11-30`

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "employee_id": "EMP001",
    "department": "Engineering"
  },
  "date_range": {
    "start_date": "2025-11-01",
    "end_date": "2025-11-30"
  },
  "leave_balance": {
    "annual": 15,
    "sick": 10,
    "personal": 5,
    "emergency": 5,
    "maternity": 0
  },
  "statistics": {
    "total_approved_days": 5,
    "total_pending_days": 3,
    "total_requests": 2,
    "approved_count": 1,
    "pending_count": 1,
    "rejected_count": 0
  },
  "calendar": {
    "2025-11-05": [
      {
        "leave_type": "annual",
        "leave_request_id": 1
      }
    ]
  },
  "leaves": {
    "approved": [...],
    "pending": [...],
    "rejected": [...],
    "expired": [...]
  },
  "public_holidays": [
    {
      "date": "2025-11-05",
      "name": "Guru Nanak Jayanti",
      "type": "public"
    }
  ]
}
```

---

### GET /api/leave/calendar/{user_id}
Get leave calendar for specific user (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (string, optional)
- `end_date` (string, optional)
- `include_holidays` (bool, default: true)

**Response:** `200 OK` (Same format as my-calendar)

---

### GET /api/leave/calendar/all/employees
Get leave calendar for all employees (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (string, optional)
- `end_date` (string, optional)
- `include_holidays` (bool, default: true)

**Response:** `200 OK`
```json
{
  "date_range": {
    "start_date": "2025-11-01",
    "end_date": "2025-11-30",
    "total_days": 30
  },
  "days": [
    {
      "date": "2025-11-01",
      "day_of_week": "Saturday",
      "is_holiday": false,
      "holiday": null,
      "leaves": [
        {
          "user": {
            "id": 1,
            "name": "John Doe",
            "employee_id": "EMP001",
            "email": "john@example.com",
            "department": "Engineering",
            "role": "employee"
          },
          "leave": {
            "id": 1,
            "leave_type": "annual",
            "start_date": "2025-11-01",
            "end_date": "2025-11-05",
            "duration": 5,
            "reason": "Vacation",
            "status": "approved",
            "admin_comment": null
          }
        }
      ],
      "leave_count": 1
    }
  ],
  "statistics": {
    "total_leave_days": 15,
    "days_with_leaves": 10,
    "leave_durations": {
      "pending": 5,
      "approved": 20,
      "rejected": 2,
      "expired": 1,
      "total_applied": 28
    }
  }
}
```

---

## Admin Operations

### GET /api/admin/employees
Get all employees (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `search` (string, optional)
- `department` (string, optional)

**Response:** `200 OK`

---

### GET /api/admin/leaves/
Get all leave requests (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `status` (string, optional)
- `employee_id` (int, optional)

**Response:** `200 OK`

---

### PUT /api/admin/leaves/{request_id}/approve
Approve a leave request (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "admin_comment": "Approved for vacation"
}
```

**Response:** `200 OK`

---

### PUT /api/admin/leaves/{request_id}/reject
Reject a leave request (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "admin_comment": "Insufficient notice period"
}
```

**Response:** `200 OK`

---

### GET /api/admin/calendar
Get admin calendar showing employees on leave.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `date` (string, optional): Single date (YYYY-MM-DD)
- `start_date` (string, optional): Start date for range
- `end_date` (string, optional): End date for range

**Usage:**
1. Single date: `?date=2025-10-27`
2. Date range: `?start_date=2025-10-01&end_date=2025-10-31`

**Response:** `200 OK`
```json
[
  {
    "date": "2025-10-27",
    "employees_on_leave": [
      {
        "employee_id": 1,
        "employee_name": "John Doe",
        "employee_code": "EMP001",
        "department": "Engineering",
        "leave_type": "annual",
        "leave_request_id": 123,
        "start_date": "2025-10-27T00:00:00",
        "end_date": "2025-10-29T00:00:00",
        "duration": 3
      }
    ],
    "total_employees_on_leave": 1
  }
]
```

---

### GET /api/admin/calendar/holidays
Get public holidays for Gujarat (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days` (int, default: 90, max: 365): Days to look ahead
- `start_date` (string, optional): Start date (YYYY-MM-DD)
- `end_date` (string, optional): End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "holidays": [
    {
      "date": "2025-11-05",
      "name": "Guru Nanak Jayanti",
      "type": "public"
    }
  ],
  "total_count": 1
}
```

---

## Analytics

### GET /api/analytics/summary
Get system summary statistics (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "total_employees": 50,
  "total_departments": 5,
  "total_leave_requests": 200,
  "pending_requests": 15,
  "approved_requests": 150,
  "rejected_requests": 35,
  "average_leave_balance": 12.5
}
```

---

### GET /api/analytics/employee/{employee_id}
Get analytics for specific employee (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "employee_id": 1,
  "total_requests": 10,
  "approved_requests": 8,
  "rejected_requests": 2,
  "pending_requests": 0,
  "approval_rate": 80.0,
  "leave_balance": {
    "annual": 15,
    "sick": 10,
    "personal": 5,
    "emergency": 5,
    "maternity": 0,
    "paternity": 15
  }
}
```

---

### GET /api/analytics/departments
Get analytics by department (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "department": "Engineering",
    "employee_count": 20,
    "total_requests": 100,
    "average_leave_balance": 13.5
  }
]
```

---

### POST /api/analytics/expire-old-leaves
Manually trigger expiration of old pending leaves (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Successfully expired 5 old pending leave request(s)",
  "expired_count": 5
}
```

---

## Audit Logs

### GET /api/logs/
Get audit logs with pagination and filtering (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 5, max: 100)
- `search` (string, optional): Search in description
- `action` (string, optional): Filter by action type
- `date` (string, optional): Filter by date (ISO format)
- `paginated` (bool, default: true): Return paginated response

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "action": "leave_requested",
      "description": "Submitted annual leave request",
      "details": "{\"leave_request_id\": 1, \"leave_type\": \"annual\"}",
      "timestamp": "2025-10-29T10:00:00",
      "user": {
        "id": 1,
        "name": "John Doe",
        ...
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 5,
  "total_pages": 20
}
```

**Non-paginated Response** (when `paginated=false`):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "action": "leave_requested",
    ...
  }
]
```

---

## Holidays

### GET /api/holidays
Get public holidays for Gujarat, India.

**Query Parameters:**
- `days` (int, default: 90, max: 365): Days to look ahead
- `start_date` (string, optional): Start date (YYYY-MM-DD)
- `end_date` (string, optional): End date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "holidays": [
    {
      "date": "2025-11-05",
      "name": "Guru Nanak Jayanti",
      "type": "public"
    },
    {
      "date": "2025-12-25",
      "name": "Christmas",
      "type": "public"
    }
  ],
  "total_count": 2
}
```

---

## Response Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Validation Error (422):**
```json
{
  "detail": "Validation error",
  "errors": [
    {
      "loc": ["body", "email"],
      "msg": "Invalid email format",
      "type": "value_error"
    }
  ]
}
```

---

## Common Actions in Audit Logs

- `login` - User logged in
- `logout` - User logged out
- `password_changed` - User changed password
- `email_changed` - User changed email
- `profile_updated` - User updated profile
- `profile_updated_full` - User updated full profile
- `leave_requested` - Leave request submitted
- `leave_updated` - Leave request updated
- `leave_deleted` - Leave request deleted
- `leave_approved` - Leave request approved by admin
- `leave_rejected` - Leave request rejected by admin
- `leaves_expired` - Old pending leaves expired
- `employee_created` - New employee created
- `employee_updated` - Employee information updated
- `employee_deleted` - Employee deleted

---

## Notes

1. **Date Format**: All dates should be in ISO 8601 format (`YYYY-MM-DDTHH:MM:SS` or `YYYY-MM-DD`)
2. **Token Expiration**: JWT tokens expire after 24 hours (configurable)
3. **Leave Balance**: Automatically deducted on approval, not on request submission
4. **Old Leaves**: Pending leaves automatically expire after start date passes
5. **Gender-based Leaves**: Maternity leave (90 days) for females, Paternity leave (15 days) for males
6. **Holidays**: Gujarat public holidays from 2020-2030 are pre-loaded
7. **Pagination**: Most list endpoints support pagination with `skip` and `limit` parameters
8. **Role-based Access**: Admin users have access to all endpoints, employees have limited access

---

## Interactive Documentation

Visit these URLs when the server is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Support

For issues or questions:
1. Check the interactive API documentation at `/docs`
2. Review application logs
3. Contact system administrator

**Version:** 1.0.0  
**Last Updated:** October 2025
