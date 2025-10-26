from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class LeaveType(str, enum.Enum):
    ANNUAL = "annual"
    SICK = "sick"
    PERSONAL = "personal"
    EMERGENCY = "emergency"
    MATERNITY = "maternity"
    PATERNITY = "paternity"

class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    department = Column(String(100), nullable=False)
    gender = Column(Enum(Gender), nullable=True)
    
    # Leave balances
    annual_leave = Column(Integer, default=20, nullable=False)
    sick_leave = Column(Integer, default=10, nullable=False)
    personal_leave = Column(Integer, default=5, nullable=False)
    emergency_leave = Column(Integer, default=5, nullable=False)
    maternity_leave = Column(Integer, default=90, nullable=False)
    paternity_leave = Column(Integer, default=15, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    leave_requests = relationship("LeaveRequest", back_populates="employee")
    audit_logs = relationship("AuditLog", back_populates="user")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    duration = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING, nullable=False)
    admin_comment = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("User", back_populates="leave_requests")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    details = Column(Text, nullable=True)  # JSON string for additional details
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class LeaveCalendar(Base):
    __tablename__ = "leave_calendar"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_request_id = Column(Integer, ForeignKey("leave_requests.id"), nullable=False)
    leave_date = Column(DateTime(timezone=True), nullable=False, index=True)
    leave_type = Column(Enum(LeaveType), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    employee = relationship("User")
    leave_request = relationship("LeaveRequest")
