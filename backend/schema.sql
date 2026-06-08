-- Hapus tabel jika sudah ada (untuk keperluan inisialisasi bersih)
DROP TRIGGER IF EXISTS ticket_changed_trigger ON tickets;
DROP FUNCTION IF EXISTS notify_ticket_changes();
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

-- Tabel Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    avatar TEXT,
    completed_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(30) UNIQUE NOT NULL,
    source VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('belum_dikerjakan', 'diproses', 'selesai', 'ditolak')) DEFAULT 'belum_dikerjakan',
    completed_by VARCHAR(100),
    completed_at VARCHAR(30),
    created_at VARCHAR(30) NOT NULL,
    updated_at VARCHAR(30) NOT NULL
);

-- Fungsi trigger notify_ticket_changes
CREATE OR REPLACE FUNCTION notify_ticket_changes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('ticket_update', json_build_object(
        'operation', TG_OP,
        'ticket', row_to_json(NEW)
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk tabel tickets
CREATE TRIGGER ticket_changed_trigger
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION notify_ticket_changes();
