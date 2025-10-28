"""
Quick script to check and reset a specific employee's leave balance.
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import User, Gender

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


def check_employee(email: str):
    """Check employee balance."""
    db = get_db_session()
    
    try:
        employee = db.query(User).filter(User.email == email).first()
        
        if not employee:
            print(f"✗ Employee not found: {email}")
            return
        
        print("=" * 80)
        print(f"EMPLOYEE: {employee.name}")
        print("=" * 80)
        print(f"Email:      {employee.email}")
        print(f"Emp ID:     {employee.employee_id}")
        print(f"Department: {employee.department}")
        print(f"Gender:     {employee.gender.value if employee.gender else 'Not set'}")
        print(f"Role:       {employee.role.value}")
        print()
        print("CURRENT LEAVE BALANCES:")
        print("-" * 80)
        print(f"Annual Leave:     {employee.annual_leave} days")
        print(f"Sick Leave:       {employee.sick_leave} days")
        print(f"Personal Leave:   {employee.personal_leave} days")
        print(f"Emergency Leave:  {employee.emergency_leave} days")
        print(f"Maternity Leave:  {employee.maternity_leave} days")
        print(f"Paternity Leave:  {employee.paternity_leave} days")
        print()
        
        # Check if needs reset
        needs_reset = (
            employee.annual_leave != DEFAULT_BALANCES["annual_leave"] or
            employee.sick_leave != DEFAULT_BALANCES["sick_leave"] or
            employee.personal_leave != DEFAULT_BALANCES["personal_leave"] or
            employee.emergency_leave != DEFAULT_BALANCES["emergency_leave"]
        )
        
        if needs_reset:
            print("⚠ Balances differ from defaults")
            reset = input("\nReset to default balances? (yes/no): ")
            
            if reset.lower() in ["yes", "y"]:
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
                
                db.commit()
                
                print()
                print("✓ Balances reset successfully!")
                print()
                print("NEW BALANCES:")
                print("-" * 80)
                print(f"Annual Leave:     {employee.annual_leave} days")
                print(f"Sick Leave:       {employee.sick_leave} days")
                print(f"Personal Leave:   {employee.personal_leave} days")
                print(f"Emergency Leave:  {employee.emergency_leave} days")
                print(f"Maternity Leave:  {employee.maternity_leave} days")
                print(f"Paternity Leave:  {employee.paternity_leave} days")
        else:
            print("✓ Balances are at default values")
        
        print("=" * 80)
        
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_employee_balance.py <email>")
        print("Example: python check_employee_balance.py anna@leavexact.com")
        sys.exit(1)
    
    email = sys.argv[1]
    check_employee(email)
