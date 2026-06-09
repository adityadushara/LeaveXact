from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import SystemSummary, EmployeeAnalytics, DepartmentAnalytics
from app import crud, auth
from app.models import User

router = APIRouter()

@router.get("/summary", response_model=SystemSummary)
def get_system_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get system summary statistics (admin only)."""
    summary = crud.get_system_summary(db)
    return summary

@router.get("/employee/{employee_id}", response_model=EmployeeAnalytics)
def get_employee_analytics(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get analytics for a specific employee (admin only)."""
    analytics = crud.get_employee_analytics(db, employee_id=employee_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Employee not found")
    return analytics

@router.get("/departments", response_model=List[DepartmentAnalytics])
def get_department_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get analytics by department (admin only)."""
    analytics = crud.get_department_analytics(db)
    return analytics

@router.post("/expire-old-leaves")
def expire_old_pending_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Manually trigger expiration of old pending leave requests (admin only)."""
    count = crud.expire_old_pending_leaves(db)
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="leaves_expired",
        description=f"Manually triggered leave expiration - {count} requests expired",
        details={"expired_count": count}
    )
    
    return {
        "message": f"Successfully expired {count} old pending leave request(s)",
        "expired_count": count
    }
