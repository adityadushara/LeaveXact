from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/holidays")
def get_holidays(
    days: int = Query(90, ge=1, le=365, description="Number of days to look ahead"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """
    Get public holidays for Gujarat, India.
    
    Usage patterns:
    1. Upcoming holidays: ?days=90 (returns holidays for next 90 days)
    2. Date range: ?start_date=2025-11-01&end_date=2025-12-31 (returns holidays in range)
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
