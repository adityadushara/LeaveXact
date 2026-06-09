#!/usr/bin/env python3
"""
Reset Leave Balances to Default Values
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User

def reset_balances():
    """Reset all employee leave balances to default"""
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("RESETTING LEAVE BALANCES TO DEFAULT")
        print("=" * 80)
        
        # Get all employees
        employees = db.query(User).filter(User.role == "EMPLOYEE").all()
        
        print(f"\nFound {len(employees)} employees\n")
        
        for emp in employees:
            print(f"Processing: {emp.name} ({emp.employee_id}) - Gender: {emp.gender}")
            
            # Check gender (case-insensitive)
            gender_upper = emp.gender.upper() if emp.gender else "MALE"
            
            if gender_upper == "FEMALE":
                emp.annual_leave = 20
                emp.sick_leave = 10
                emp.personal_leave = 5
                emp.emergency_leave = 5
                emp.maternity_leave = 90
                emp.paternity_leave = 0
                print(f"  ✓ Set female defaults: Annual=20, Sick=10, Personal=5, Emergency=5, Maternity=90, Paternity=0")
            else:
                emp.annual_leave = 20
                emp.sick_leave = 10
                emp.personal_leave = 5
                emp.emergency_leave = 5
                emp.maternity_leave = 0
                emp.paternity_leave = 15
                print(f"  ✓ Set male defaults: Annual=20, Sick=10, Personal=5, Emergency=5, Maternity=0, Paternity=15")
        
        db.commit()
        
        print("\n" + "=" * 80)
        print(f"✓ Successfully reset balances for {len(employees)} employees!")
        print("=" * 80)
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reset_balances()
