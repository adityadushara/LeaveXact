# LeaveXact API

> Leave Management System

## Overview

LeaveXact is a comprehensive leave management system built with FastAPI and SQLAlchemy. It provides a complete solution for managing employee leave requests, approvals, and tracking with role-based access control.

## Features

### Core Functionality
- **Authentication & Authorization**
  - JWT-based authentication with secure token management
  - Role-based access control (Admin & Employee)
  - Password change and email update functionality
  - Profile management for all users

- **Leave Management**
  - Submit, update, and delete leave requests
  - Multiple leave types: Annual, Sick, Personal, Emergency, Maternity, Paternity
  - Real-time leave balance tracking
  - Automatic leave balance deduction on approval
  - Gender-based leave allocation (Maternity for females, Paternity for males)
  - Automatic expiration of old pending requests

- **Admin Operations**
  - Employee management (CRUD operations)
  - Leave approval/rejection workflow with comments
  - Department-wise employee filtering
  - Admin calendar showing all employees on leave
  - Bulk operations and analytics

- **Calendar & Holidays**
  - Personal leave calendar for employees
  - Admin calendar showing team availability
  - Gujarat public holidays (2020-2030) integration
  - Date range filtering and holiday inclusion

- **Analytics & Reporting**
  - System-wide statistics and summaries
  - Employee-specific analytics (approval rates, balances)
  - Department-wise analytics
  - Leave duration tracking by status

- **Audit & Compliance**
  - Comprehensive audit logging for all actions
  - Searchable and filterable audit logs
  - User activity tracking
  - Detailed action history

## Technology Stack

- **Backend Framework:** FastAPI
- **Database:** SQLite (default) / PostgreSQL (optional)
- **ORM:** SQLAlchemy
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Passlib with bcrypt
- **API Documentation:** Swagger UI / ReDoc
- **Containerization:** Docker & Docker Compose

## Project Structure

```
leavexact/
├── app/
│   ├── routes/
│   │   ├── auth_routes.py       # Authentication endpoints
│   │   ├── employee_routes.py   # Employee management
│   │   ├── leave_routes.py      # Leave request management
│   │   ├── admin_routes.py      # Admin operations
│   │   ├── analytics_routes.py  # Analytics & reporting
│   │   └── log_routes.py        # Audit logs
│   ├── main.py                  # Application entry point
│   ├── models.py                # Database models
│   ├── schemas.py               # Pydantic schemas
│   ├── database.py              # Database configuration
│   ├── auth.py                  # Authentication utilities
│   ├── crud.py                  # Database operations
│   └── config.py                # Application settings
├── scripts/
│   ├── seed_starter_data.py     # Initialize database with sample data
│   ├── backup.bat/.sh           # Database backup scripts
│   ├── health_check.py          # Health monitoring
│   └── maintenance.py           # Maintenance utilities
├── data/
│   └── leavexact.db             # SQLite database
├── docker-compose.yml           # Docker compose configuration
├── Dockerfile                   # Docker image definition
├── run.py                       # Development server runner
└── requirements.txt             # Python dependencies
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Setup Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd leavexact
```

2. Create and activate virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database:
```bash
python scripts/seed_starter_data.py
```

5. Run the application:
```bash
python run.py
```

The API will be available at: http://localhost:8000  
API Documentation: http://localhost:8000/docs

## Docker Deployment

### Local Development
```bash
docker-compose up --build
```

### Production
```bash
docker build -f Dockerfile.production -t leavexact-backend .
docker run -p 8000:8000 -e SECRET_KEY=your-secret-key leavexact-backend
```

Access the application:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Cloud Deployment

### Supported Platforms
- Render
- Railway
- Fly.io
- Heroku
- AWS / GCP / Azure

### Quick Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Render auto-detects configuration and deploys
4. Add environment variables in Render dashboard

**Important:** Ensure Python 3.11 is used (not 3.13) to avoid build issues.

For detailed deployment instructions, see deployment documentation or contact your DevOps team.

## Configuration

Environment variables can be set in a `.env` file:

```env
DATABASE_URL=sqlite:///./data/leavexact.db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=true
ALLOWED_ORIGINS=*
```

## Default Credentials

After running `seed_starter_data.py`:

**Admin Account:**
- Email: `admin@leavexact.com`
- Password: `Admin123!`

**Employee Accounts:**
- Email: Any employee email from seeded data
- Password: `Password123!`

> ⚠️ **IMPORTANT:** Change these credentials in production!

## API Endpoints

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API documentation with request/response examples.

Main endpoint groups:
- `/api/auth/*` - Authentication & user profile management
- `/api/employees/*` - Employee management (Admin only)
- `/api/leave/*` - Leave request operations & calendar
- `/api/admin/*` - Admin operations & approvals
- `/api/analytics/*` - Analytics & reporting (Admin only)
- `/api/logs/*` - Audit logs (Admin only)
- `/api/holidays` - Public holidays for Gujarat

**Quick Links:**
- Interactive API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## Leave Types

1. **Annual Leave** (20 days default)
2. **Sick Leave** (10 days default)
3. **Personal Leave** (5 days default)
4. **Emergency Leave** (5 days default)
5. **Maternity Leave** (90 days for female employees)
6. **Paternity Leave** (15 days for male employees)

## Leave Workflow

1. Employee submits leave request
2. System validates leave balance
3. Request enters PENDING status
4. Admin reviews and approves/rejects
5. On approval: Leave balance is deducted
6. On rejection: No balance change
7. Old pending requests auto-expire after start date passes

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Token expiration (24 hours default)
- CORS protection
- Input validation with Pydantic
- SQL injection protection via SQLAlchemy ORM

## Maintenance

### Database Backup
```bash
# Windows
scripts\backup.bat

# Linux/Mac
bash scripts/backup.sh
```

### Health Check
```bash
python scripts/health_check.py
```

### View System Summary
```bash
python scripts/show_complete_summary.py
```

### Expire Old Leaves
Automatic on each request, or manually via API:
```
POST /api/analytics/expire-old-leaves
```

## Troubleshooting

### Database locked error
- Close all connections to the database
- Restart the application

### Authentication errors
- Verify token is included in Authorization header
- Format: `Bearer <token>`
- Check token expiration

### Permission denied
- Verify user role (admin vs employee)
- Check endpoint access requirements

### Leave balance insufficient
- Check current balance via `/api/auth/me`
- Verify leave type and duration

## Development

1. Run in development mode:
```bash
python run.py
```

2. Access interactive API docs:
```
http://localhost:8000/docs
```

3. Run with auto-reload:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. Check diagnostics:
```bash
python check_admin_role.py
```

## Testing

### Using Interactive API Docs

1. Navigate to http://localhost:8000/docs
2. Click on `/api/auth/login` endpoint
3. Click "Try it out" and enter credentials
4. Execute to get your JWT token
5. Click the "Authorize" button at the top
6. Enter: `Bearer <your-token>`
7. Now you can test any endpoint

### Using cURL

```bash
# Login
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leavexact.com","password":"Admin123!"}'

# Use the token
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer <your-token>"
```

### Using Postman

1. Import the API endpoints from `/docs` (OpenAPI spec)
2. Set up environment variables for base URL and token
3. Use collection runner for automated testing

## Audit Logging

All significant actions are logged:
- User login/logout
- Leave request creation/update/deletion
- Leave approval/rejection
- Employee creation/update/deletion
- Profile changes
- Password changes

Access logs via: `GET /api/logs/`

## Analytics

Available analytics endpoints:
- System summary (total employees, requests, etc.)
- Employee analytics (approval rates, balances)
- Department analytics (team statistics)

## API Documentation

Complete API documentation with examples is available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

The documentation includes:
- All available endpoints with request/response examples
- Authentication flow and token management
- Query parameters and filtering options
- Error codes and handling
- Common use cases and workflows

## Support

For issues, questions, or contributions:
1. Check the interactive API documentation at `/docs`
2. Review the [API_DOCUMENTATION.md](API_DOCUMENTATION.md) file
3. Check application logs for errors
4. Review audit logs for user actions
5. Contact system administrator

## Version

1.0.0

## Last Updated

October 2025
