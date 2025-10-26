from pydantic import BaseModel, validator, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, LeaveType, LeaveStatus, Gender

# Base schemas
class TokenData(BaseModel):
    user_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# User schemas
class UserBase(BaseModel):
    name: str
    email: str
    department: str
    role: UserRole = UserRole.EMPLOYEE
    gender: Optional[Gender] = None
    
    @validator('email')
    def validate_email(cls, v):
        import re
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    gender: Optional[Gender] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v is not None:
            import re
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
                raise ValueError('Invalid email format')
        return v

class UserResponse(UserBase):
    id: int
    employee_id: str
    annual_leave: int
    sick_leave: int
    personal_leave: int
    emergency_leave: int
    maternity_leave: int
    paternity_leave: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @validator('new_password')
    def validate_new_password_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class UpdateOwnProfileRequest(BaseModel):
    name: str
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Name cannot be empty')
        return v.strip()

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    password: str  # Require password for security
    
    @validator('new_email')
    def validate_email_format(cls, v):
        import re
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
            raise ValueError('Invalid email format')
        return v.lower().strip()

class UpdateOwnProfileFullRequest(BaseModel):
    """Schema for users to update their own profile data (name, email, department, gender)."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    gender: Optional[Gender] = None
    password: Optional[str] = None  # Required if changing email
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Name cannot be empty')
            return v.strip()
        return v
    
    @validator('email')
    def validate_email_format(cls, v):
        if v is not None:
            import re
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', v):
                raise ValueError('Invalid email format')
            return v.lower().strip()
        return v
    
    @validator('department')
    def validate_department(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Department cannot be empty')
            return v.strip()
        return v

# Leave request schemas
class LeaveRequestBase(BaseModel):
    leave_type: LeaveType
    start_date: datetime
    end_date: datetime
    reason: str
    
    @validator('start_date', 'end_date', pre=True)
    def parse_date(cls, v):
        if isinstance(v, str):
            from dateutil import parser
            return parser.parse(v)
        return v

class LeaveRequestCreate(LeaveRequestBase):
    pass

class LeaveRequestUpdate(BaseModel):
    leave_type: Optional[LeaveType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reason: Optional[str] = None

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_id: int
    duration: int
    status: LeaveStatus
    admin_comment: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    employee: UserResponse
    
    class Config:
        from_attributes = True

class LeaveRequestApproval(BaseModel):
    status: Optional[LeaveStatus] = None
    admin_comment: Optional[str] = None

# Audit log schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    description: str
    details: Optional[str] = None
    timestamp: datetime
    user: UserResponse
    
    class Config:
        from_attributes = True

# Analytics schemas
class SystemSummary(BaseModel):
    total_employees: int
    total_departments: int
    total_leave_requests: int
    pending_requests: int
    approved_requests: int
    rejected_requests: int
    average_leave_balance: float

class EmployeeAnalytics(BaseModel):
    employee_id: int
    total_requests: int
    approved_requests: int
    rejected_requests: int
    pending_requests: int
    approval_rate: float
    leave_balance: dict

class DepartmentAnalytics(BaseModel):
    department: str
    employee_count: int
    total_requests: int
    average_leave_balance: float

# Pagination schemas
class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    size: int
    pages: int

# Leave Calendar schemas
class LeaveCalendarEntry(BaseModel):
    date: str
    leave_type: LeaveType
    leave_request_id: int
    
    class Config:
        from_attributes = True

class EmployeeCalendarResponse(BaseModel):
    employee_id: int
    employee_name: str
    employee_code: str
    department: str
    leaves: List[LeaveCalendarEntry]

class CalendarDayResponse(BaseModel):
    date: str
    is_holiday: bool
    holiday_name: Optional[str] = None
    is_weekend: bool
    has_leave: bool
    leave_type: Optional[LeaveType] = None
    leave_request_id: Optional[int] = None
