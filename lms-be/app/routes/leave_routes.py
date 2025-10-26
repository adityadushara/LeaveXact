from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.schemas import LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse, LeaveRequestApproval
from app import crud, auth
from app.models import User, LeaveRequest, LeaveStatus

router = APIRouter()

# Gujarat Public Holidays 2020-2030
GUJARAT_HOLIDAYS = [
    # 2020
    {"date": "2020-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2020-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2020-03-10", "name": "Holi", "type": "public"},
    {"date": "2020-04-02", "name": "Ram Navami", "type": "public"},
    {"date": "2020-04-06", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2020-04-10", "name": "Good Friday", "type": "public"},
    {"date": "2020-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2020-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2020-05-07", "name": "Buddha Purnima", "type": "public"},
    {"date": "2020-05-25", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2020-08-01", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2020-08-11", "name": "Janmashtami", "type": "public"},
    {"date": "2020-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2020-08-22", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2020-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2020-10-25", "name": "Dussehra", "type": "public"},
    {"date": "2020-11-14", "name": "Diwali", "type": "public"},
    {"date": "2020-11-15", "name": "Gujarati New Year", "type": "state"},
    {"date": "2020-11-30", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2020-12-25", "name": "Christmas", "type": "public"},
    
    # 2021
    {"date": "2021-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2021-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2021-03-11", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2021-03-29", "name": "Holi", "type": "public"},
    {"date": "2021-04-02", "name": "Good Friday", "type": "public"},
    {"date": "2021-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2021-04-21", "name": "Ram Navami", "type": "public"},
    {"date": "2021-04-25", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2021-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2021-05-13", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2021-05-26", "name": "Buddha Purnima", "type": "public"},
    {"date": "2021-07-21", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2021-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2021-08-30", "name": "Janmashtami", "type": "public"},
    {"date": "2021-09-10", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2021-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2021-10-15", "name": "Dussehra", "type": "public"},
    {"date": "2021-11-04", "name": "Diwali", "type": "public"},
    {"date": "2021-11-05", "name": "Gujarati New Year", "type": "state"},
    {"date": "2021-11-19", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2021-12-25", "name": "Christmas", "type": "public"},
    
    # 2022
    {"date": "2022-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2022-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2022-03-01", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2022-03-18", "name": "Holi", "type": "public"},
    {"date": "2022-04-10", "name": "Ram Navami", "type": "public"},
    {"date": "2022-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2022-04-14", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2022-04-15", "name": "Good Friday", "type": "public"},
    {"date": "2022-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2022-05-03", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2022-05-16", "name": "Buddha Purnima", "type": "public"},
    {"date": "2022-07-10", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2022-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2022-08-19", "name": "Janmashtami", "type": "public"},
    {"date": "2022-08-31", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2022-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2022-10-05", "name": "Dussehra", "type": "public"},
    {"date": "2022-10-24", "name": "Diwali", "type": "public"},
    {"date": "2022-10-25", "name": "Gujarati New Year", "type": "state"},
    {"date": "2022-11-08", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2022-12-25", "name": "Christmas", "type": "public"},
    
    # 2023
    {"date": "2023-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2023-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2023-02-18", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2023-03-08", "name": "Holi", "type": "public"},
    {"date": "2023-03-30", "name": "Ram Navami", "type": "public"},
    {"date": "2023-04-04", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2023-04-07", "name": "Good Friday", "type": "public"},
    {"date": "2023-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2023-04-22", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2023-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2023-05-05", "name": "Buddha Purnima", "type": "public"},
    {"date": "2023-06-29", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2023-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2023-09-07", "name": "Janmashtami", "type": "public"},
    {"date": "2023-09-19", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2023-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2023-10-24", "name": "Dussehra", "type": "public"},
    {"date": "2023-11-12", "name": "Diwali", "type": "public"},
    {"date": "2023-11-13", "name": "Gujarati New Year", "type": "state"},
    {"date": "2023-11-27", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2023-12-25", "name": "Christmas", "type": "public"},
    
    # 2024
    {"date": "2024-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2024-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2024-03-08", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2024-03-25", "name": "Holi", "type": "public"},
    {"date": "2024-03-29", "name": "Good Friday", "type": "public"},
    {"date": "2024-04-11", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2024-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2024-04-17", "name": "Ram Navami", "type": "public"},
    {"date": "2024-04-21", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2024-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2024-05-23", "name": "Buddha Purnima", "type": "public"},
    {"date": "2024-06-17", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2024-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2024-08-26", "name": "Janmashtami", "type": "public"},
    {"date": "2024-09-07", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2024-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2024-10-12", "name": "Dussehra", "type": "public"},
    {"date": "2024-10-31", "name": "Diwali", "type": "public"},
    {"date": "2024-11-01", "name": "Gujarati New Year", "type": "state"},
    {"date": "2024-11-15", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2024-12-25", "name": "Christmas", "type": "public"},
    
    # 2025
    {"date": "2025-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2025-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2025-02-26", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2025-03-14", "name": "Holi", "type": "public"},
    {"date": "2025-03-31", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2025-04-06", "name": "Ram Navami", "type": "public"},
    {"date": "2025-04-10", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2025-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2025-04-18", "name": "Good Friday", "type": "public"},
    {"date": "2025-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2025-05-12", "name": "Buddha Purnima", "type": "public"},
    {"date": "2025-06-07", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2025-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2025-08-16", "name": "Janmashtami", "type": "public"},
    {"date": "2025-08-27", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2025-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2025-10-02", "name": "Dussehra", "type": "public"},
    {"date": "2025-10-20", "name": "Diwali", "type": "public"},
    {"date": "2025-10-21", "name": "Gujarati New Year", "type": "state"},
    {"date": "2025-11-05", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2025-12-25", "name": "Christmas", "type": "public"},
    
    # 2026
    {"date": "2026-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2026-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2026-02-16", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2026-03-04", "name": "Holi", "type": "public"},
    {"date": "2026-03-21", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2026-03-27", "name": "Ram Navami", "type": "public"},
    {"date": "2026-03-30", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2026-04-03", "name": "Good Friday", "type": "public"},
    {"date": "2026-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2026-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2026-05-01", "name": "Buddha Purnima", "type": "public"},
    {"date": "2026-05-28", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2026-08-05", "name": "Janmashtami", "type": "public"},
    {"date": "2026-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2026-09-16", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2026-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2026-10-21", "name": "Dussehra", "type": "public"},
    {"date": "2026-11-08", "name": "Diwali", "type": "public"},
    {"date": "2026-11-09", "name": "Gujarati New Year", "type": "state"},
    {"date": "2026-11-24", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2026-12-25", "name": "Christmas", "type": "public"},
    
    # 2027
    {"date": "2027-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2027-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2027-03-05", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2027-03-10", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2027-03-22", "name": "Holi", "type": "public"},
    {"date": "2027-04-02", "name": "Good Friday", "type": "public"},
    {"date": "2027-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2027-04-15", "name": "Ram Navami", "type": "public"},
    {"date": "2027-04-19", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2027-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2027-05-17", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2027-05-20", "name": "Buddha Purnima", "type": "public"},
    {"date": "2027-07-26", "name": "Janmashtami", "type": "public"},
    {"date": "2027-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2027-09-05", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2027-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2027-10-11", "name": "Dussehra", "type": "public"},
    {"date": "2027-10-29", "name": "Diwali", "type": "public"},
    {"date": "2027-10-30", "name": "Gujarati New Year", "type": "state"},
    {"date": "2027-11-14", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2027-12-25", "name": "Christmas", "type": "public"},
    
    # 2028
    {"date": "2028-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2028-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2028-02-23", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2028-02-28", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2028-03-11", "name": "Holi", "type": "public"},
    {"date": "2028-04-03", "name": "Ram Navami", "type": "public"},
    {"date": "2028-04-07", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2028-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2028-04-14", "name": "Good Friday", "type": "public"},
    {"date": "2028-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2028-05-05", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2028-05-08", "name": "Buddha Purnima", "type": "public"},
    {"date": "2028-08-14", "name": "Janmashtami", "type": "public"},
    {"date": "2028-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2028-09-24", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2028-09-30", "name": "Dussehra", "type": "public"},
    {"date": "2028-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2028-10-17", "name": "Diwali", "type": "public"},
    {"date": "2028-10-18", "name": "Gujarati New Year", "type": "state"},
    {"date": "2028-11-03", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2028-12-25", "name": "Christmas", "type": "public"},
    
    # 2029
    {"date": "2029-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2029-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2029-02-13", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2029-02-17", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2029-03-01", "name": "Holi", "type": "public"},
    {"date": "2029-03-23", "name": "Ram Navami", "type": "public"},
    {"date": "2029-03-27", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2029-03-30", "name": "Good Friday", "type": "public"},
    {"date": "2029-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2029-04-25", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2029-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2029-05-27", "name": "Buddha Purnima", "type": "public"},
    {"date": "2029-08-03", "name": "Janmashtami", "type": "public"},
    {"date": "2029-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2029-09-13", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2029-09-19", "name": "Dussehra", "type": "public"},
    {"date": "2029-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2029-11-05", "name": "Diwali", "type": "public"},
    {"date": "2029-11-06", "name": "Gujarati New Year", "type": "state"},
    {"date": "2029-11-22", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2029-12-25", "name": "Christmas", "type": "public"},
    
    # 2030
    {"date": "2030-01-14", "name": "Makar Sankranti", "type": "public"},
    {"date": "2030-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2030-02-06", "name": "Eid ul-Fitr", "type": "public"},
    {"date": "2030-03-04", "name": "Maha Shivaratri", "type": "public"},
    {"date": "2030-03-13", "name": "Holi", "type": "public"},
    {"date": "2030-04-12", "name": "Ram Navami", "type": "public"},
    {"date": "2030-04-14", "name": "Ambedkar Jayanti", "type": "public"},
    {"date": "2030-04-14", "name": "Eid ul-Adha", "type": "public"},
    {"date": "2030-04-16", "name": "Mahavir Jayanti", "type": "public"},
    {"date": "2030-04-19", "name": "Good Friday", "type": "public"},
    {"date": "2030-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2030-05-16", "name": "Buddha Purnima", "type": "public"},
    {"date": "2030-07-24", "name": "Janmashtami", "type": "public"},
    {"date": "2030-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2030-09-02", "name": "Ganesh Chaturthi", "type": "public"},
    {"date": "2030-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2030-10-08", "name": "Dussehra", "type": "public"},
    {"date": "2030-10-26", "name": "Diwali", "type": "public"},
    {"date": "2030-10-27", "name": "Gujarati New Year", "type": "state"},
    {"date": "2030-11-12", "name": "Guru Nanak Jayanti", "type": "public"},
    {"date": "2030-12-25", "name": "Christmas", "type": "public"},
]

@router.post("/", response_model=LeaveRequestResponse)
def create_leave_request(
    leave_request: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Submit a new leave request."""
    # Check leave balance
    leave_type = leave_request.leave_type.value
    available_balance = getattr(current_user, f"{leave_type}_leave", 0)
    duration = (leave_request.end_date - leave_request.start_date).days + 1
    
    if duration > available_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient {leave_type} leave balance. Available: {available_balance} days, Requested: {duration} days"
        )
    
    # Create leave request
    db_leave_request = crud.create_leave_request(db=db, leave_request=leave_request, user_id=current_user.id)
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="leave_requested",
        description=f"Submitted {leave_request.leave_type} leave request",
        details={
            "leave_request_id": db_leave_request.id,
            "leave_type": leave_request.leave_type.value,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "duration": duration
        }
    )
    
    return db_leave_request

@router.get("/my-requests", response_model=List[LeaveRequestResponse])
def get_my_leave_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Get current user's leave requests."""
    # Automatically expire old pending leaves
    crud.expire_old_pending_leaves(db)
    
    leave_requests = crud.get_leave_requests(db, skip=skip, limit=limit, user_id=current_user.id, status=status)
    return leave_requests

@router.get("/", response_model=List[LeaveRequestResponse])
def get_leave_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Get leave requests."""
    # Automatically expire old pending leaves
    crud.expire_old_pending_leaves(db)
    
    # If user is admin, they can see all requests
    # If user is employee, they can only see their own requests
    user_id = None if current_user.role == "admin" else current_user.id
    
    leave_requests = crud.get_leave_requests(db, skip=skip, limit=limit, user_id=user_id, status=status)
    return leave_requests

@router.get("/{request_id}", response_model=LeaveRequestResponse)
def get_leave_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Get leave request by ID."""
    leave_request = crud.get_leave_request(db, request_id=request_id)
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Check if user can access this request
    if current_user.role != "admin" and leave_request.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return leave_request

@router.put("/{request_id}", response_model=LeaveRequestResponse)
def update_leave_request(
    request_id: int,
    leave_update: LeaveRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Update leave request (only pending requests)."""
    leave_request = crud.get_leave_request(db, request_id=request_id)
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Check if user can update this request
    if current_user.role != "admin" and leave_request.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if request is pending
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be updated")
    
    # Update request
    db_leave_request = crud.update_leave_request(db, request_id=request_id, leave_update=leave_update)
    if not db_leave_request:
        raise HTTPException(status_code=400, detail="Could not update leave request")
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="leave_updated",
        description=f"Updated leave request #{request_id}",
        details={"leave_request_id": request_id, "updates": leave_update.dict(exclude_unset=True)}
    )
    
    return db_leave_request

@router.delete("/{request_id}")
def delete_leave_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """Delete leave request (only pending requests)."""
    leave_request = crud.get_leave_request(db, request_id=request_id)
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Check if user can delete this request
    if current_user.role != "admin" and leave_request.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if request is pending
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be deleted")
    
    # Delete request
    success = crud.delete_leave_request(db, request_id=request_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete leave request")
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="leave_deleted",
        description=f"Deleted leave request #{request_id}",
        details={"leave_request_id": request_id}
    )
    
    return {"message": "Leave request deleted successfully"}

@router.get("/calendar/my-calendar")
def get_my_leave_calendar(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    include_holidays: bool = Query(True, description="Include public holidays"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Get leave calendar for the authenticated employee.
    Shows approved leaves from the calendar table.
    Employees can only see their own calendar.
    """
    user_id = current_user.id
    user = current_user
    
    # Parse date range
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get calendar entries for the user
    calendar_entries = crud.get_employee_calendar(db, user_id, start_dt, end_dt)
    
    # Get leave requests for statistics
    leave_requests = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == user_id,
        LeaveRequest.start_date <= end_dt,
        LeaveRequest.end_date >= start_dt
    ).all()
    
    # Organize calendar entries by date
    calendar_dates = {}
    for entry in calendar_entries:
        date_str = entry.leave_date.strftime("%Y-%m-%d")
        if date_str not in calendar_dates:
            calendar_dates[date_str] = []
        calendar_dates[date_str].append({
            "leave_type": entry.leave_type.value,
            "leave_request_id": entry.leave_request_id
        })
    
    # Organize leaves by status
    approved_leaves = []
    pending_leaves = []
    rejected_leaves = []
    
    for leave in leave_requests:
        leave_data = {
            "id": leave.id,
            "leave_type": leave.leave_type.value,
            "start_date": leave.start_date.strftime("%Y-%m-%d"),
            "end_date": leave.end_date.strftime("%Y-%m-%d"),
            "duration": leave.duration,
            "reason": leave.reason,
            "admin_comment": leave.admin_comment,
            "created_at": leave.created_at.isoformat()
        }
        
        if leave.status == LeaveStatus.APPROVED:
            approved_leaves.append(leave_data)
        elif leave.status == LeaveStatus.PENDING:
            pending_leaves.append(leave_data)
        elif leave.status == LeaveStatus.REJECTED:
            rejected_leaves.append(leave_data)
    
    # Filter holidays within date range
    holidays = []
    if include_holidays:
        for holiday in GUJARAT_HOLIDAYS:
            holiday_date = datetime.strptime(holiday["date"], "%Y-%m-%d")
            if start_dt <= holiday_date <= end_dt:
                holidays.append(holiday)
    
    # Calculate leave statistics
    total_approved_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.APPROVED)
    total_pending_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.PENDING)
    total_rejected_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.REJECTED)
    total_expired_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.EXPIRED)
    
    # Organize expired leaves
    expired_leaves = []
    for leave in leave_requests:
        if leave.status == LeaveStatus.EXPIRED:
            expired_leaves.append({
                "id": leave.id,
                "leave_type": leave.leave_type.value,
                "start_date": leave.start_date.strftime("%Y-%m-%d"),
                "end_date": leave.end_date.strftime("%Y-%m-%d"),
                "duration": leave.duration,
                "reason": leave.reason,
                "admin_comment": leave.admin_comment,
                "created_at": leave.created_at.isoformat()
            })
    
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "employee_id": user.employee_id,
            "department": user.department
        },
        "date_range": {
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date": end_dt.strftime("%Y-%m-%d")
        },
        "leave_balance": {
            "annual": user.annual_leave,
            "sick": user.sick_leave,
            "personal": user.personal_leave,
            "emergency": user.emergency_leave,
            "maternity": user.maternity_leave
        },
        "statistics": {
            "total_approved_days": total_approved_days,
            "total_pending_days": total_pending_days,
            "total_requests": len(leave_requests),
            "approved_count": len(approved_leaves),
            "pending_count": len(pending_leaves),
            "rejected_count": len(rejected_leaves)
        },
        "leave_durations": {
            "pending": {
                "total_days": total_pending_days,
                "leaves": pending_leaves
            },
            "approved": {
                "total_days": total_approved_days,
                "leaves": approved_leaves
            },
            "rejected": {
                "total_days": total_rejected_days,
                "leaves": rejected_leaves
            },
            "expired": {
                "total_days": total_expired_days,
                "leaves": expired_leaves
            },
            "total_applied": total_pending_days + total_approved_days + total_rejected_days + total_expired_days
        },
        "calendar": calendar_dates,
        "leaves": {
            "approved": approved_leaves,
            "pending": pending_leaves,
            "rejected": rejected_leaves,
            "expired": expired_leaves
        },
        "public_holidays": holidays
    }

@router.get("/calendar/{user_id}")
def get_leave_calendar(
    user_id: int,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    include_holidays: bool = Query(True, description="Include public holidays"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Get leave calendar for a specific user with public holidays (Admin only).
    Shows approved leaves from the calendar table.
    """
    # Check if user can access this calendar
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Verify user exists
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse date range
    try:
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        else:
            start_dt = datetime(datetime.now().year, 1, 1)
        
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        else:
            end_dt = datetime(datetime.now().year, 12, 31)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get calendar entries for the user
    calendar_entries = crud.get_employee_calendar(db, user_id, start_dt, end_dt)
    
    # Get leave requests for statistics
    leave_requests = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == user_id,
        LeaveRequest.start_date <= end_dt,
        LeaveRequest.end_date >= start_dt
    ).all()
    
    # Organize calendar entries by date
    calendar_dates = {}
    for entry in calendar_entries:
        date_str = entry.leave_date.strftime("%Y-%m-%d")
        if date_str not in calendar_dates:
            calendar_dates[date_str] = []
        calendar_dates[date_str].append({
            "leave_type": entry.leave_type.value,
            "leave_request_id": entry.leave_request_id
        })
    
    # Organize leaves by status
    approved_leaves = []
    pending_leaves = []
    rejected_leaves = []
    
    for leave in leave_requests:
        leave_data = {
            "id": leave.id,
            "leave_type": leave.leave_type.value,
            "start_date": leave.start_date.strftime("%Y-%m-%d"),
            "end_date": leave.end_date.strftime("%Y-%m-%d"),
            "duration": leave.duration,
            "reason": leave.reason,
            "admin_comment": leave.admin_comment,
            "created_at": leave.created_at.isoformat()
        }
        
        if leave.status == LeaveStatus.APPROVED:
            approved_leaves.append(leave_data)
        elif leave.status == LeaveStatus.PENDING:
            pending_leaves.append(leave_data)
        elif leave.status == LeaveStatus.REJECTED:
            rejected_leaves.append(leave_data)
    
    # Filter holidays within date range
    holidays = []
    if include_holidays:
        for holiday in GUJARAT_HOLIDAYS:
            holiday_date = datetime.strptime(holiday["date"], "%Y-%m-%d")
            if start_dt <= holiday_date <= end_dt:
                holidays.append(holiday)
    
    # Calculate leave statistics
    total_approved_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.APPROVED)
    total_pending_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.PENDING)
    total_rejected_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.REJECTED)
    total_expired_days = sum(leave.duration for leave in leave_requests if leave.status == LeaveStatus.EXPIRED)
    
    # Organize expired leaves
    expired_leaves = []
    for leave in leave_requests:
        if leave.status == LeaveStatus.EXPIRED:
            expired_leaves.append({
                "id": leave.id,
                "leave_type": leave.leave_type.value,
                "start_date": leave.start_date.strftime("%Y-%m-%d"),
                "end_date": leave.end_date.strftime("%Y-%m-%d"),
                "duration": leave.duration,
                "reason": leave.reason,
                "admin_comment": leave.admin_comment,
                "created_at": leave.created_at.isoformat()
            })
    
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "employee_id": user.employee_id,
            "department": user.department
        },
        "date_range": {
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date": end_dt.strftime("%Y-%m-%d")
        },
        "leave_balance": {
            "annual": user.annual_leave,
            "sick": user.sick_leave,
            "personal": user.personal_leave,
            "emergency": user.emergency_leave,
            "maternity": user.maternity_leave
        },
        "statistics": {
            "total_approved_days": total_approved_days,
            "total_pending_days": total_pending_days,
            "total_requests": len(leave_requests),
            "approved_count": len(approved_leaves),
            "pending_count": len(pending_leaves),
            "rejected_count": len(rejected_leaves)
        },
        "leave_durations": {
            "pending": {
                "total_days": total_pending_days,
                "leaves": pending_leaves
            },
            "approved": {
                "total_days": total_approved_days,
                "leaves": approved_leaves
            },
            "rejected": {
                "total_days": total_rejected_days,
                "leaves": rejected_leaves
            },
            "expired": {
                "total_days": total_expired_days,
                "leaves": expired_leaves
            },
            "total_applied": total_pending_days + total_approved_days + total_rejected_days + total_expired_days
        },
        "calendar": calendar_dates,
        "leaves": {
            "approved": approved_leaves,
            "pending": pending_leaves,
            "rejected": rejected_leaves,
            "expired": expired_leaves
        },
        "public_holidays": holidays
    }

@router.get("/calendar/all/employees")
def get_all_employees_calendar(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    include_holidays: bool = Query(True, description="Include public holidays"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Get leave calendar for all employees (Admin only).
    Shows approved leaves from the calendar table.
    """
    # Only admins can access this
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Parse date range
    try:
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        else:
            start_dt = datetime(datetime.now().year, 1, 1)
        
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        else:
            end_dt = datetime(datetime.now().year, 12, 31)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get calendar for all employees
    employees_calendar = crud.get_all_employees_calendar(db, start_dt, end_dt)
    
    # Get all leave requests for this period to calculate durations
    leave_requests = db.query(LeaveRequest).filter(
        LeaveRequest.start_date <= end_dt,
        LeaveRequest.end_date >= start_dt
    ).all()
    
    # Calculate durations by status
    pending_duration = sum(req.duration for req in leave_requests if req.status == LeaveStatus.PENDING)
    approved_duration = sum(req.duration for req in leave_requests if req.status == LeaveStatus.APPROVED)
    rejected_duration = sum(req.duration for req in leave_requests if req.status == LeaveStatus.REJECTED)
    expired_duration = sum(req.duration for req in leave_requests if req.status == LeaveStatus.EXPIRED)
    
    # Filter holidays within date range
    holidays = []
    if include_holidays:
        for holiday in GUJARAT_HOLIDAYS:
            holiday_date = datetime.strptime(holiday["date"], "%Y-%m-%d")
            if start_dt <= holiday_date <= end_dt:
                holidays.append(holiday)
    
    return {
        "date_range": {
            "start_date": start_dt.strftime("%Y-%m-%d"),
            "end_date": end_dt.strftime("%Y-%m-%d")
        },
        "employees": employees_calendar,
        "public_holidays": holidays,
        "leave_durations": {
            "pending": pending_duration,
            "approved": approved_duration,
            "rejected": rejected_duration,
            "expired": expired_duration,
            "total_applied": pending_duration + approved_duration + rejected_duration + expired_duration
        }
    }
