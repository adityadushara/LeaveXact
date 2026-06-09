#!/usr/bin/env python3
"""
Generate Realistic Leave Balances Based on Employee Leave History

Rules:
1. Every employee starts with default balances (Annual:20, Sick:10, Personal:5, Emergency:5, Maternity:90/Paternity:15)
2. Leave requests are generated over the last 12 months
3. Only APPROVED leaves deduct from balances
4. Pending and Rejected leaves do NOT affect balances
5. Employees are categorized by utilization tier:
   - High utilization (70-90%)
   - Medium utilization (30-60%)
   - Low utilization (0-20%)
   - No leaves at all
6. Realistic patterns:
   - New employees (joined recently) use fewer leaves
   - Senior employees use more earned leave
   - Some employees frequently take sick leave
   - Some employees rarely take leave
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
import random
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, LeaveRequest, AuditLog, LeaveCalendar, LeaveType, LeaveStatus, Gender

# ============================================================================
# CONFIGURATION
# ============================================================================

# Default leave allocations
DEFAULT_BALANCES = {
    "annual": 20,
    "sick": 10,
    "personal": 5,
    "emergency": 5,
    "maternity": 90,  # Female only
    "paternity": 15,  # Male only
}

# Utilization tiers - assigned to employees
# Format: (min_utilization, max_utilization, description)
UTILIZATION_TIERS = {
    "high": (0.70, 0.90),      # Heavy leave users
    "medium": (0.30, 0.60),    # Moderate users
    "low": (0.05, 0.20),       # Minimal leave users
    "none": (0.0, 0.0),        # No leaves at all
}

# Employee utilization assignments (by employee_id pattern)
# This creates realistic diversity
EMPLOYEE_PROFILES = [
    # (employee_ids, tier, personality_traits)
    (["EMP001"], "high", {"prefers": "annual", "sick_prone": False, "description": "Senior - uses vacation time fully"}),
    (["EMP002"], "medium", {"prefers": "annual", "sick_prone": True, "description": "Gets sick occasionally"}),
    (["EMP003"], "low", {"prefers": "personal", "sick_prone": False, "description": "New employee, rarely takes leave"}),
    (["EMP004"], "high", {"prefers": "sick", "sick_prone": True, "description": "Frequent health issues"}),
    (["EMP005"], "medium", {"prefers": "annual", "sick_prone": False, "description": "Plans vacations regularly"}),
    (["EMP006"], "none", {"prefers": None, "sick_prone": False, "description": "Never takes leave"}),
    (["EMP007"], "high", {"prefers": "personal", "sick_prone": False, "description": "Many personal commitments"}),
    (["EMP008"], "low", {"prefers": "sick", "sick_prone": False, "description": "Rarely absent"}),
    (["EMP009"], "medium", {"prefers": "annual", "sick_prone": False, "description": "Takes regular breaks"}),
    (["EMP010"], "high", {"prefers": "annual", "sick_prone": True, "description": "Senior employee, uses all types"}),
    (["EMP011"], "medium", {"prefers": "emergency", "sick_prone": False, "description": "Has had family emergencies"}),
    (["EMP012"], "low", {"prefers": "annual", "sick_prone": False, "description": "Workaholic, minimal leave"}),
    (["EMP013"], "high", {"prefers": "annual", "sick_prone": False, "description": "Senior engineer, proper work-life balance"}),
    (["EMP014"], "medium", {"prefers": "sick", "sick_prone": True, "description": "Moderate health-related absences"}),
    (["EMP015"], "low", {"prefers": "personal", "sick_prone": False, "description": "New to the team"}),
]

# Realistic leave reasons by type
LEAVE_REASONS = {
    LeaveType.ANNUAL: [
        "Family vacation to Goa",
        "Year-end holiday break",
        "Travel plans with family",
        "Wedding anniversary celebration",
        "Visiting hometown",
        "Long weekend getaway",
        "Planned vacation - Himachal trip",
        "Holiday trip to Rajasthan",
        "Diwali extended break",
        "Summer vacation",
        "Festival celebrations at home",
        "Attending family wedding",
    ],
    LeaveType.SICK: [
        "Flu and high fever",
        "Scheduled medical appointment",
        "Dental procedure and recovery",
        "Food poisoning - need rest",
        "Severe migraine",
        "Back pain - doctor advised rest",
        "Eye infection - cannot work on screen",
        "Viral infection",
        "Post-surgery recovery",
        "Stomach infection",
        "Prescribed bed rest by doctor",
        "Regular health checkup",
    ],
    LeaveType.PERSONAL: [
        "Child's school admission process",
        "Bank and legal documentation work",
        "Home renovation supervision",
        "Moving to new apartment",
        "Child's annual day at school",
        "Passport renewal appointment",
        "Property registration work",
        "Parent-teacher meeting",
        "Vehicle registration work",
        "Personal legal matters",
    ],
    LeaveType.EMERGENCY: [
        "Family member hospitalized",
        "Urgent family medical emergency",
        "House flooding - emergency repairs",
        "Critical family situation",
        "Parent suddenly unwell",
        "Accident at home",
        "Child's medical emergency",
    ],
    LeaveType.MATERNITY: [
        "Maternity leave - prenatal care",
        "Maternity leave - delivery and recovery",
        "Maternity leave continuation",
    ],
    LeaveType.PATERNITY: [
        "Paternity leave - wife's delivery",
        "Paternity leave - newborn care",
        "Paternity leave - family bonding",
    ],
}

ADMIN_COMMENTS_APPROVED = [
    "Approved. Enjoy your time off!",
    "Approved as requested.",
    "Granted. Please ensure proper handover.",
    "Approved - have a good break.",
    "Approved.",
    "Sanctioned. Please coordinate with team.",
    "Leave granted as per policy.",
]

ADMIN_COMMENTS_REJECTED = [
    "Cannot approve - critical project deadline approaching.",
    "Rejected: Too many team members already on leave during this period.",
    "Please reschedule - we need you for the client demo.",
    "Insufficient notice period. Please apply at least 3 days in advance.",
    "Rejected due to quarter-end workload.",
    "Cannot approve concurrent leave with another team member.",
]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_employee_profile(employee_id: str) -> dict:
    """Get the profile configuration for an employee"""
    for emp_ids, tier, traits in EMPLOYEE_PROFILES:
        if employee_id in emp_ids:
            return {"tier": tier, "traits": traits}
    # Default: medium utilization
    return {"tier": "medium", "traits": {"prefers": "annual", "sick_prone": False, "description": "Regular employee"}}


def calculate_target_days(tier: str, total_available: int) -> int:
    """Calculate target number of approved leave days based on tier"""
    min_util, max_util = UTILIZATION_TIERS[tier]
    if tier == "none":
        return 0
    target_utilization = random.uniform(min_util, max_util)
    return int(total_available * target_utilization)


def generate_leave_dates(months_back: int = 12) -> tuple:
    """Generate a random leave start date within the last N months"""
    today = date.today()
    earliest = today - timedelta(days=months_back * 30)
    
    # Random day within range (mostly past, some recent)
    days_range = (today - earliest).days
    random_day = random.randint(0, days_range)
    start = earliest + timedelta(days=random_day)
    
    # Skip weekends for start date
    while start.weekday() >= 5:
        start += timedelta(days=1)
    
    return start


def get_leave_duration(leave_type: LeaveType, tier: str) -> int:
    """Get realistic duration based on leave type and employee tier"""
    if leave_type == LeaveType.ANNUAL:
        if tier == "high":
            return random.choices([1, 2, 3, 5, 7, 10], weights=[10, 15, 20, 30, 15, 10])[0]
        elif tier == "medium":
            return random.choices([1, 2, 3, 5], weights=[20, 30, 30, 20])[0]
        else:
            return random.choices([1, 2, 3], weights=[40, 40, 20])[0]
    elif leave_type == LeaveType.SICK:
        return random.choices([1, 2, 3, 5], weights=[35, 30, 25, 10])[0]
    elif leave_type == LeaveType.PERSONAL:
        return random.choices([1, 2, 3], weights=[50, 35, 15])[0]
    elif leave_type == LeaveType.EMERGENCY:
        return random.choices([1, 2, 3], weights=[40, 40, 20])[0]
    elif leave_type == LeaveType.MATERNITY:
        return random.choices([14, 21, 30, 45, 60, 90], weights=[5, 10, 20, 25, 25, 15])[0]
    elif leave_type == LeaveType.PATERNITY:
        return random.choices([5, 7, 10, 15], weights=[20, 30, 30, 20])[0]
    return 1


def pick_leave_type(profile: dict, gender: str, remaining_balances: dict) -> LeaveType:
    """Pick a leave type weighted by employee personality and available balance"""
    preferred = profile["traits"].get("prefers")
    sick_prone = profile["traits"].get("sick_prone", False)
    
    # Build available types based on gender and remaining balance
    available = []
    weights = []
    
    if remaining_balances.get("annual", 0) > 0:
        available.append(LeaveType.ANNUAL)
        weight = 35 if preferred == "annual" else 20
        weights.append(weight)
    
    if remaining_balances.get("sick", 0) > 0:
        available.append(LeaveType.SICK)
        weight = 40 if sick_prone else (30 if preferred == "sick" else 15)
        weights.append(weight)
    
    if remaining_balances.get("personal", 0) > 0:
        available.append(LeaveType.PERSONAL)
        weight = 30 if preferred == "personal" else 15
        weights.append(weight)
    
    if remaining_balances.get("emergency", 0) > 0:
        available.append(LeaveType.EMERGENCY)
        weight = 20 if preferred == "emergency" else 8
        weights.append(weight)
    
    if "FEMALE" in gender.upper() and remaining_balances.get("maternity", 0) > 0:
        available.append(LeaveType.MATERNITY)
        weights.append(3)  # Rare event
    
    if "MALE" in gender.upper() and remaining_balances.get("paternity", 0) > 0:
        available.append(LeaveType.PATERNITY)
        weights.append(3)  # Rare event
    
    if not available:
        return None
    
    return random.choices(available, weights=weights)[0]


# ============================================================================
# MAIN POPULATION LOGIC
# ============================================================================

def clear_existing_data(db: Session):
    """Clear all existing leave data and reset balances"""
    print("\n🧹 Clearing existing leave data...")
    
    db.query(LeaveCalendar).delete()
    db.query(LeaveRequest).delete()
    db.query(AuditLog).delete()
    
    # Reset all employee balances to defaults
    employees = db.query(User).filter(User.role == "EMPLOYEE").all()
    for emp in employees:
        gender_str = str(emp.gender).upper() if emp.gender else "MALE"
        emp.annual_leave = DEFAULT_BALANCES["annual"]
        emp.sick_leave = DEFAULT_BALANCES["sick"]
        emp.personal_leave = DEFAULT_BALANCES["personal"]
        emp.emergency_leave = DEFAULT_BALANCES["emergency"]
        if "FEMALE" in gender_str:
            emp.maternity_leave = DEFAULT_BALANCES["maternity"]
            emp.paternity_leave = 0
        else:
            emp.maternity_leave = 0
            emp.paternity_leave = DEFAULT_BALANCES["paternity"]
    
    db.commit()
    print(f"   ✓ Cleared all leave requests, calendar entries, and audit logs")
    print(f"   ✓ Reset balances for {len(employees)} employees to defaults")


def generate_leaves_for_employee(db: Session, employee: User, admin: User, profile: dict):
    """Generate realistic leave history for a single employee"""
    tier = profile["tier"]
    traits = profile["traits"]
    gender_str = str(employee.gender).upper() if employee.gender else "MALE"
    
    # Calculate total available leaves (excluding maternity/paternity for simplicity in utilization calc)
    total_core_leaves = DEFAULT_BALANCES["annual"] + DEFAULT_BALANCES["sick"] + DEFAULT_BALANCES["personal"] + DEFAULT_BALANCES["emergency"]
    
    # Target approved days
    target_approved_days = calculate_target_days(tier, total_core_leaves)
    
    # Track remaining balances for this employee
    remaining = {
        "annual": DEFAULT_BALANCES["annual"],
        "sick": DEFAULT_BALANCES["sick"],
        "personal": DEFAULT_BALANCES["personal"],
        "emergency": DEFAULT_BALANCES["emergency"],
    }
    if "FEMALE" in gender_str:
        remaining["maternity"] = DEFAULT_BALANCES["maternity"]
    else:
        remaining["paternity"] = DEFAULT_BALANCES["paternity"]
    
    if tier == "none":
        # No leaves at all - keep full default balances
        return 0, 0, remaining
    
    total_approved_days = 0
    total_requests = 0
    leaves_created = []
    
    # Generate approved leaves until we hit the target
    max_attempts = 50
    attempts = 0
    
    while total_approved_days < target_approved_days and attempts < max_attempts:
        attempts += 1
        
        # Pick leave type based on personality and remaining balance
        leave_type = pick_leave_type(profile, gender_str, remaining)
        if leave_type is None:
            break
        
        # Get duration
        leave_type_key = leave_type.value
        duration = get_leave_duration(leave_type, tier)
        
        # Cap duration to remaining balance
        max_available = remaining.get(leave_type_key, 0)
        if max_available <= 0:
            continue
        duration = min(duration, max_available)
        
        # Cap to not exceed target by too much
        if total_approved_days + duration > target_approved_days + 3:
            duration = max(1, target_approved_days - total_approved_days)
        
        # Generate dates
        start_date = generate_leave_dates(months_back=12)
        end_date = start_date + timedelta(days=duration - 1)
        
        # Skip if end date is in the future (make most leaves in the past)
        today = date.today()
        if end_date > today and random.random() < 0.7:
            # 70% chance to push to past
            shift_back = (end_date - today).days + random.randint(5, 60)
            start_date -= timedelta(days=shift_back)
            end_date = start_date + timedelta(days=duration - 1)
        
        # Determine status - APPROVED to hit our target
        status = LeaveStatus.APPROVED
        admin_comment = random.choice(ADMIN_COMMENTS_APPROVED)
        
        # Create timestamps
        created_at = datetime.combine(start_date, datetime.min.time()) - timedelta(
            days=random.randint(2, 14),
            hours=random.randint(8, 18),
            minutes=random.randint(0, 59)
        )
        updated_at = created_at + timedelta(
            hours=random.randint(2, 48),
            minutes=random.randint(0, 59)
        )
        
        reason = random.choice(LEAVE_REASONS[leave_type])
        
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
            updated_at=updated_at,
        )
        db.add(leave_request)
        db.flush()
        
        # Create calendar entries for approved leaves
        current = start_date
        while current <= end_date:
            calendar_entry = LeaveCalendar(
                employee_id=employee.id,
                leave_request_id=leave_request.id,
                leave_date=datetime.combine(current, datetime.min.time()),
                leave_type=leave_type,
            )
            db.add(calendar_entry)
            current += timedelta(days=1)
        
        # Create audit logs
        audit_request = AuditLog(
            user_id=employee.id,
            action="leave_requested",
            description=f"Submitted {leave_type.value} leave request for {duration} day(s)",
            details=json.dumps({
                "leave_request_id": leave_request.id,
                "leave_type": leave_type.value,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "duration": duration,
            }),
            timestamp=created_at,
        )
        db.add(audit_request)
        
        audit_approve = AuditLog(
            user_id=admin.id,
            action="leave_approved",
            description=f"Approved {leave_type.value} leave for {employee.name} ({duration} days)",
            details=json.dumps({
                "leave_request_id": leave_request.id,
                "employee_id": employee.id,
                "employee_name": employee.name,
                "leave_type": leave_type.value,
                "duration": duration,
            }),
            timestamp=updated_at,
        )
        db.add(audit_approve)
        
        # Deduct from remaining balance
        remaining[leave_type_key] -= duration
        total_approved_days += duration
        total_requests += 1
        leaves_created.append({"type": leave_type.value, "days": duration, "status": "approved"})
    
    # Now add some PENDING requests (future leaves)
    pending_count = random.randint(0, 3) if tier != "none" else 0
    for _ in range(pending_count):
        leave_type = pick_leave_type(profile, gender_str, remaining)
        if leave_type is None:
            break
        
        # Future dates
        start_date = today + timedelta(days=random.randint(3, 45))
        while start_date.weekday() >= 5:
            start_date += timedelta(days=1)
        duration = get_leave_duration(leave_type, tier)
        duration = min(duration, remaining.get(leave_type.value, 0))
        if duration <= 0:
            continue
        end_date = start_date + timedelta(days=duration - 1)
        
        created_at = datetime.now() - timedelta(
            days=random.randint(0, 5),
            hours=random.randint(0, 12),
            minutes=random.randint(0, 59)
        )
        
        reason = random.choice(LEAVE_REASONS[leave_type])
        leave_request = LeaveRequest(
            employee_id=employee.id,
            leave_type=leave_type,
            start_date=datetime.combine(start_date, datetime.min.time()),
            end_date=datetime.combine(end_date, datetime.min.time()),
            duration=duration,
            reason=reason,
            status=LeaveStatus.PENDING,
            admin_comment=None,
            created_at=created_at,
            updated_at=None,
        )
        db.add(leave_request)
        db.flush()
        
        audit_request = AuditLog(
            user_id=employee.id,
            action="leave_requested",
            description=f"Submitted {leave_type.value} leave request for {duration} day(s)",
            details=json.dumps({
                "leave_request_id": leave_request.id,
                "leave_type": leave_type.value,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "duration": duration,
            }),
            timestamp=created_at,
        )
        db.add(audit_request)
        total_requests += 1
        leaves_created.append({"type": leave_type.value, "days": duration, "status": "pending"})
    
    # Add some REJECTED requests (past)
    rejected_count = random.randint(0, 2) if tier in ["high", "medium"] else 0
    for _ in range(rejected_count):
        leave_type = random.choice([LeaveType.ANNUAL, LeaveType.PERSONAL, LeaveType.SICK])
        start_date = generate_leave_dates(months_back=10)
        duration = random.randint(1, 5)
        end_date = start_date + timedelta(days=duration - 1)
        
        created_at = datetime.combine(start_date, datetime.min.time()) - timedelta(
            days=random.randint(3, 10),
            hours=random.randint(8, 17),
            minutes=random.randint(0, 59)
        )
        updated_at = created_at + timedelta(
            hours=random.randint(4, 72),
            minutes=random.randint(0, 59)
        )
        
        reason = random.choice(LEAVE_REASONS[leave_type])
        admin_comment = random.choice(ADMIN_COMMENTS_REJECTED)
        
        leave_request = LeaveRequest(
            employee_id=employee.id,
            leave_type=leave_type,
            start_date=datetime.combine(start_date, datetime.min.time()),
            end_date=datetime.combine(end_date, datetime.min.time()),
            duration=duration,
            reason=reason,
            status=LeaveStatus.REJECTED,
            admin_comment=admin_comment,
            created_at=created_at,
            updated_at=updated_at,
        )
        db.add(leave_request)
        db.flush()
        
        audit_request = AuditLog(
            user_id=employee.id,
            action="leave_requested",
            description=f"Submitted {leave_type.value} leave request for {duration} day(s)",
            details=json.dumps({
                "leave_request_id": leave_request.id,
                "leave_type": leave_type.value,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "duration": duration,
            }),
            timestamp=created_at,
        )
        db.add(audit_request)
        
        audit_reject = AuditLog(
            user_id=admin.id,
            action="leave_rejected",
            description=f"Rejected {leave_type.value} leave for {employee.name}",
            details=json.dumps({
                "leave_request_id": leave_request.id,
                "employee_name": employee.name,
                "reason": admin_comment,
            }),
            timestamp=updated_at,
        )
        db.add(audit_reject)
        total_requests += 1
        leaves_created.append({"type": leave_type.value, "days": duration, "status": "rejected"})
    
    # Update employee's actual leave balances (only approved deducts)
    employee.annual_leave = remaining["annual"]
    employee.sick_leave = remaining["sick"]
    employee.personal_leave = remaining["personal"]
    employee.emergency_leave = remaining["emergency"]
    if "FEMALE" in gender_str:
        employee.maternity_leave = remaining.get("maternity", 0)
        employee.paternity_leave = 0
    else:
        employee.maternity_leave = 0
        employee.paternity_leave = remaining.get("paternity", DEFAULT_BALANCES["paternity"])
    
    return total_requests, total_approved_days, remaining


def run():
    """Main execution"""
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("  GENERATE REALISTIC LEAVE BALANCES & HISTORY")
        print("=" * 80)
        
        # Step 1: Clear existing data
        clear_existing_data(db)
        
        # Step 2: Get employees and admin
        employees = db.query(User).filter(User.role == "EMPLOYEE").all()
        admin = db.query(User).filter(User.role == "ADMIN").first()
        
        if not employees:
            print("\n❌ No employees found!")
            return
        if not admin:
            print("\n❌ No admin user found!")
            return
        
        print(f"\n📋 Found {len(employees)} employees and 1 admin")
        print(f"📅 Generating leave history for the last 12 months")
        print("\n" + "-" * 80)
        
        # Step 3: Generate leaves for each employee
        total_all_requests = 0
        summary = []
        
        for employee in employees:
            profile = get_employee_profile(employee.employee_id)
            tier = profile["tier"]
            description = profile["traits"]["description"]
            gender_str = str(employee.gender).upper() if employee.gender else "MALE"
            
            # Generate leaves
            req_count, approved_days, remaining = generate_leaves_for_employee(db, employee, admin, profile)
            total_all_requests += req_count
            
            # Calculate utilization
            total_core = DEFAULT_BALANCES["annual"] + DEFAULT_BALANCES["sick"] + DEFAULT_BALANCES["personal"] + DEFAULT_BALANCES["emergency"]
            utilization = (approved_days / total_core * 100) if total_core > 0 else 0
            
            summary.append({
                "name": employee.name,
                "emp_id": employee.employee_id,
                "tier": tier,
                "requests": req_count,
                "approved_days": approved_days,
                "utilization": utilization,
                "remaining": remaining,
                "description": description,
            })
            
            # Print progress
            status_icon = "🔴" if tier == "high" else "🟡" if tier == "medium" else "🟢" if tier == "low" else "⚪"
            print(f"\n{status_icon} {employee.name} ({employee.employee_id}) - {tier.upper()} utilization")
            print(f"   {description}")
            print(f"   Requests: {req_count} | Approved Days: {approved_days} | Utilization: {utilization:.1f}%")
            print(f"   Balance → Annual: {remaining.get('annual', 0)} | Sick: {remaining.get('sick', 0)} | Personal: {remaining.get('personal', 0)} | Emergency: {remaining.get('emergency', 0)}")
        
        # Commit all changes
        db.commit()
        
        # Step 4: Print summary
        print("\n" + "=" * 80)
        print("  SUMMARY")
        print("=" * 80)
        print(f"\n  Total employees processed: {len(employees)}")
        print(f"  Total leave requests created: {total_all_requests}")
        
        # Group by tier
        tiers_count = {"high": 0, "medium": 0, "low": 0, "none": 0}
        for s in summary:
            tiers_count[s["tier"]] += 1
        
        print(f"\n  Utilization Distribution:")
        print(f"    🔴 High (70-90%):    {tiers_count['high']} employees")
        print(f"    🟡 Medium (30-60%):  {tiers_count['medium']} employees")
        print(f"    🟢 Low (0-20%):      {tiers_count['low']} employees")
        print(f"    ⚪ None (0%):         {tiers_count['none']} employees")
        
        print(f"\n  Sample Balances:")
        print(f"  {'Employee':<20} {'Annual':<8} {'Sick':<6} {'Personal':<10} {'Emergency':<10} {'Utilization':<12}")
        print(f"  {'-'*70}")
        for s in summary:
            r = s["remaining"]
            print(f"  {s['name']:<20} {r.get('annual',0):<8} {r.get('sick',0):<6} {r.get('personal',0):<10} {r.get('emergency',0):<10} {s['utilization']:.1f}%")
        
        print(f"\n✅ Done! All leave balances now reflect realistic usage patterns.")
        print(f"   - Approved leaves have been deducted from balances")
        print(f"   - Pending and rejected leaves do NOT affect balances")
        print(f"   - Calendar entries created for approved leaves only")
        print(f"   - Audit logs generated for all actions")
        print("=" * 80)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run()
