from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import UserCreate, UserUpdate, UserResponse, PaginatedResponse
from app import crud, auth
from app.models import User

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get all employees with pagination and filtering (admin only)."""
    employees = crud.get_users(db, skip=skip, limit=limit, search=search, department=department)
    return employees

@router.get("/{employee_id}", response_model=UserResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get employee by ID (admin only)."""
    employee = crud.get_user(db, user_id=employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=UserResponse)
def create_employee(
    employee: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Create new employee (admin only)."""
    # Check if email already exists
    existing_user = crud.get_user_by_email(db, email=employee.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create employee
    db_employee = crud.create_user(db=db, user=employee)
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="employee_created",
        description=f"Created new employee: {db_employee.name}",
        details={"employee_id": db_employee.id, "employee_name": db_employee.name}
    )
    
    return db_employee

@router.put("/{employee_id}", response_model=UserResponse)
def update_employee(
    employee_id: int,
    employee_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Update employee information (admin only)."""
    db_employee = crud.update_user(db, user_id=employee_id, user_update=employee_update)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="employee_updated",
        description=f"Updated employee: {db_employee.name}",
        details={"employee_id": employee_id, "updates": employee_update.dict(exclude_unset=True)}
    )
    
    return db_employee

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Delete employee (admin only)."""
    # Get employee info before deletion for logging
    employee = crud.get_user(db, user_id=employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if employee.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    success = crud.delete_user(db, user_id=employee_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete employee")
    
    # Log the action
    crud.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="employee_deleted",
        description=f"Deleted employee: {employee.name}",
        details={"employee_id": employee_id, "employee_name": employee.name}
    )
    
    return {"message": "Employee deleted successfully"}
