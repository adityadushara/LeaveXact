from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import LeaveRequestResponse, LeaveRequestApproval, UserResponse
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
