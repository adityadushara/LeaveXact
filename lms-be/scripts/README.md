# Leave Management Scripts

Collection of utility scripts for managing leave data in the LeaveXact system.

## Available Scripts

### 1. Populate Realistic Leaves
**File:** `populate_realistic_leaves.py`

Adds realistic leave requests for all employees with proper audit logging and calendar entries.

**Usage:**
```bash
# Add 5 leave requests per employee (default)
python scripts/populate_realistic_leaves.py

# Add custom number of requests per employee
python scripts/populate_realistic_leaves.py --count 10
```

**Features:**
- Creates realistic leave requests with appropriate reasons
- Randomly assigns status (70% approved, 20% rejected, 10% pending)
- Updates leave balances for approved requests
- Creates audit log entries for all actions
- Generates calendar entries for approved leaves
- Considers employee gender for maternity/paternity leaves

### 2. Quick Populate Leaves
**File:** `quick_populate_leaves.py`

Quick script to add 3 leave requests per employee.

**Usage:**
```bash
python scripts/quick_populate_leaves.py
```

### 3. Clear All Leaves
**File:** `clear_all_leaves.py`

Clears all leave requests, calendar entries, audit logs, and resets employee leave balances to default values.

**Usage:**
```bash
python scripts/clear_all_leaves.py
```

**Warning:** This will delete ALL leave data. Use with caution!

## Leave Types

The scripts support all leave types:
- **Annual Leave** - Vacations, holidays, personal travel
- **Sick Leave** - Medical appointments, illness recovery
- **Personal Leave** - Personal matters, family commitments
- **Emergency Leave** - Urgent family or personal emergencies
- **Maternity Leave** - For female employees
- **Paternity Leave** - For male employees

## Default Leave Balances

**Female Employees:**
- Annual Leave: 20 days
- Sick Leave: 10 days
- Personal Leave: 5 days
- Emergency Leave: 5 days
- Maternity Leave: 90 days
- Paternity Leave: 0 days

**Male Employees:**
- Annual Leave: 20 days
- Sick Leave: 10 days
- Personal Leave: 5 days
- Emergency Leave: 5 days
- Maternity Leave: 0 days
- Paternity Leave: 15 days

## Notes

- All scripts automatically update audit logs
- Approved leaves update employee balances
- Calendar entries are created for approved leaves
- Scripts use realistic date ranges (past 90 days to future 60 days)
- Leave durations are weighted towards shorter leaves (1-3 days most common)
