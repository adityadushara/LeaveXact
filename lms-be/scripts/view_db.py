#!/usr/bin/env python3
"""
Script to view SQLite database contents
"""
import sqlite3
import json
from pathlib import Path

db_path = Path(__file__).parent / "data" / "leavexact.db"

if not db_path.exists():
    print(f"Database file not found at: {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("=" * 80)
print(f"DATABASE: {db_path}")
print("=" * 80)
print(f"\nTables found: {len(tables)}\n")

for table in tables:
    table_name = table[0]
    print(f"\n{'=' * 80}")
    print(f"TABLE: {table_name}")
    print('=' * 80)
    
    # Get table schema
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    
    print("\nColumns:")
    for col in columns:
        print(f"  - {col['name']} ({col['type']})")
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) as count FROM {table_name};")
    count = cursor.fetchone()['count']
    print(f"\nTotal rows: {count}")
    
    # Show first 5 rows
    if count > 0:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 5;")
        rows = cursor.fetchall()
        print(f"\nFirst {min(5, count)} rows:")
        for i, row in enumerate(rows, 1):
            print(f"\n  Row {i}:")
            for key in row.keys():
                value = row[key]
                if isinstance(value, str) and len(value) > 100:
                    value = value[:100] + "..."
                print(f"    {key}: {value}")

conn.close()
print("\n" + "=" * 80)
