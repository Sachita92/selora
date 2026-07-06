import os
import re
import sys
import psycopg2

from dotenv import load_dotenv
load_dotenv(dotenv_path=r"C:\Users\sigde\OneDrive\Desktop\AI Agent\selora\backend\.env")

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("ERROR: DATABASE_URL not found in backend/.env")
    sys.exit(1)

# Regex to parse connection URL safely
match = re.match(r"postgresql://([^:]+):(.*)@([^:]+):(\d+)/(.+)", db_url)
if not match:
    print("ERROR: Could not parse DATABASE_URL")
    sys.exit(1)

user, password, host, port, dbname = match.groups()

# Try both standard and pooler ports
ports_to_try = [6543, 5432]
success = False

for p in ports_to_try:
    print(f"Connecting to Supabase PostgreSQL database on port {p} with sslmode=require...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=str(p),
            user=user,
            password=password,
            database=dbname,
            sslmode='require',
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Adding wallet_address column to users table...")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;")
        print("Migration successful! wallet_address column verified/added.")
        cur.close()
        conn.close()
        success = True
        break
    except Exception as e:
        print(f"Failed on port {p}: {e}")

if not success:
    print("ERROR: Migration failed on all ports.")
    sys.exit(1)
