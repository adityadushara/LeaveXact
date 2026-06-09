from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas import LeaveRequestResponse, LeaveRequestApproval, UserResponse, AdminCalendarResponse, EmployeeOnLeave
from app import crud, auth
from app.models import User, LeaveRequest, LeaveStatus

router = APIRouter()

@router.get("/employees", response_model=List[UserResponse])
def get_all_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get all employees (admin only)."""
    employees = crud.get_users(db, skip=skip, limit=limit, search=search, department=department)
    return employees

@router.get("/leaves/", response_model=List[LeaveRequestResponse])
def get_all_leave_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    employee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get all leave requests (admin only)."""
    # Automatically expire old pending leaves
    crud.expire_old_pending_leaves(db)
    
    # If employee_id is provided, filter by that employee
    user_id = employee_id if employee_id else None
    leave_requests = crud.get_leave_requests(db, skip=skip, limit=limit, user_id=user_id, status=status)
    return leave_requests

@router.put("/leaves/{request_id}/approve", response_model=LeaveRequestResponse)
def approve_leave_request(
    request_id: int,
    approval: LeaveRequestApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Approve a leave request (admin only)."""
    leave_request = crud.get_leave_request(db, request_id=request_id)
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")
    
    # Approve the request
    db_leave_request = crud.approve_leave_request(
        db, 
        request_id=request_id, 
        admin_comment=approval.admin_comment
    )
    
    if not db_leave_request:
        raise HTTPException(
            status_code=400, 
            detail="Could not approve request. Check leave balance."
        )
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="leave_approved",
        description=f"Approved leave request from {leave_request.employee.name}",
        details={
            "leave_request_id": request_id,
            "employee_id": leave_request.employee_id,
            "leave_type": leave_request.leave_type.value,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "admin_comment": approval.admin_comment
        }
    )
    
    return db_leave_request

@router.put("/leaves/{request_id}/reject", response_model=LeaveRequestResponse)
def reject_leave_request(
    request_id: int,
    rejection: LeaveRequestApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Reject a leave request (admin only)."""
    leave_request = crud.get_leave_request(db, request_id=request_id)
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")
    
    # Reject the request
    db_leave_request = crud.reject_leave_request(
        db, 
        request_id=request_id, 
        admin_comment=rejection.admin_comment
    )
    
    if not db_leave_request:
        raise HTTPException(status_code=400, detail="Could not reject request")
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="leave_rejected",
        description=f"Rejected leave request from {leave_request.employee.name}",
        details={
            "leave_request_id": request_id,
            "employee_id": leave_request.employee_id,
            "leave_type": leave_request.leave_type.value,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "admin_comment": rejection.admin_comment
        }
    )
    
    return db_leave_request

@router.get("/calendar", response_model=List[AdminCalendarResponse])
def get_admin_calendar(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    date: Optional[str] = Query(None, description="Single date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """
    Get admin calendar showing employees on leave.
    
    Usage patterns:
    1. Single date: ?date=2025-10-27 (returns employees on leave for that specific date)
    2. Date range: ?start_date=2025-10-01&end_date=2025-10-31 (returns employees on leave for each day in range)
    
    Response format:
    [
      {
        "date": "2025-10-27",
        "employees_on_leave": [
          {
            "employee_name": "John Doe",
            "employee_code": "EMP001",
            "department": "Engineering",
            "leave_type": "annual",
            "duration": "Full Day",
            "start_date": "2025-10-27",
            "end_date": "2025-10-29",
            "leave_request_id": 123
          }
        ]
      }
    ]
    """
    try:
        if date:
            # Single date query
            target_date = datetime.strptime(date, "%Y-%m-%d")
            employees = crud.get_employees_on_leave_by_date(db, target_date)
            return [{
                "date": date,
                "employees_on_leave": employees,
                "total_employees_on_leave": len(employees)
            }]
        elif start_date and end_date:
            # Date range query
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            if start > end:
                raise HTTPException(status_code=400, detail="Start date must be before end date")
            
            # Limit to 90 days to prevent excessive queries
            if (end - start).days > 90:
                raise HTTPException(status_code=400, detail="Date range cannot exceed 90 days")
            
            calendar_data = crud.get_employees_on_leave_by_date_range(db, start, end)
            
            # Convert to response format
            result = []
            for date_str, employees in calendar_data.items():
                result.append({
                    "date": date_str,
                    "employees_on_leave": employees,
                    "total_employees_on_leave": len(employees)
                })
            
            return result
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either 'date' or both 'start_date' and 'end_date' must be provided"
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}")



@router.get("/calendar/holidays")
def get_holidays(
    days: int = Query(90, ge=1, le=365, description="Number of days to look ahead"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """
    Get public holidays for Gujarat, India.
    
    Usage patterns:
    1. Upcoming holidays: ?days=90 (returns holidays for next 90 days)
    2. Date range: ?start_date=2025-11-01&end_date=2025-12-31 (returns holidays in range)
    
    Response format:
    {
      "holidays": [
        {
          "date": "2025-11-05",
          "name": "Guru Nanak Jayanti",
          "type": "religious"
        }
      ],
      "total_count": 1
    }
    """
    from app.holidays import get_holidays as get_holidays_data, get_upcoming_holidays
    
    try:
        if start_date and end_date:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            
            if start > end:
                raise HTTPException(status_code=400, detail="Start date must be before end date")
            
            holidays = get_holidays_data(start, end)
        else:
            holidays = get_upcoming_holidays(days=days)
        
        return {
            "holidays": holidays,
            "total_count": len(holidays)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}")
