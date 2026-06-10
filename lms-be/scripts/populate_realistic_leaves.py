#!/usr/bin/env python3
"""
Populate Realistic Leave Requests Script
Adds realistic leave requests for all employees with proper audit logging
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, LeaveRequest, AuditLog, LeaveCalendar, LeaveType, LeaveStatus
from app.crud import update_leave_calendar

# Realistic leave reasons by type
LEAVE_REASONS = {
    LeaveType.ANNUAL: [
        "Family vacation",
        "Year-end holiday",
        "Personal travel",
        "Wedding anniversary celebration",
        "Visiting relatives",
        "Long weekend getaway",
        "Planned vacation",
        "Holiday trip",
    ],
    LeaveType.SICK: [
        "Flu and fever",
        "Medical appointment",
        "Doctor's checkup",
        "Dental procedure",
        "Recovery from illness",
        "Medical treatment",
        "Health checkup",
        "Prescribed bed rest",
    ],
    LeaveType.PERSONAL: [
        "Personal matters",
        "Family commitment",
        "Home repairs",
        "Moving house",
        "Child's school event",
        "Personal appointment",
        "Family function",
        "Personal emergency",
    ],
    LeaveType.EMERGENCY: [
        "Family emergency",
        "Urgent personal matter",
        "Unexpected situation",
        "Critical family issue",
        "Emergency at home",
    ],
    LeaveType.MATERNITY: [
        "Maternity leave",
        "Prenatal care",
        "Postnatal recovery",
    ],
    LeaveType.PATERNITY: [
        "Paternity leave",
        "Supporting newborn care",
        "Family bonding time",
    ],
}

ADMIN_COMMENTS = {
    "approved": [
        "Approved as requested",
        "Enjoy your time off",
        "Have a good break",
        "Approved - please ensure handover",
        "Approved",
    ],
    "rejected": [
        "Insufficient staffing during this period",
        "Critical project deadline - cannot approve",
        "Too many team members on leave",
        "Please reschedule to a different date",
    ],
}

def get_random_date_range(start_from_days_ago=90, end_in_days=60):
    """Generate random start and end dates"""
    today = datetime.now().date()
    
    # Random start date (can be past or future)
    days_offset = random.randint(-start_from_days_ago, end_in_days)
    start_date = today + timedelta(days=days_offset)
    
    # Random duration based on leave type
    duration = random.choices(
        [1, 2, 3, 5, 7, 10, 14],
        weights=[30, 25, 20, 15, 5, 3, 2]
    )[0]
    
    end_date = start_date + timedelta(days=duration - 1)
    
    return start_date, end_date, duration

def create_leave_calendar_entries(db: Session, leave_request: LeaveRequest):
    """Create calendar entries for each day of leave"""
    current_date = leave_request.start_date.date() if isinstance(leave_request.start_date, datetime) else leave_request.start_date
    end_date = leave_request.end_date.date() if isinstance(leave_request.end_date, datetime) else leave_request.end_date
    
    while current_date <= end_date:
        calendar_entry = LeaveCalendar(
            employee_id=leave_request.employee_id,
            leave_request_id=leave_request.id,
            leave_date=datetime.combine(current_date, datetime.min.time()),
            leave_type=leave_request.leave_type,
        )
        db.add(calendar_entry)
        current_date += timedelta(days=1)

def create_audit_log(db: Session, user_id: int, action: str, description: str, details: dict, timestamp: datetime = None):
    """Create audit log entry"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        description=description,
        details=str(details),
        timestamp=timestamp if timestamp else datetime.now()
    )
    db.add(audit_log)

def populate_leaves(leaves_per_employee: int = 7):
    """Populate realistic leave requests for all employees"""
    db = SessionLocal()
    
    try:
        # Get all employees (non-admin users)
        employees = db.query(User).filter(User.role == "employee").all()
        
        if not employees:
            print("No employees found in database!")
            return
        
        # Get admin user for approval actions
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            print("Warning: No admin user found. Creating audit logs without admin.")
        
        print(f"Found {len(employees)} employees")
        print(f"Creating {leaves_per_employee} leave requests per employee...")
        print(f"Total leaves to create: {len(employees) * leaves_per_employee}")
        print("=" * 80)
        
        total_created = 0
        
        # Create leaves for each employee
        for employee in employees:
            print(f"\nProcessing: {employee.name} ({employee.employee_id})")
            
            for i in range(leaves_per_employee):
                # Random leave type based on employee gender
                gender_str = str(employee.gender).upper() if employee.gender else "MALE"
                
                if "FEMALE" in gender_str:
                    leave_types = [LeaveType.ANNUAL, LeaveType.SICK, LeaveType.PERSONAL, 
                                 LeaveType.EMERGENCY, LeaveType.MATERNITY]
                    weights = [35, 25, 20, 10, 10]
                else:
                    leave_types = [LeaveType.ANNUAL, LeaveType.SICK, LeaveType.PERSONAL, 
                                 LeaveType.EMERGENCY, LeaveType.PATERNITY]
                    weights = [35, 25, 20, 15, 5]
                
                leave_type = random.choices(leave_types, weights=weights)[0]
                
                # Get random dates
                start_date, end_date, duration = get_random_date_range()
                
                # Random reason
                reason = random.choice(LEAVE_REASONS[leave_type])
                
                # Determine status based on date
                today = datetime.now().date()
                
                # If end date has passed, it can be approved, rejected, or expired
                if end_date < today:
                    # Past leaves: 60% approved, 25% rejected, 15% expired
                    status = random.choices(
                        [LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.EXPIRED],
                        weights=[60, 25, 15]
                    )[0]
                else:
                    # Future/current leaves: 65% approved, 20% rejected, 15% pending
                    status = random.choices(
                        [LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.PENDING],
                        weights=[65, 20, 15]
                    )[0]
                
                # Admin comment based on status
                admin_comment = ""
                if status == LeaveStatus.APPROVED:
                    admin_comment = random.choice(ADMIN_COMMENTS["approved"])
                elif status == LeaveStatus.REJECTED:
                    admin_comment = random.choice(ADMIN_COMMENTS["rejected"])
                elif status == LeaveStatus.EXPIRED:
                    admin_comment = "Automatically expired - end date has passed"
                
                # Random timestamps for created_at and updated_at
                # Each leave gets a unique timestamp
                days_ago_created = random.randint(1, 90)
                
                created_at = datetime.now() - timedelta(
                    days=days_ago_created,
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                # Updated time is after created time
                days_diff = random.randint(0, min(7, days_ago_created))
                updated_at = created_at + timedelta(
                    days=days_diff,
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59)
                )
                
                # Create leave request
                leave_request = LeaveRequest(
                    employee_id=employee.id,
                    leave_type=leave_type,
                    start_date=datetime.combine(start_date, datetime.min.time()),
                    end_date=datetime.combine(end_date, datetime.min.time()),
                    duration=duration,
                    reason=reason,
                    status=status,
                    admin_comment=admin_comment,
                    created_at=created_at,
                    updated_at=updated_at
                )
                
                db.add(leave_request)
                db.flush()  # Get the ID
                
                # Create audit log for request submission with unique timestamp
                create_audit_log(
                    db,
                    employee.id,
                    "leave_requested",
                    f"Submitted {leave_type.value} leave request",
                    {
                        "leave_request_id": leave_request.id,
                        "leave_type": leave_type.value,
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat(),
                        "duration": duration
                    },
                    timestamp=created_at  # Use the same timestamp as leave creation
                )
                
                # If approved, rejected, or expired - create admin audit log and update balance
                if status in [LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.EXPIRED]:
                    if status == LeaveStatus.APPROVED:
                        action = "leave_approved"
                        action_text = "Approved"
                    elif status == LeaveStatus.REJECTED:
                        action = "leave_rejected"
                        action_text = "Rejected"
                    else:  # EXPIRED
                        action = "leave_expired"
                        action_text = "Expired"
                    
                    # Admin action timestamp is slightly after employee request
                    admin_action_time = created_at + timedelta(
                        hours=random.randint(1, 48),
                        minutes=random.randint(0, 59),
                        seconds=random.randint(0, 59)
                    )
                    
                    create_audit_log(
                        db,
                        admin.id if admin else employee.id,
                        action,
                        f"{action_text} leave request from {employee.name}",
                        {
                            "leave_request_id": leave_request.id,
                            "employee_id": employee.id,
                            "leave_type": leave_type.value,
                            "start_date": start_date.isoformat(),
                            "end_date": end_date.isoformat(),
                            "duration": duration
                        },
                        timestamp=admin_action_time  # Unique timestamp for admin action
                    )
                    
                    # Update leave balance only if approved (not for rejected or expired)
                    if status == LeaveStatus.APPROVED:
                        # Deduct leave balance
                        leave_type_str = leave_type.value
                        current_balance = getattr(employee, f"{leave_type_str}_leave", 0)
                        new_balance = max(0, current_balance - duration)
                        setattr(employee, f"{leave_type_str}_leave", new_balance)
                        
                        # Create calendar entries
                        create_leave_calendar_entries(db, leave_request)
                
                total_created += 1
                print(f"  ✓ {leave_type.value} ({status.value}) - {start_date} to {end_date}")
        
        db.commit()
        print("\n" + "=" * 80)
        print(f"✓ Successfully created {total_created} leave requests!")
        print(f"✓ {leaves_per_employee} leaves per employee across {len(employees)} employees")
        print(f"✓ Leave statuses: Approved, Rejected, Pending, and Expired")
        print(f"✓ Updated leave balances for approved requests only")
        print(f"✓ Created audit log entries with unique timestamps")
        print(f"✓ Created calendar entries for approved leaves only")
        print("\nLeave Types Generated:")
        print("  - Annual Leave")
        print("  - Sick Leave")
        print("  - Personal Leave")
        print("  - Emergency Leave")
        print("  - Maternity Leave (Female employees)")
        print("  - Paternity Leave (Male employees)")
        print("\nLeave Statuses:")
        print("  - Approved: Leave approved by admin, balance deducted")
        print("  - Rejected: Leave rejected by admin, no balance change")
        print("  - Pending: Awaiting admin approval/rejection")
        print("  - Expired: Past leaves not approved/rejected in time")
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Populate realistic leave requests")
    parser.add_argument(
        "--count",
        type=int,
        default=7,
        help="Number of leave requests per employee (default: 7)"
    )
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("POPULATE REALISTIC LEAVE REQUESTS")
    print("=" * 80)
    
    populate_leaves(args.count)
