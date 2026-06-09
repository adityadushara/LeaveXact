# LeaveXact - Leave Management System

A full-stack leave management system built for organizations to streamline employee leave tracking, approvals, and analytics. Features separate admin and employee portals with role-based access control.

## Tech Stack

### Backend (`lms-be`)
- **Framework:** FastAPI 0.109.2 + Uvicorn
- **Database:** SQLAlchemy 2.0 ORM (SQLite default, PostgreSQL supported)
- **Authentication:** JWT Bearer tokens (python-jose)
- **Validation:** Pydantic v2
- **Password Hashing:** passlib (pbkdf2_sha256)
- **Timezone:** IST (Asia/Kolkata)

### Frontend (`lms-fe`)
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Radix UI (shadcn/ui)
- **Charts:** Recharts
- **Forms:** react-hook-form + Zod validation
- **HTTP Client:** Axios
- **Icons:** Lucide React

## Features

### Admin Portal
- **Dashboard** – System overview with analytics and statistics
- **Employee Management** – Create, update, delete employees with department filtering
- **Leave Requests** – Approve/reject leave requests with comments
- **Calendar** – View who's on leave across the organization
- **Audit Logs** – Full activity trail with search and pagination
- **Policies** – Manage leave policies
- **Analytics** – Department-level and employee-level insights

### Employee Portal
- **Dashboard** – Personal leave balance overview
- **Apply for Leave** – Submit leave requests with date selection
- **My Requests** – Track leave history and status
- **Calendar** – Personal leave calendar with holiday awareness
- **Profile** – Update personal information, change password/email

### Core Capabilities
- Role-based access control (Admin / Employee)
- 6 leave types: Annual (20), Sick (10), Personal (5), Emergency (5), Maternity (90), Paternity (15)
- Gender-aware leave allocation (maternity/paternity)
- Auto-expiration of old pending leave requests
- Gujarat public holidays integration (2020–2030)
- Full audit trail for all actions
- Session management with expiry handling

## Project Structure

```
Leave Management System/
├── lms-be/                    # Backend (FastAPI)
│   ├── app/
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth_routes.py
│   │   │   ├── admin_routes.py
│   │   │   ├── employee_routes.py
│   │   │   ├── leave_routes.py
│   │   │   ├── analytics_routes.py
│   │   │   ├── log_routes.py
│   │   │   └── holiday_routes.py
│   │   ├── main.py            # App entry point
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── crud.py            # Database operations
│   │   ├── auth.py            # Authentication logic
│   │   ├── config.py          # App configuration
│   │   ├── database.py        # DB connection setup
│   │   ├── holidays.py        # Holiday data
│   │   └── utils.py           # Utility functions
│   ├── data/                  # SQLite database storage
│   ├── scripts/               # DB management scripts
│   ├── requirements.txt
│   ├── run.py
│   └── .env
├── lms-fe/                    # Frontend (Next.js)
│   ├── app/
│   │   ├── admin/             # Admin portal pages
│   │   ├── employee/          # Employee portal pages
│   │   └── api/               # Next.js API proxy routes
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utilities and helpers
│   ├── package.json
│   └── .env
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd lms-be

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with your settings (SECRET_KEY, DATABASE_URL, etc.)

# Run the server
python run.py
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### Frontend Setup

```bash
cd lms-fe

# Install dependencies
npm install

# Configure environment
# Edit .env file (NEXT_PUBLIC_BACKEND_URL=http://localhost:8000)

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## API Endpoints

| Prefix | Description | Access |
|--------|-------------|--------|
| `/api/auth` | Login, register, profile, password change | All users |
| `/api/employees` | Employee CRUD operations | Admin only |
| `/api/leave` | Submit, update, delete leave requests | Authenticated |
| `/api/admin` | Approve/reject leaves, admin calendar | Admin only |
| `/api/logs` | Audit logs with pagination | Admin only |
| `/api/analytics` | System and department analytics | Admin only |
| `/api/holidays` | Gujarat public holidays | Public |

## Environment Variables

### Backend (`lms-be/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./data/leavexact.db` |
| `SECRET_KEY` | JWT signing key | – |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `1440` (24hrs) |
| `ALLOWED_ORIGINS` | CORS origins | `["http://localhost:3000"]` |

### Frontend (`lms-fe/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:8000` |

## Database Models

- **User** – Employee/admin with leave balances and role
- **LeaveRequest** – Leave application with status tracking
- **AuditLog** – System activity log
- **LeaveCalendar** – Individual leave day entries for calendar views

## Scripts

The `lms-be/scripts/` directory contains helper scripts:
- `populate_realistic_leaves.py` – Generate sample leave data
- `generate_realistic_balances.py` – Set realistic leave balances
- `reset_balances.py` – Reset all leave balances to defaults
- `clear_all_leaves.py` – Remove all leave records
- `view_db.py` – Inspect database contents

## License

This project is for internal/organizational use.
