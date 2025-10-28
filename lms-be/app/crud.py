from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models import User, LeaveRequest, AuditLog, LeaveStatus, LeaveType, LeaveCalendar
from app.schemas import UserCreate, UserUpdate, LeaveRequestCreate, LeaveRequestUpdate
from app.auth import get_password_hash
from datetime import datetime, timedelta
from app.utils import get_current_time
import json

# User CRUD operations
def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user."""
    # Generate employee ID
    last_employee = db.query(User).filter(User.role == "employee").order_by(User.id.desc()).first()
    if last_employee:
        last_id = int(last_employee.employee_id.replace("EMP", ""))
        new_id = f"EMP{str(last_id + 1).zfill(3)}"
    else:
        new_id = "EMP001"
    
    # Set gender-specific leave balances
    maternity_leave = 90 if user.gender == "female" else 0
    paternity_leave = 15 if user.gender == "male" else 0
    
    db_user = User(
        employee_id=new_id,
        name=user.name,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        department=user.department,
        gender=user.gender,
        maternity_leave=maternity_leave,
        paternity_leave=paternity_leave
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100, search: str = None, department: str = None) -> List[User]:
    """Get users with pagination and filtering."""
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.employee_id.ilike(f"%{search}%")
            )
        )
    
    if department:
        query = query.filter(User.department == department)
    
    return query.offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update user."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    """Delete user."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user or db_user.role == "admin":
        return False
    
    # Delete related leave requests and audit logs
    db.query(LeaveRequest).filter(LeaveRequest.employee_id == user_id).delete()
    db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
    
    db.delete(db_user)
    db.commit()
    return True

# Leave request CRUD operations
def create_leave_request(db: Session, leave_request: LeaveRequestCreate, user_id: int) -> LeaveRequest:
    """Create a new leave request."""
    # Calculate duration
    duration = (leave_request.end_date - leave_request.start_date).days + 1
    
    db_leave_request = LeaveRequest(
        employee_id=user_id,
        leave_type=leave_request.leave_type,
        start_date=leave_request.start_date,
        end_date=leave_request.end_date,
        duration=duration,
        reason=leave_request.reason
    )
    db.add(db_leave_request)
    db.commit()
    db.refresh(db_leave_request)
    
    # Load the employee relationship
    db_leave_request = db.query(LeaveRequest).options(joinedload(LeaveRequest.employee)).filter(LeaveRequest.id == db_leave_request.id).first()
    return db_leave_request

def get_leave_request(db: Session, request_id: int) -> Optional[LeaveRequest]:
    """Get leave request by ID."""
    return db.query(LeaveRequest).options(joinedload(LeaveRequest.employee)).filter(LeaveRequest.id == request_id).first()

def get_leave_requests(db: Session, skip: int = 0, limit: int = 100, user_id: int = None, status: str = None) -> List[LeaveRequest]:
    """Get leave requests with filtering."""
    query = db.query(LeaveRequest).options(joinedload(LeaveRequest.employee))
    
    if user_id:
        query = query.filter(LeaveRequest.employee_id == user_id)
    
    if status:
        query = query.filter(LeaveRequest.status == status)
    
    return query.offset(skip).limit(limit).all()

def update_leave_request(db: Session, request_id: int, leave_update: LeaveRequestUpdate) -> Optional[LeaveRequest]:
    """Update leave request."""
    db_leave_request = db.query(LeaveRequest).options(joinedload(LeaveRequest.employee)).filter(LeaveRequest.id == request_id).first()
    if not db_leave_request or db_leave_request.status != LeaveStatus.PENDING:
        return None
    
    update_data = leave_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_leave_request, field, value)
    
    # Recalculate duration if dates changed
    if leave_update.start_date or leave_update.end_date:
        duration = (db_leave_request.end_date - db_leave_request.start_date).days + 1
        db_leave_request.duration = duration
    
    db.commit()
    db.refresh(db_leave_request)
    return db_leave_request

def delete_leave_request(db: Session, request_id: int) -> bool:
    """Delete leave request."""
    db_leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not db_leave_request or db_leave_request.status != LeaveStatus.PENDING:
        return False
    
    db.delete(db_leave_request)
    db.commit()
    return True

def approve_leave_request(db: Session, request_id: int, admin_comment: str = None) -> Optional[LeaveRequest]:
    """Approve a leave request and update calendar."""
    db_leave_request = db.query(LeaveRequest).options(joinedload(LeaveRequest.employee)).filter(LeaveRequest.id == request_id).first()
    if not db_leave_request or db_leave_request.status != LeaveStatus.PENDING:
        return None
    
    # Check and deduct leave balance
    user = db.query(User).filter(User.id == db_leave_request.employee_id).first()
    leave_type = db_leave_request.leave_type.value
    available_balance = getattr(user, f"{leave_type}_leave", 0)
    
    if db_leave_request.duration > available_balance:
        return None
    
    # Deduct leave balance
    setattr(user, f"{leave_type}_leave", available_balance - db_leave_request.duration)
    
    # Update request status
    db_leave_request.status = LeaveStatus.APPROVED
    db_leave_request.admin_comment = admin_comment
    
    # Update leave calendar
    update_leave_calendar(db, db_leave_request)
    
    db.commit()
    db.refresh(db_leave_request)
    return db_leave_request

def reject_leave_request(db: Session, request_id: int, admin_comment: str = None) -> Optional[LeaveRequest]:
    """Reject a leave request."""
    db_leave_request = db.query(LeaveRequest).options(joinedload(LeaveRequest.employee)).filter(LeaveRequest.id == request_id).first()
    if not db_leave_request or db_leave_request.status != LeaveStatus.PENDING:
        return None
    
    # Update request status
    db_leave_request.status = LeaveStatus.REJECTED
    db_leave_request.admin_comment = admin_comment
    
    db.commit()
    db.refresh(db_leave_request)
    return db_leave_request

# Audit log operations
def create_audit_log(db: Session, user_id: int, action: str, description: str, details: dict = None) -> AuditLog:
    """Create an audit log entry."""
    db_audit_log = AuditLog(
        user_id=user_id,
        action=action,
        description=description,
        details=json.dumps(details) if details else None
    )
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100, user_id: int = None, action: str = None) -> List[AuditLog]:
    """Get audit logs with filtering."""
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_paginated(db: Session, skip: int = 0, limit: int = 100, search: str = None, action: str = None, date: datetime = None):
    """Get audit logs with pagination, search, and filtering."""
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    # Search filter (search in user name, email, or description)
    if search:
        query = query.join(User).filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                AuditLog.description.ilike(f"%{search}%")
            )
        )
    
    # Action filter
    if action and action.lower() != "all":
        query = query.filter(AuditLog.action == action)
    
    # Date filter (filter by date only, ignoring time)
    if date:
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(and_(AuditLog.timestamp >= start_of_day, AuditLog.timestamp <= end_of_day))
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    audit_logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return audit_logs, total

# Analytics functions
def get_system_summary(db: Session) -> dict:
    """Get system summary statistics."""
    total_employees = db.query(User).count()
    total_departments = db.query(User.department).distinct().count()
    total_requests = db.query(LeaveRequest).count()
    pending_requests = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).count()
    approved_requests = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.APPROVED).count()
    rejected_requests = db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.REJECTED).count()
    
    # Calculate average leave balance
    users = db.query(User).all()
    if users:
        total_balance = sum(
            user.annual_leave + user.sick_leave + user.personal_leave + 
            user.emergency_leave + user.maternity_leave for user in users
        )
        average_balance = total_balance / len(users)
    else:
        average_balance = 0
    
    return {
        "total_employees": total_employees,
        "total_departments": total_departments,
        "total_leave_requests": total_requests,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "average_leave_balance": round(average_balance, 2)
    }

def get_employee_analytics(db: Session, employee_id: int) -> dict:
    """Get analytics for a specific employee."""
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        return None
    
    requests = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee_id).all()
    total_requests = len(requests)
    approved_requests = len([r for r in requests if r.status == LeaveStatus.APPROVED])
    rejected_requests = len([r for r in requests if r.status == LeaveStatus.REJECTED])
    pending_requests = len([r for r in requests if r.status == LeaveStatus.PENDING])
    
    approval_rate = (approved_requests / total_requests * 100) if total_requests > 0 else 0
    
    return {
        "employee_id": employee_id,
        "total_requests": total_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "pending_requests": pending_requests,
        "approval_rate": round(approval_rate, 2),
        "leave_balance": {
            "annual": user.annual_leave,
            "sick": user.sick_leave,
            "personal": user.personal_leave,
            "emergency": user.emergency_leave,
            "maternity": user.maternity_leave,
            "paternity": user.paternity_leave
        }
    }

def get_department_analytics(db: Session) -> List[dict]:
    """Get analytics by department."""
    departments = db.query(User.department).distinct().all()
    analytics = []
    
    for dept in departments:
        dept_name = dept[0]
        users = db.query(User).filter(User.department == dept_name).all()
        employee_count = len(users)
        
        total_requests = db.query(LeaveRequest).join(User).filter(User.department == dept_name).count()
        
        if users:
            total_balance = sum(
                user.annual_leave + user.sick_leave + user.personal_leave + 
                user.emergency_leave + user.maternity_leave + user.paternity_leave for user in users
            )
            average_balance = total_balance / len(users)
        else:
            average_balance = 0
        
        analytics.append({
            "department": dept_name,
            "employee_count": employee_count,
            "total_requests": total_requests,
            "average_leave_balance": round(average_balance, 2)
        })
    
    return analytics

# Leave Calendar operations
def update_leave_calendar(db: Session, leave_request: LeaveRequest) -> None:
    """Update leave calendar when a leave request is approved."""
    # Remove existing calendar entries for this leave request
    db.query(LeaveCalendar).filter(LeaveCalendar.leave_request_id == leave_request.id).delete()
    
    # Add calendar entries for each day of the leave
    current_date = leave_request.start_date
    while current_date <= leave_request.end_date:
        calendar_entry = LeaveCalendar(
            employee_id=leave_request.employee_id,
            leave_request_id=leave_request.id,
            leave_date=current_date,
            leave_type=leave_request.leave_type
        )
        db.add(calendar_entry)
        current_date += timedelta(days=1)

def get_employee_calendar(db: Session, employee_id: int, start_date: datetime, end_date: datetime) -> List[LeaveCalendar]:
    """Get leave calendar entries for an employee within a date range."""
    return db.query(LeaveCalendar).filter(
        LeaveCalendar.employee_id == employee_id,
        LeaveCalendar.leave_date >= start_date,
        LeaveCalendar.leave_date <= end_date
    ).order_by(LeaveCalendar.leave_date).all()

def get_all_employees_calendar(db: Session, start_date: datetime, end_date: datetime) -> List[dict]:
    """Get leave calendar for all employees within a date range."""
    calendar_entries = db.query(LeaveCalendar).options(
        joinedload(LeaveCalendar.employee),
        joinedload(LeaveCalendar.leave_request)
    ).filter(
        LeaveCalendar.leave_date >= start_date,
        LeaveCalendar.leave_date <= end_date
    ).order_by(LeaveCalendar.leave_date, LeaveCalendar.employee_id).all()
    
    # Group by employee
    employees_calendar = {}
    for entry in calendar_entries:
        emp_id = entry.employee_id
        if emp_id not in employees_calendar:
            employees_calendar[emp_id] = {
                "employee": {
                    "id": entry.employee.id,
                    "name": entry.employee.name,
                    "employee_id": entry.employee.employee_id,
                    "department": entry.employee.department
                },
                "leaves": []
            }
        
        employees_calendar[emp_id]["leaves"].append({
            "date": entry.leave_date.strftime("%Y-%m-%d"),
            "leave_type": entry.leave_type.value,
            "leave_request_id": entry.leave_request_id
        })
    
    return list(employees_calendar.values())

def remove_leave_calendar_entries(db: Session, leave_request_id: int) -> None:
    """Remove calendar entries for a leave request (when rejected or deleted)."""
    db.query(LeaveCalendar).filter(LeaveCalendar.leave_request_id == leave_request_id).delete()

def expire_old_pending_leaves(db: Session) -> int:
    """Mark pending leave requests as expired if their end date has passed."""
    current_date = get_current_time().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Find all pending leave requests where end_date has passed
    expired_requests = db.query(LeaveRequest).filter(
        LeaveRequest.status == LeaveStatus.PENDING,
        LeaveRequest.end_date < current_date
    ).all()
    
    count = 0
    for request in expired_requests:
        request.status = LeaveStatus.EXPIRED
        request.admin_comment = "Automatically expired - end date has passed"
        count += 1
        
        # Log the expiration
        create_audit_log(
            db=db,
            user_id=request.employee_id,
            action="leave_expired",
            description=f"Leave request #{request.id} automatically expired",
            details={
                "leave_request_id": request.id,
                "leave_type": request.leave_type.value,
                "start_date": request.start_date.isoformat(),
                "end_date": request.end_date.isoformat(),
                "reason": "End date has passed without approval"
            }
        )
    
    if count > 0:
        db.commit()
    
    return count

def get_employees_on_leave_by_date(db: Session, target_date: datetime) -> List[dict]:
    """Get all employees on leave for a specific date."""
    # Query approved leave requests that include the target date
    leave_requests = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee)
    ).filter(
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date <= target_date,
        LeaveRequest.end_date >= target_date
    ).all()
    
    employees_on_leave = []
    for leave in leave_requests:
        employees_on_leave.append({
            "employee_id": leave.employee.id,
            "employee_name": leave.employee.name,
            "employee_code": leave.employee.employee_id,
            "department": leave.employee.department,
            "leave_type": leave.leave_type,
            "leave_request_id": leave.id,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "duration": leave.duration
        })
    
    return employees_on_leave

def get_employees_on_leave_by_date_range(db: Session, start_date: datetime, end_date: datetime) -> dict:
    """Get all employees on leave grouped by date for a date range."""
    # Query approved leave requests that overlap with the date range
    leave_requests = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee)
    ).filter(
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date
    ).all()
    
    # Group by date
    calendar_data = {}
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        calendar_data[date_str] = []
        
        for leave in leave_requests:
            # Check if this leave includes the current date
            if leave.start_date <= current_date <= leave.end_date:
                calendar_data[date_str].append({
                    "employee_id": leave.employee.id,
                    "employee_name": leave.employee.name,
                    "employee_code": leave.employee.employee_id,
                    "department": leave.employee.department,
                    "leave_type": leave.leave_type,
                    "leave_request_id": leave.id,
                    "start_date": leave.start_date,
                    "end_date": leave.end_date,
                    "duration": leave.duration
                })
        
        current_date += timedelta(days=1)
    
    return calendar_data

def get_upcoming_leaves(db: Session, days: int = 30) -> List[dict]:
    """Get all upcoming approved leaves starting from today."""
    today = get_current_time().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = today + timedelta(days=days)
    
    leave_requests = db.query(LeaveRequest).options(
        joinedload(LeaveRequest.employee)
    ).filter(
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date >= today,
        LeaveRequest.start_date <= end_date
    ).order_by(LeaveRequest.start_date).all()
    
    upcoming_leaves = []
    for leave in leave_requests:
        upcoming_leaves.append({
            "employee_id": leave.employee.id,
            "employee_name": leave.employee.name,
            "employee_code": leave.employee.employee_id,
            "department": leave.employee.department,
            "leave_type": leave.leave_type,
            "leave_request_id": leave.id,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "duration": leave.duration,
            "reason": leave.reason
        })
    
    return upcoming_leaves
