"""
Script to reset leave requests, audit logs, and employee leave balances directly from database.
No API server required.
"""
import sys
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add app to path
sys.path.insert(0, '.')

from app.config import settings
from app.models import User, LeaveRequest, AuditLog, LeaveCalendar, Gender

# Default leave balances
DEFAULT_BALANCES = {
    "annual_leave": 20,
    "sick_leave": 10,
    "personal_leave": 5,
    "emergency_leave": 5,
    "maternity_leave": 90,
    "paternity_leave": 15,
}


def get_db_session():
    """Create database session."""
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def delete_leave_requests(db):
    """Delete all leave requests and calendar entries."""
    print("Deleting leave requests...")
    
    # Delete calendar entries first (foreign key constraint)
    calendar_count = db.query(LeaveCalendar).count()
    db.query(LeaveCalendar).delete()
    print(f"✓ Deleted {calendar_count} calendar entries")
    
    # Delete leave requests
    leave_count = db.query(LeaveRequest).count()
    db.query(LeaveRequest).delete()
    print(f"✓ Deleted {leave_count} leave requests")
    
    db.commit()


def reset_leave_balances(db):
    """Reset all employee leave balances to default."""
    print("Resetting employee leave balances...")
    
    employees = db.query(User).filter(User.role == "employee").all()
    reset_count = 0
    
    for employee in employees:
        # Set default balances
        employee.annual_leave = DEFAULT_BALANCES["annual_leave"]
        employee.sick_leave = DEFAULT_BALANCES["sick_leave"]
        employee.personal_leave = DEFAULT_BALANCES["personal_leave"]
        employee.emergency_leave = DEFAULT_BALANCES["emergency_leave"]
        
        # Set maternity/paternity based on gender
        if employee.gender == Gender.FEMALE:
            employee.maternity_leave = DEFAULT_BALANCES["maternity_leave"]
            employee.paternity_leave = 0
        elif employee.gender == Gender.MALE:
            employee.maternity_leave = 0
            employee.paternity_leave = DEFAULT_BALANCES["paternity_leave"]
        else:
            employee.maternity_leave = 0
            employee.paternity_leave = 0
        
        reset_count += 1
        print(f"✓ Reset balance for {employee.name} ({employee.email})")
    
    db.commit()
    print(f"✓ Reset {reset_count} employee balances")


def clear_audit_logs(db):
    """Clear all audit logs."""
    print("Clearing audit logs...")
    
    log_count = db.query(AuditLog).count()
    db.query(AuditLog).delete()
    print(f"✓ Deleted {log_count} audit log entries")
    
    db.commit()


def main():
    parser = argparse.ArgumentParser(description="Reset leave data and balances (direct DB access)")
    parser.add_argument(
        "--leaves-only",
        action="store_true",
        help="Only delete leave requests (skip balance reset and log clearing)"
    )
    parser.add_argument(
        "--balances-only",
        action="store_true",
        help="Only reset leave balances (skip leave deletion and log clearing)"
    )
    parser.add_argument(
        "--logs-only",
        action="store_true",
        help="Only clear audit logs (skip leave deletion and balance reset)"
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Skip confirmation prompt"
    )
    args = parser.parse_args()
    
    print("=" * 80)
    print("DATABASE RESET SCRIPT (Direct DB Access)")
    print("=" * 80)
    print()
    
    # Determine what to reset
    reset_leaves = not (args.balances_only or args.logs_only)
    reset_balances = not (args.leaves_only or args.logs_only)
    reset_logs = not (args.leaves_only or args.balances_only)
    
    # Show what will be reset
    print("This script will:")
    if reset_leaves:
        print("  • Delete all leave requests and calendar entries")
    if reset_balances:
        print("  • Reset all employee leave balances to default values")
    if reset_logs:
        print("  • Clear all audit logs")
    print()
    print("Default leave balances:")
    print(f"  • Annual Leave: {DEFAULT_BALANCES['annual_leave']} days")
    print(f"  • Sick Leave: {DEFAULT_BALANCES['sick_leave']} days")
    print(f"  • Personal Leave: {DEFAULT_BALANCES['personal_leave']} days")
    print(f"  • Emergency Leave: {DEFAULT_BALANCES['emergency_leave']} days")
    print(f"  • Maternity Leave: {DEFAULT_BALANCES['maternity_leave']} days (females)")
    print(f"  • Paternity Leave: {DEFAULT_BALANCES['paternity_leave']} days (males)")
    print()
    
    # Confirmation
    if not args.confirm:
        confirm = input("Are you sure you want to continue? (yes/no): ")
        if confirm.lower() not in ["yes", "y"]:
            print("Operation cancelled.")
            return
        print()
    
    try:
        # Connect to database
        print("Connecting to database...")
        db = get_db_session()
        print(f"✓ Connected to: {settings.DATABASE_URL}")
        print()
        
        # Delete leave requests
        if reset_leaves:
            print("STEP 1: Deleting leave requests")
            print("-" * 80)
            delete_leave_requests(db)
            print()
        
        # Reset employee balances
        if reset_balances:
            step_num = 2 if reset_leaves else 1
            print(f"STEP {step_num}: Resetting employee leave balances")
            print("-" * 80)
            reset_leave_balances(db)
            print()
        
        # Clear audit logs
        if reset_logs:
            if reset_leaves and reset_balances:
                step_num = 3
            elif reset_leaves or reset_balances:
                step_num = 2
            else:
                step_num = 1
            print(f"STEP {step_num}: Clearing audit logs")
            print("-" * 80)
            clear_audit_logs(db)
            print()
        
        print("=" * 80)
        print("RESET COMPLETE")
        print("=" * 80)
        
    except Exception as e:
        print()
        print("=" * 80)
        print(f"ERROR: {str(e)}")
        print("=" * 80)
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
