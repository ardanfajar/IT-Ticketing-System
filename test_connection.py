import psycopg2
import os
from dotenv import load_dotenv

# Load env from backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
load_dotenv(dotenv_path)

db_url = os.getenv('DATABASE_URL')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '5432')
db_user = os.getenv('DB_USER', 'postgres')
db_password = os.getenv('DB_PASSWORD', 'lenovom100')
db_name = os.getenv('DB_NAME', 'IT_Ticketing_System')

print("=== PostgreSQL Connection Test ===")
print(f"Target Database URL: {db_url}")
print(f"Host: {db_host}")
print(f"Port: {db_port}")
print(f"User: {db_user}")
print(f"Database: {db_name}")

try:
    print("\nAttempting to connect...")
    # Try connecting using DATABASE_URL if available, otherwise individual parameters
    if db_url:
        conn = psycopg2.connect(db_url)
    else:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name
        )
    
    cur = conn.cursor()
    cur.execute("SELECT version();")
    db_version = cur.fetchone()[0]
    print(f"SUCCESS: Connection successful!")
    print(f"PostgreSQL Version: {db_version}")
    
    # Query table rows to verify data
    print("\n--- Verifying Tables and Data ---")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = [t[0] for t in cur.fetchall()]
    print(f"Found Tables in public schema: {tables}")
    
    for t in ['users', 'tickets']:
        if t in tables:
            cur.execute(f'SELECT COUNT(*) FROM "{t}"')
            rows = cur.fetchone()[0]
            print(f"  - Table '{t}' contains {rows} rows.")
            
    conn.close()
    print("\n=== Connection Test Completed Successfully ===")
except Exception as e:
    print(f"\nERROR: Connection failed!")
    print(f"Error details: {e}")
