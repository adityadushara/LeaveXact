from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = "sqlite:///./data/leavexact.db"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]  # Allow all origins for development
    
    # Application settings
    APP_NAME: str = "LeaveXact API"
    DEBUG: bool = True
    
    # Default leave balances
    DEFAULT_ANNUAL_LEAVE: int = 20
    DEFAULT_SICK_LEAVE: int = 10
    DEFAULT_PERSONAL_LEAVE: int = 5
    DEFAULT_EMERGENCY_LEAVE: int = 5
    DEFAULT_MATERNITY_LEAVE: int = 90
    
    class Config:
        env_file = ".env"

settings = Settings()
