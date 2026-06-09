"""
Utility functions for the application.
"""
from datetime import datetime
import pytz
from app.config import settings, IST


def get_current_time():
    """Get current time in IST timezone."""
    return datetime.now(IST)


def to_ist(dt):
    """Convert datetime to IST timezone."""
    if dt is None:
        return None
    
    # If datetime is naive (no timezone), assume UTC and convert to IST
    if dt.tzinfo is None:
        dt = pytz.UTC.localize(dt)
    
    return dt.astimezone(IST)


def make_aware(dt):
    """Make a naive datetime timezone-aware (IST)."""
    if dt is None:
        return None
    
    if dt.tzinfo is None:
        return IST.localize(dt)
    
    return dt
