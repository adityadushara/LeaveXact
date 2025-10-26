# LeaveXact API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
All protected endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Employee Management](#employee-management)
3. [Leave Request Management](#leave-request-management)
4. [Admin Operations](#admin-operations)
5. [Analytics & Reporting](#analytics--reporting)
6. [Audit Logs](#audit-logs)
7. [Data Models](#data-models)
8. [Error Responses](#error-responses)

---

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`

Register a new user (admin only).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
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
  "created_at": "2025-10-21T10:00:00Z"
}
```

---

### 2. Login
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
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

### 3. Get Current User
**GET** `/api/auth/me`

Get authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

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
  "created_at": "2025-10-21T10:00:00Z"
}
```

---

### 4. Change Password
**POST** `/api/auth/change-password`

Change current user's password.

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

### 5. Update Profile
**PUT** `/api/auth/profile`

Update current user's name.

**Request Body:**
```json
{
  "name": "John Updated Doe"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "John Updated Doe",
  ...
}
```

---

### 6. Update Full Profile
**PATCH** `/api/auth/profile/full`

Update current user's profile (name, email, department, gender).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "newemail@example.com",
  "department": "Marketing",
  "gender": "male",
  "password": "currentpassword"
}
```

**Note:** Password required when changing email.

**Response:** `200 OK`

---

### 7. Change Email
**POST** `/api/auth/change-email`

Change current user's email address.

**Request Body:**
```json
{
  "new_email": "newemail@example.com",
  "password": "currentpassword"
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

### 8. Logout
**POST** `/api/auth/logout`

Logout user (token invalidation handled client-side).

**Response:** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

---

## Employee Management

### 1. Get All Employees
**GET** `/api/employees/`

Get list of all employees (admin only).

**Query Parameters:**
- `skip` (int, default: 0) - Pagination offset
- `limit` (int, default: 100) - Items per page
- `search` (string, optional) - Search by name or email
- `department` (string, optional) - Filter by department

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
    ...
  }
]
```

---

### 2. Get Employee by ID
**GET** `/api/employees/{employee_id}`

Get specific employee details (admin only).

**Response:** `200 OK`

---

### 3. Create Employee
**POST** `/api/employees/`

Create new employee (admin only).

**Request Body:** Same as register endpoint

**Response:** `201 Created`

---

### 4. Update Employee
**PUT** `/api/employees/{employee_id}`

Update employee information (admin only).

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "department": "New Department",
  "gender": "female"
}
```

**Response:** `200 OK`

---

### 5. Delete Employee
**DELETE** `/api/employees/{employee_id}`

Delete employee (admin only). Cannot delete admin users.

**Response:** `200 OK`
```json
{
  "message": "Employee deleted successfully"
}
```

---

## Leave Request Management

### 1. Create Leave Request
**POST** `/api/leave/`

Submit a new leave request.

**Request Body:**
```json
{
  "leave_type": "annual",
  "start_date": "2025-11-01T00:00:00Z",
  "end_date": "2025-11-05T00:00:00Z",
  "reason": "Family vacation"
}
```

**Leave Types:**
- `annual` - Annual leave
- `sick` - Sick leave
- `personal` - Personal leave
- `emergency` - Emergency leave
- `maternity` - Maternity leave (female only)
- `paternity` - Paternity leave (male only)

**Response:** `201 Created`
```json
{
  "id": 1,
  "employee_id": 1,
  "leave_type": "annual",
  "start_date": "2025-11-01T00:00:00Z",
  "end_date": "2025-11-05T00:00:00Z",
  "duration": 5,
  "reason": "Family vacation",
  "status": "pending",
  "admin_comment": null,
  "created_at": "2025-10-21T10:00:00Z",
  "employee": {
    "id": 1,
    "name": "John Doe",
    ...
  }
}
```

---

### 2. Get My Leave Requests
**GET** `/api/leave/my-requests`

Get current user's leave requests.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `status` (string, optional) - Filter by status: pending, approved, rejected, expired

**Response:** `200 OK` - Array of leave requests

---

### 3. Get All Leave Requests
**GET** `/api/leave/`

Get leave requests (all for admin, own for employees).

**Query Parameters:** Same as above

**Response:** `200 OK`

---

### 4. Get Leave Request by ID
**GET** `/api/leave/{request_id}`

Get specific leave request details.

**Response:** `200 OK`

---

### 5. Update Leave Request
**PUT** `/api/leave/{request_id}`

Update pending leave request.

**Request Body:**
```json
{
  "leave_type": "sick",
  "start_date": "2025-11-02T00:00:00Z",
  "end_date": "2025-11-04T00:00:00Z",
  "reason": "Updated reason"
}
```

**Note:** Only pending requests can be updated.

**Response:** `200 OK`

---

### 6. Delete Leave Request
**DELETE** `/api/leave/{request_id}`

Delete pending leave request.

**Note:** Only pending requests can be deleted.

**Response:** `200 OK`
```json
{
  "message": "Leave request deleted successfully"
}
```

---

### 7. Get My Leave Calendar
**GET** `/api/leave/calendar/my-calendar`

Get leave calendar for authenticated user.

**Query Parameters:**
- `start_date` (string, required) - Format: YYYY-MM-DD
- `end_date` (string, required) - Format: YYYY-MM-DD
- `include_holidays` (boolean, default: true)

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
    "annual": 20,
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
    "2025-11-01": [
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

### 8. Get User Leave Calendar (Admin)
**GET** `/api/leave/calendar/{user_id}`

Get leave calendar for specific user (admin only).

**Query Parameters:** Same as my-calendar

**Response:** `200 OK` - Similar structure to my-calendar

---

## Admin Operations

### 1. Get All Employees
**GET** `/api/admin/employees`

Get all employees with filtering (admin only).

**Query Parameters:**
- `skip`, `limit`, `search`, `department`

**Response:** `200 OK`

---

### 2. Get All Leave Requests
**GET** `/api/admin/leaves/`

Get all leave requests (admin only).

**Query Parameters:**
- `skip` (int)
- `limit` (int)
- `status` (string)
- `employee_id` (int, optional) - Filter by specific employee

**Response:** `200 OK`

---

### 3. Approve Leave Request
**PUT** `/api/admin/leaves/{request_id}/approve`

Approve a pending leave request (admin only).

**Request Body:**
```json
{
  "admin_comment": "Approved for vacation"
}
```

**Response:** `200 OK`

**Note:** Automatically deducts leave balance and creates calendar entries.

---

### 4. Reject Leave Request
**PUT** `/api/admin/leaves/{request_id}/reject`

Reject a pending leave request (admin only).

**Request Body:**
```json
{
  "admin_comment": "Insufficient coverage during this period"
}
```

**Response:** `200 OK`

---

## Analytics & Reporting

### 1. Get System Summary
**GET** `/api/analytics/summary`

Get overall system statistics (admin only).

**Response:** `200 OK`
```json
{
  "total_employees": 50,
  "total_departments": 5,
  "total_leave_requests": 200,
  "pending_requests": 15,
  "approved_requests": 150,
  "rejected_requests": 35,
  "average_leave_balance": 18.5
}
```

---

### 2. Get Employee Analytics
**GET** `/api/analytics/employee/{employee_id}`

Get analytics for specific employee (admin only).

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
    "annual": 12,
    "sick": 8,
    "personal": 3,
    "emergency": 5,
    "maternity": 0,
    "paternity": 15
  }
}
```

---

### 3. Get Department Analytics
**GET** `/api/analytics/departments`

Get analytics by department (admin only).

**Response:** `200 OK`
```json
[
  {
    "department": "Engineering",
    "employee_count": 20,
    "total_requests": 80,
    "average_leave_balance": 17.5
  }
]
```

---

### 4. Expire Old Leaves
**POST** `/api/analytics/expire-old-leaves`

Manually trigger expiration of old pending requests (admin only).

**Response:** `200 OK`
```json
{
  "message": "Successfully expired 5 old pending leave request(s)",
  "expired_count": 5
}
```

---

## Audit Logs

### 1. Get Audit Logs
**GET** `/api/logs/`

Get audit logs with filtering.

**Query Parameters:**
- `skip` (int, default: 0)
- `limit` (int, default: 100)
- `user_id` (int, optional) - Filter by user
- `action` (string, optional) - Filter by action type

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "action": "leave_requested",
    "description": "Submitted annual leave request",
    "details": "{\"leave_request_id\": 1, \"duration\": 5}",
    "timestamp": "2025-10-21T10:00:00Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      ...
    }
  }
]
```

**Common Action Types:**
- `login`, `logout`
- `leave_requested`, `leave_updated`, `leave_deleted`
- `leave_approved`, `leave_rejected`
- `employee_created`, `employee_updated`, `employee_deleted`
- `password_changed`, `email_changed`, `profile_updated`

---

## Data Models

### User Model
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
  "created_at": "2025-10-21T10:00:00Z",
  "updated_at": "2025-10-21T10:00:00Z"
}
```

### Leave Request Model
```json
{
  "id": 1,
  "employee_id": 1,
  "leave_type": "annual",
  "start_date": "2025-11-01T00:00:00Z",
  "end_date": "2025-11-05T00:00:00Z",
  "duration": 5,
  "reason": "Family vacation",
  "status": "pending",
  "admin_comment": null,
  "created_at": "2025-10-21T10:00:00Z",
  "updated_at": null
}
```

### Enums

**UserRole:**
- `admin`
- `employee`

**Gender:**
- `male`
- `female`
- `other`

**LeaveType:**
- `annual`
- `sick`
- `personal`
- `emergency`
- `maternity`
- `paternity`

**LeaveStatus:**
- `pending`
- `approved`
- `rejected`
- `expired`

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Insufficient annual leave balance. Available: 5 days, Requested: 10 days"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Employee not found"
}
```

### 422 Validation Error
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

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting
Currently no rate limiting is implemented. Consider implementing rate limiting in production.

## Pagination
Most list endpoints support pagination via `skip` and `limit` parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100, max: 1000)

## Date Formats
- ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- Date only: `YYYY-MM-DD`

## Public Holidays
The system includes Gujarat public holidays from 2020-2030, including:
- National holidays (Republic Day, Independence Day, Gandhi Jayanti)
- State holidays (Gujarat Day, Gujarati New Year)
- Religious holidays (Diwali, Holi, Eid, Christmas, etc.)

---

## Interactive Documentation
Access interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

**Version:** 1.0.0  
**Last Updated:** October 2025
