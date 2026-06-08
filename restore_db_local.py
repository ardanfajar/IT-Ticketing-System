import psycopg2
import io
import re

db_url = "postgresql://postgres:lenovom100@127.0.0.1:5432/IT_Ticketing_System"
sql_file_path = "D:/Dicoding Belajar Py/IT Ticketing System/IT_Ticketing_System.sql"

print("Connecting to database...")
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

print("Dropping existing public schema objects for clean restore...")
cur.execute("DROP TRIGGER IF EXISTS ticket_changed_trigger ON public.tickets;")
cur.execute("DROP FUNCTION IF EXISTS public.notify_ticket_changes();")
cur.execute("DROP TABLE IF EXISTS public.tickets;")
cur.execute("DROP TABLE IF EXISTS public.users;")
cur.execute("DROP TYPE IF EXISTS public.ticket_status_enum;")

print("Reading SQL file...")
with open(sql_file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

sql_statements = []
copy_blocks = []

in_copy = False
copy_command = ""
copy_data = []

for line in lines:
    # Skip meta-commands
    if line.strip().startswith('\\restrict') or line.strip().startswith('\\unrestrict'):
        continue
        
    if in_copy:
        if line.strip() == '\\.':
            copy_blocks.append((copy_command, "".join(copy_data)))
            in_copy = False
            copy_command = ""
            copy_data = []
        else:
            copy_data.append(line)
    else:
        # Check for COPY command
        if re.match(r'^\s*COPY\s+[\w\.]+\s*\(.*?\)\s*FROM\s+stdin\s*;', line, re.IGNORECASE):
            in_copy = True
            copy_command = line
        else:
            sql_statements.append(line)

# Join and execute all SQL statements
sql_content = "".join(sql_statements).strip()
print("Executing schema and setup SQL...")
cur.execute(sql_content)

# Execute COPY blocks
for cmd, data in copy_blocks:
    print(f"Executing COPY data for: {cmd.strip()}")
    cur.copy_expert(cmd, io.StringIO(data))

print("Restore successful!")

# Verify row counts
cur.execute("SELECT COUNT(*) FROM public.users;")
print("Users count after restore:", cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM public.tickets;")
print("Tickets count after restore:", cur.fetchone()[0])

conn.close()
