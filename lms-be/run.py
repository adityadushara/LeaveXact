#!/usr/bin/env python3
"""
LeaveXact Backend Runner
Simple script to run the LeaveXact backend application
"""

import uvicorn
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def main():
    """Run the LeaveXact backend application."""
    # Add current directory to Python path
    current_dir = Path(__file__).parent
    sys.path.insert(0, str(current_dir))
    
    # Load environment variables from .env file
    env_file = current_dir / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        print(f"✓ Loaded environment from {env_file}")
    
    # Set environment variables if not set (fallback defaults)
    os.environ.setdefault("DATABASE_URL", "sqlite:///./data/leavexact.db")
    os.environ.setdefault("SECRET_KEY", "your-secret-key-change-in-production")
    os.environ.setdefault("DEBUG", "true")
    
    # Create data directory if it doesn't exist
    data_dir = current_dir / "data"
    data_dir.mkdir(exist_ok=True)
    
    print("🏢 LeaveXact Backend Starting...")
    print("=" * 50)
    print(f"📁 Working directory: {current_dir}")
    print(f"🗄️  Database: {os.environ['DATABASE_URL']}")
    print(f"🔑 Secret key: {'*' * 20}")
    print(f"🐛 Debug mode: {os.environ['DEBUG']}")
    print("=" * 50)
    print("🌐 API will be available at: http://localhost:8000")
    print("📚 API documentation: http://localhost:8000/docs")
    print("🔍 ReDoc documentation: http://localhost:8000/redoc")
    print("❤️  Health check: http://localhost:8000/health")
    print("=" * 50)
    print("Press Ctrl+C to stop the server")
    print()
    
    try:
        # Run the application
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Shutting down LeaveXact Backend...")
        print("Goodbye! 👋")
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()