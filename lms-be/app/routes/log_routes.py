from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from datetime import datetime
from app.database import get_db
from app.schemas import AuditLogResponse
from app import crud, auth
from app.models import User

router = APIRouter()

@router.get("/", response_model=Union[dict, List[AuditLogResponse]])
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
    search: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    paginated: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """Get audit logs with pagination, search, and filtering (admin only).
    
    Set paginated=false to get a simple array response (backward compatible).
    """
    skip = (page - 1) * limit
    
    # Parse date if provided
    filter_date = None
    if date:
        try:
            filter_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        except:
            pass
    
    # Get audit logs with filters
    audit_logs, total = crud.get_audit_logs_paginated(
        db, 
        skip=skip, 
        limit=limit, 
        search=search,
        action=action,
        date=filter_date
    )
    
    # Return simple array if paginated=false (backward compatible)
    if not paginated:
        return [AuditLogResponse.from_orm(log) for log in audit_logs]
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit
    
    return {
        "items": [AuditLogResponse.from_orm(log) for log in audit_logs],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }
