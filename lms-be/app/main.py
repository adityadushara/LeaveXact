from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import engine, Base
from app.routes import auth_routes, employee_routes, leave_routes, admin_routes, log_routes, analytics_routes, holiday_routes
import logging

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LeaveXact API",
    description="A comprehensive leave management system API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request processing
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Process requests."""
    response = await call_next(request)
    return response

# Include routers
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(auth_routes.router, prefix="/auth", tags=["Authentication (Legacy)"])
app.include_router(employee_routes.router, prefix="/api/employees", tags=["Employees"])
app.include_router(employee_routes.router, prefix="/api/users", tags=["Users (Alias)"])  # Alias for frontend
app.include_router(employee_routes.router, prefix="/employees", tags=["Employees (Legacy)"])
app.include_router(leave_routes.router, prefix="/api/leaves", tags=["Leaves (Alias)"])  # Alias for frontend
app.include_router(leave_routes.router, prefix="/api/leave", tags=["Leave Requests"])
app.include_router(leave_routes.router, prefix="/leaves", tags=["Leave Requests (Legacy)"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])
app.include_router(admin_routes.router, prefix="/admin", tags=["Admin (Legacy)"])
app.include_router(log_routes.router, prefix="/api/logs", tags=["Audit Logs"])
app.include_router(log_routes.router, prefix="/logs", tags=["Audit Logs (Legacy)"])
app.include_router(analytics_routes.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(holiday_routes.router, prefix="/api", tags=["Holidays"])

@app.get("/")
async def root():
    return {"message": "LeaveXact API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    errors = []
    for error in exc.errors():
        error_dict = {
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type")
        }
        errors.append(error_dict)
    
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": errors}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logging.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

