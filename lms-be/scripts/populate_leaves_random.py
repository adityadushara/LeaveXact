"""
Script to randomly populate leave requests with interleaved employee submissions and admin actions.
Simulates realistic usage patterns.
"""
import requests
import random
from datetime import datetime, timedelta
from typing import List, Dict
import time

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Employee credentials with gender
EMPLOYEES = [
    {"email": "sarah@leavexact.com", "name": "Sarah Johnson", "gender": "female"},
    {"email": "michael@leavexact.com", "name": "Michael Chen", "gender": "male"},
    {"email": "jennifer@leavexact.com", "name": "Jennifer Davis", "gender": "female"},
    {"email": "jessica@leavexact.com", "name": "Jessica Taylor", "gender": "female"},
    {"email": "emily@leavexact.com", "name": "Emily Rodriguez", "gender": "female"},
    {"email": "kevin@leavexact.com", "name": "Kevin Lee", "gender": "male"},
    {"email": "daniel@leavexact.com", "name": "Daniel Kim", "gender": "male"},
    {"email": "david@leavexact.com", "name": "David Thompson", "gender": "male"},
    {"email": "maria@leavexact.com", "name": "Maria Garcia", "gender": "female"},
    {"email": "amanda@leavexact.com", "name": "Amanda White", "gender": "female"},
    {"email": "lisa@leavexact.com", "name": "Lisa Wang", "gender": "female"},
    {"email": "james@leavexact.com", "name": "James Wilson", "gender": "male"},
    {"email": "thomas@leavexact.com", "name": "Thomas Anderson", "gender": "male"},
    {"email": "anna@leavexact.com", "name": "Anna Martinez", "gender": "female"},
    {"email": "robert@leavexact.com", "name": "Robert Brown", "gender": "male"},
]

EMPLOYEE_PASSWORD = "employee@123"
ADMIN_EMAIL = "admin@leavexact.com"
ADMIN_PASSWORD = "admin@123"

# Leave balances (max days available)
LEAVE_BALANCES = {
    "annual": 20,
    "sick": 10,
    "personal": 5,
    "emergency": 5,
    "maternity": 90,  # females only
    "paternity": 15,  # males only
}

# Leave types
LEAVE_TYPES = ["annual", "sick", "personal", "emergency", "maternity", "paternity"]

# Reasons for leave
LEAVE_REASONS = [
    "Family vacation",
    "Medical appointment",
    "Personal matters",
    "Emergency situation",
    "Wedding ceremony",
    "Home renovation",
    "Attending conference",
    "Child care",
    "Medical treatment",
    "Rest and recovery",
    "Family event",
    "Moving house",
    "Court appearance",
    "Religious observance",
    "Mental health day",
    "Visiting relatives",
    "School event",
    "Doctor's appointment",
    "Dental checkup",
    "Annual health checkup",
]

# Admin comments
APPROVAL_COMMENTS = [
    "Approved",
    "Enjoy your time off",
    "Approved as requested",
    "Have a good break",
    "Approved - please ensure handover",
]

REJECTION_COMMENTS = [
    "Insufficient staffing during this period",
    "Please reschedule to a different date",
    "Critical project deadline - cannot approve",
    "Too many team members on leave",
    "Please coordinate with your team first",
]


def login(email: str, password: str) -> str:
    """Login and return access token."""
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"    ✗ Login failed: {str(e)}")
        return None


def generate_random_dates(leave_type: str) -> tuple:
    """Generate random start and end dates for leave request based on leave type."""
    # Start date between 1-90 days from now
    days_ahead = random.randint(1, 90)
    start_date = datetime.now() + timedelta(days=days_ahead)
    
    # Duration based on leave type and balance
    max_balance = LEAVE_BALANCES.get(leave_type, 20)
    
    # Adjust duration based on leave type
    if leave_type in ["maternity", "paternity"]:
        # Longer leaves for maternity/paternity
        duration = random.randint(7, min(30, max_balance))
    elif leave_type == "sick":
        # Shorter sick leaves
        duration = random.randint(1, min(5, max_balance))
    elif leave_type in ["personal", "emergency"]:
        # Short personal/emergency leaves
        duration = random.randint(1, min(3, max_balance))
    else:  # annual
        # Moderate annual leaves
        duration = random.randint(2, min(10, max_balance))
    
    end_date = start_date + timedelta(days=duration - 1)  # -1 because start day counts
    
    return start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"), duration


def submit_leave_request(token: str, employee_name: str, gender: str = None, employee_balances: dict = None) -> Dict:
    """Submit a random leave request respecting available balances."""
    # Filter leave types based on gender and available balance
    available_types = []
    
    # Check each leave type
    for leave_type in ["annual", "sick", "personal", "emergency"]:
        if employee_balances and employee_balances.get(leave_type, 0) > 0:
            available_types.append(leave_type)
    
    # Add gender-specific leaves if available
    if gender == "female" and employee_balances and employee_balances.get("maternity", 0) > 0:
        available_types.append("maternity")
    elif gender == "male" and employee_balances and employee_balances.get("paternity", 0) > 0:
        available_types.append("paternity")
    
    # If no balance available, skip
    if not available_types:
        print(f"    ⚠ No leave balance available")
        return None
    
    leave_type = random.choice(available_types)
    start_date, end_date, duration = generate_random_dates(leave_type)
    reason = random.choice(LEAVE_REASONS)
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "leave_type": leave_type,
        "start_date": start_date,
        "end_date": end_date,
        "reason": reason
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/leaves/",
            json=payload,
            headers=headers
        )
        response.raise_for_status()
        leave_data = response.json()
        print(f"    ✓ Submitted {leave_type} leave from {start_date} to {end_date}")
        return leave_data
    except requests.exceptions.HTTPError as e:
        error_detail = "Unknown error"
        try:
            error_detail = response.json().get("detail", str(e))
        except:
            error_detail = str(e)
        print(f"    ✗ Failed to submit {leave_type} leave: {error_detail}")
        return None
    except Exception as e:
        print(f"    ✗ Failed to submit: {str(e)}")
        return None


def get_pending_leave_requests(token: str) -> List[Dict]:
    """Get all pending leave requests (admin only)."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{API_BASE}/leaves/?status=pending&limit=1000", headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"    ✗ Failed to get requests: {str(e)}")
        return []


def process_leave_request(token: str, leave_id: int, status: str, employee_name: str) -> bool:
    """Approve, reject, or leave pending a leave request."""
    if status == "pending":
        return True  # Don't make API call for pending
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Use admin endpoints for approve/reject
    if status == "approved":
        endpoint = f"{API_BASE}/admin/leaves/{leave_id}/approve"
        comment = random.choice(APPROVAL_COMMENTS)
    else:  # rejected
        endpoint = f"{API_BASE}/admin/leaves/{leave_id}/reject"
        comment = random.choice(REJECTION_COMMENTS)
    
    payload = {"admin_comment": comment}
    
    try:
        response = requests.put(endpoint, json=payload, headers=headers)
        response.raise_for_status()
        status_emoji = "✓" if status == "approved" else "✗"
        print(f"    {status_emoji} Leave #{leave_id} ({employee_name}): {status.upper()}")
        return True
    except Exception as e:
        print(f"    ✗ Failed to process leave #{leave_id}: {str(e)}")
        return False


def main():
    print("=" * 80)
    print("RANDOM LEAVE REQUEST SIMULATION")
    print("=" * 80)
    print("Simulating realistic usage with interleaved employee and admin actions")
    print("Each employee will submit 4 random leave requests")
    print("Admin will randomly approve/reject/leave pending throughout the process")
    print("Leave requests respect available balances")
    print()
    
    # Track statistics
    stats = {
        "submitted": 0,
        "approved": 0,
        "rejected": 0,
        "pending": 0,
        "failed": 0,
        "skipped_no_balance": 0
    }
    
    # Track employee leave balances (starts with default balances)
    employee_balances = {}
    for employee in EMPLOYEES:
        employee_balances[employee["email"]] = {
            "annual": LEAVE_BALANCES["annual"],
            "sick": LEAVE_BALANCES["sick"],
            "personal": LEAVE_BALANCES["personal"],
            "emergency": LEAVE_BALANCES["emergency"],
            "maternity": LEAVE_BALANCES["maternity"] if employee["gender"] == "female" else 0,
            "paternity": LEAVE_BALANCES["paternity"] if employee["gender"] == "male" else 0,
        }
    
    # Create a list of all tasks (4 requests per employee)
    employee_tasks = []
    for employee in EMPLOYEES:
        for i in range(4):
            employee_tasks.append(employee.copy())
    
    # Shuffle to randomize order
    random.shuffle(employee_tasks)
    
    # Track employee tokens to avoid re-login
    employee_tokens = {}
    admin_token = None
    
    # Process tasks in batches with random admin actions in between
    batch_size = random.randint(3, 8)  # Random batch size
    
    for i, employee in enumerate(employee_tasks):
        # Submit leave request
        if employee["email"] not in employee_tokens:
            print(f"\n🔐 Logging in: {employee['name']}")
            token = login(employee["email"], EMPLOYEE_PASSWORD)
            if token:
                employee_tokens[employee["email"]] = token
            else:
                stats["failed"] += 1
                continue
        
        token = employee_tokens[employee["email"]]
        print(f"📝 {employee['name']} submitting leave request...")
        
        # Get current balances for this employee
        current_balances = employee_balances[employee["email"]]
        
        leave_data = submit_leave_request(token, employee["name"], employee.get("gender"), current_balances)
        if leave_data:
            stats["submitted"] += 1
            # Note: Balance will only be deducted when admin approves
        elif leave_data is None:
            stats["skipped_no_balance"] += 1
        else:
            stats["failed"] += 1
        
        # Randomly decide if admin should take action now
        should_admin_act = random.random() < 0.4  # 40% chance
        
        # Or if we've reached batch size
        if (i + 1) % batch_size == 0:
            should_admin_act = True
            batch_size = random.randint(3, 8)  # New random batch size
        
        if should_admin_act:
            # Admin takes action on some pending requests
            if not admin_token:
                print(f"\n👨‍💼 Admin logging in...")
                admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
            
            if admin_token:
                pending_requests = get_pending_leave_requests(admin_token)
                
                if pending_requests:
                    # Process random number of requests (1 to all pending)
                    num_to_process = random.randint(1, min(len(pending_requests), 5))
                    requests_to_process = random.sample(pending_requests, num_to_process)
                    
                    print(f"\n⚖️  Admin processing {num_to_process} pending requests...")
                    
                    for request in requests_to_process:
                        # Random decision: 40% approve, 25% reject, 35% leave pending
                        rand = random.random()
                        if rand < 0.4:
                            status = "approved"
                        elif rand < 0.65:
                            status = "rejected"
                        else:
                            status = "pending"
                        
                        if status != "pending":
                            emp_name = request.get("employee", {}).get("name", "Unknown")
                            if process_leave_request(admin_token, request["id"], status, emp_name):
                                stats[status] += 1
                            else:
                                stats["failed"] += 1
                        else:
                            stats["pending"] += 1
                    
                    # Small delay to simulate realistic timing
                    time.sleep(0.5)
        
        # Small delay between submissions
        time.sleep(0.2)
    
    # Final admin sweep - process remaining pending requests, keep only 4 pending
    print(f"\n\n👨‍💼 Admin final review of remaining pending requests...")
    if not admin_token:
        admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    
    if admin_token:
        pending_requests = get_pending_leave_requests(admin_token)
        
        if pending_requests:
            print(f"    Found {len(pending_requests)} pending requests")
            
            # Randomly select 4 to keep pending
            num_to_keep_pending = min(4, len(pending_requests))
            requests_to_keep_pending = random.sample(pending_requests, num_to_keep_pending)
            keep_pending_ids = {req["id"] for req in requests_to_keep_pending}
            
            print(f"    Keeping {num_to_keep_pending} requests pending, processing the rest...")
            
            for request in pending_requests:
                if request["id"] in keep_pending_ids:
                    # Keep this one pending
                    stats["pending"] += 1
                    emp_name = request.get("employee", {}).get("name", "Unknown")
                    print(f"    ⏳ Leave #{request['id']} ({emp_name}): KEEPING PENDING")
                else:
                    # Process this one - randomly approve or reject
                    status = "approved" if random.random() < 0.6 else "rejected"
                    emp_name = request.get("employee", {}).get("name", "Unknown")
                    if process_leave_request(admin_token, request["id"], status, emp_name):
                        stats[status] += 1
                    else:
                        stats["failed"] += 1
    
    # Get final count of pending requests
    if admin_token:
        final_pending = get_pending_leave_requests(admin_token)
        actual_pending = len(final_pending)
    else:
        actual_pending = stats['pending']
    
    # Print summary
    print()
    print("=" * 80)
    print("SIMULATION COMPLETE")
    print("=" * 80)
    print(f"Total Requests Submitted:  {stats['submitted']}")
    print(f"Approved:                  {stats['approved']}")
    print(f"Rejected:                  {stats['rejected']}")
    print(f"Still Pending:             {actual_pending}")
    print(f"Skipped (No Balance):      {stats['skipped_no_balance']}")
    print(f"Failed Operations:         {stats['failed']}")
    print("=" * 80)
    
    # Calculate percentages
    total_processed = stats['approved'] + stats['rejected'] + actual_pending
    if total_processed > 0:
        print(f"\nApproval Rate:  {stats['approved']/total_processed*100:.1f}%")
        print(f"Rejection Rate: {stats['rejected']/total_processed*100:.1f}%")
        print(f"Pending Rate:   {actual_pending/total_processed*100:.1f}%")
        print()
        print(f"✓ {actual_pending} leave requests are awaiting admin review")


if __name__ == "__main__":
    main()
