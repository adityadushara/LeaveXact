#!/usr/bin/env python3
"""
Clear All Leave Requests and Reset Balances
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, LeaveRequest, AuditLog, LeaveCalendar

def clear_leaves():
    """Clear all leave requests, calendar entries, and reset balances"""
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("CLEARING ALL LEAVE DATA")
        print("=" * 80)
        
        # Count before deletion
        leave_count = db.query(LeaveRequest).count()
        calendar_count = db.query(LeaveCalendar).count()
        audit_count = db.query(AuditLog).count()
        
        print(f"\nFound:")
        print(f"  - {leave_count} leave requests")
        print(f"  - {calendar_count} calendar entries")
        print(f"  - {audit_count} audit logs")
        
        # Delete all leave-related data
        db.query(LeaveCalendar).delete()
        db.query(LeaveRequest).delete()
        db.query(AuditLog).delete()
        
        # Reset all employee leave balances to default
        employees = db.query(User).filter(User.role == "EMPLOYEE").all()
        
        for emp in employees:
            # Check gender (handle enum values)
            gender_str = str(emp.gender).upper() if emp.gender else "MALE"
            
            if "FEMALE" in gender_str:
                emp.annual_leave = 20
                emp.sick_leave = 10
                emp.personal_leave = 5
                emp.emergency_leave = 5
                emp.maternity_leave = 90
                emp.paternity_leave = 0
            else:
                emp.annual_leave = 20
                emp.sick_leave = 10
                emp.personal_leave = 5
                emp.emergency_leave = 5
                emp.maternity_leave = 0
                emp.paternity_leave = 15
        
        db.commit()
        
        print("\n✓ Deleted all leave requests")
        print("✓ Deleted all calendar entries")
        print("✓ Deleted all audit logs")
        print(f"✓ Reset leave balances for {len(employees)} employees")
        print("\n" + "=" * 80)
        print("Database cleared successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    response = input("Are you sure you want to clear ALL leave data? (yes/no): ")
    if response.lower() == "yes":
        clear_leaves()
    else:
        print("Operation cancelled.")
