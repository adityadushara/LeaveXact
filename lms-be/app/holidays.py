"""
Public holidays data for Gujarat, India (2020-2030)
"""
from datetime import datetime, timedelta
from typing import List, Dict
from app.utils import get_current_time

# Gujarat public holidays
HOLIDAYS = [
    # 2025
    {"date": "2025-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2025-03-14", "name": "Holi", "type": "religious"},
    {"date": "2025-03-31", "name": "Eid ul-Fitr", "type": "religious"},
    {"date": "2025-04-10", "name": "Mahavir Jayanti", "type": "religious"},
    {"date": "2025-04-14", "name": "Ambedkar Jayanti", "type": "national"},
    {"date": "2025-04-18", "name": "Good Friday", "type": "religious"},
    {"date": "2025-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2025-05-12", "name": "Buddha Purnima", "type": "religious"},
    {"date": "2025-06-07", "name": "Eid ul-Adha", "type": "religious"},
    {"date": "2025-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2025-08-16", "name": "Parsi New Year", "type": "religious"},
    {"date": "2025-08-27", "name": "Janmashtami", "type": "religious"},
    {"date": "2025-09-06", "name": "Ganesh Chaturthi", "type": "religious"},
    {"date": "2025-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2025-10-02", "name": "Dussehra", "type": "religious"},
    {"date": "2025-10-21", "name": "Diwali", "type": "religious"},
    {"date": "2025-10-22", "name": "Gujarati New Year", "type": "state"},
    {"date": "2025-11-05", "name": "Guru Nanak Jayanti", "type": "religious"},
    {"date": "2025-12-25", "name": "Christmas", "type": "religious"},
    
    # 2026
    {"date": "2026-01-26", "name": "Republic Day", "type": "national"},
    {"date": "2026-03-03", "name": "Holi", "type": "religious"},
    {"date": "2026-03-21", "name": "Eid ul-Fitr", "type": "religious"},
    {"date": "2026-03-30", "name": "Mahavir Jayanti", "type": "religious"},
    {"date": "2026-04-03", "name": "Good Friday", "type": "religious"},
    {"date": "2026-04-14", "name": "Ambedkar Jayanti", "type": "national"},
    {"date": "2026-05-01", "name": "Gujarat Day", "type": "state"},
    {"date": "2026-05-31", "name": "Buddha Purnima", "type": "religious"},
    {"date": "2026-05-28", "name": "Eid ul-Adha", "type": "religious"},
    {"date": "2026-08-05", "name": "Parsi New Year", "type": "religious"},
    {"date": "2026-08-15", "name": "Independence Day", "type": "national"},
    {"date": "2026-08-15", "name": "Janmashtami", "type": "religious"},
    {"date": "2026-08-25", "name": "Ganesh Chaturthi", "type": "religious"},
    {"date": "2026-09-21", "name": "Dussehra", "type": "religious"},
    {"date": "2026-10-02", "name": "Gandhi Jayanti", "type": "national"},
    {"date": "2026-10-09", "name": "Diwali", "type": "religious"},
    {"date": "2026-10-10", "name": "Gujarati New Year", "type": "state"},
    {"date": "2026-11-24", "name": "Guru Nanak Jayanti", "type": "religious"},
    {"date": "2026-12-25", "name": "Christmas", "type": "religious"},
]


def get_holidays(start_date: datetime, end_date: datetime) -> List[Dict]:
    """Get holidays within a date range."""
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")
    
    filtered_holidays = [
        h for h in HOLIDAYS
        if start_str <= h["date"] <= end_str
    ]
    
    return filtered_holidays


def get_upcoming_holidays(days: int = 90) -> List[Dict]:
    """Get upcoming holidays from today (IST timezone)."""
    today = get_current_time().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = today + timedelta(days=days)
    
    return get_holidays(today, end_date)


def is_holiday(date: datetime) -> tuple:
    """Check if a date is a holiday. Returns (is_holiday, holiday_name)."""
    date_str = date.strftime("%Y-%m-%d")
    
    for holiday in HOLIDAYS:
        if holiday["date"] == date_str:
            return (True, holiday["name"])
    
    return (False, None)


from datetime import timedelta
