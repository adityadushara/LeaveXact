#!/usr/bin/env python3
"""
Quick Populate Leaves - Add 7 realistic leaves per employee
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from populate_realistic_leaves import populate_leaves

if __name__ == "__main__":
    print("Quick Populate: Adding 7 leave requests per employee...")
    populate_leaves(leaves_per_employee=7)
