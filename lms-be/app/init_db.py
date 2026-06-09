"""
Initialize database with default admin user and employee users if not exists.
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, Gender
from app.auth import get_password_hash
import logging

logger = logging.getLogger(__name__)

# Employee data from CREDENTIALS.txt
EMPLOYEES = [
    {"name": "Sarah Johnson", "email": "sarah@leavexact.com", "employee_id": "EMP001", "department": "Engineering", "gender": Gender.FEMALE},
    {"name": "Michael Chen", "email": "michael@leavexact.com", "employee_id": "EMP002", "department": "Engineering", "gender": Gender.MALE},
    {"name": "Jennifer Davis", "email": "jennifer@leavexact.com", "employee_id": "EMP003", "department": "Engineering", "gender": Gender.FEMALE},
    {"name": "Jessica Taylor", "email": "jessica@leavexact.com", "employee_id": "EMP013", "department": "Engineering", "gender": Gender.FEMALE},
    {"name": "Emily Rodriguez", "email": "emily@leavexact.com", "employee_id": "EMP004", "department": "Marketing", "gender": Gender.FEMALE},
    {"name": "Kevin Lee", "email": "kevin@leavexact.com", "employee_id": "EMP005", "department": "Marketing", "gender": Gender.MALE},
    {"name": "Daniel Kim", "email": "daniel@leavexact.com", "employee_id": "EMP014", "department": "Marketing", "gender": Gender.MALE},
    {"name": "David Thompson", "email": "david@leavexact.com", "employee_id": "EMP006", "department": "Sales", "gender": Gender.MALE},
    {"name": "Maria Garcia", "email": "maria@leavexact.com", "employee_id": "EMP007", "department": "Sales", "gender": Gender.FEMALE},
    {"name": "Amanda White", "email": "amanda@leavexact.com", "employee_id": "EMP015", "department": "Sales", "gender": Gender.FEMALE},
    {"name": "Lisa Wang", "email": "lisa@leavexact.com", "employee_id": "EMP008", "department": "HR", "gender": Gender.FEMALE},
    {"name": "James Wilson", "email": "james@leavexact.com", "employee_id": "EMP009", "department": "Finance", "gender": Gender.MALE},
    {"name": "Thomas Anderson", "email": "thomas@leavexact.com", "employee_id": "EMP010", "department": "Finance", "gender": Gender.MALE},
    {"name": "Anna Martinez", "email": "anna@leavexact.com", "employee_id": "EMP011", "department": "Operations", "gender": Gender.FEMALE},
    {"name": "Robert Brown", "email": "robert@leavexact.com", "employee_id": "EMP012", "department": "Customer Support", "gender": Gender.MALE},
]

def init_database():
    """Initialize database with default data."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = SessionLocal()
    
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@leavexact.com").first()
        
        if not admin:
            logger.info("Creating default admin user...")
            admin = User(
                name="Admin User",
                email="admin@leavexact.com",
                password_hash=get_password_hash("admin@123"),
                role=UserRole.ADMIN,
                department="Administration",
                employee_id="ADMIN001",
                gender=Gender.OTHER,
                annual_leave=0,
                sick_leave=0,
                personal_leave=0,
                emergency_leave=0,
                maternity_leave=0,
                paternity_leave=0
            )
            db.add(admin)
            db.commit()
            logger.info("✓ Default admin user created successfully")
            logger.info("  Email: admin@leavexact.com")
            logger.info("  Password: admin@123")
        else:
            logger.info("Admin user already exists")
        
        # Create employee users
        created_count = 0
        for emp_data in EMPLOYEES:
            existing = db.query(User).filter(User.email == emp_data["email"]).first()
            if not existing:
                employee = User(
                    name=emp_data["name"],
                    email=emp_data["email"],
                    password_hash=get_password_hash("employee@123"),
                    role=UserRole.EMPLOYEE,
                    department=emp_data["department"],
                    employee_id=emp_data["employee_id"],
                    gender=emp_data["gender"],
                    annual_leave=20,
                    sick_leave=10,
                    personal_leave=5,
                    emergency_leave=5,
                    maternity_leave=90 if emp_data["gender"] == Gender.FEMALE else 0,
                    paternity_leave=15 if emp_data["gender"] == Gender.MALE else 0
                )
                db.add(employee)
                created_count += 1
        
        if created_count > 0:
            db.commit()
            logger.info(f"✓ Created {created_count} employee users")
            logger.info("  Password for all employees: employee@123")
        else:
            logger.info("All employee users already exist")
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_database()
