const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool } = require('./db');

async function seed() {
  console.log('Starting database seeding...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Run schema
    console.log('Executing schema...');
    await client.query(schemaSql);

    // Hash passwords
    console.log('Hashing passwords...');
    const hashedPass = await bcrypt.hash('password123', 10);

    // Seed users
    console.log('Inserting seed users...');
    const users = [
      { username: 'andri_admin', name: 'Andri Hermawan', role: 'admin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', completed_count: 14 },
      { username: 'budi_support', name: 'Budi Santoso', role: 'admin', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80', completed_count: 9 },
      { username: 'citra_it', name: 'Citra Lestari', role: 'admin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80', completed_count: 18 }
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (username, password_hash, name, role, avatar, completed_count) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [u.username, hashedPass, u.name, u.role, u.avatar, u.completed_count]
      );
    }

    // Seed tickets
    console.log('Inserting seed tickets...');
    const tickets = [
      { ticket_number: 'TCK-2026-001', source: 'Bot Telegram', message: 'Koneksi internet di Ruang Server Lantai 2 terputus secara mendadak.', status: 'selesai', completed_by: 'Citra Lestari', completed_at: '2026-06-07 14:30', created_at: '2026-06-07 10:00', updated_at: '2026-06-07 14:30' },
      { ticket_number: 'TCK-2026-002', source: 'Email Support', message: 'Aplikasi CRM internal melambat dan sering mengalami timeout saat query.', status: 'diproses', completed_by: null, completed_at: null, created_at: '2026-06-07 11:15', updated_at: '2026-06-07 11:30' },
      { ticket_number: 'TCK-2026-003', source: 'Web Portal', message: 'Gagal melakukan cetak slip gaji, printer IP 192.168.1.150 offline.', status: 'belum_dikerjakan', completed_by: null, completed_at: null, created_at: '2026-06-07 13:02', updated_at: '2026-06-07 13:02' },
      { ticket_number: 'TCK-2026-004', source: 'Bot Telegram', message: 'Pemberitahuan: Kapasitas storage server backup tersisa 5%.', status: 'diproses', completed_by: null, completed_at: null, created_at: '2026-06-07 13:45', updated_at: '2026-06-07 14:00' },
      { ticket_number: 'TCK-2026-005', source: 'Web Portal', message: 'Permintaan reset password akun email marketing perusahaan.', status: 'selesai', completed_by: 'Andri Hermawan', completed_at: '2026-06-07 15:10', created_at: '2026-06-07 14:20', updated_at: '2026-06-07 15:10' },
      { ticket_number: 'TCK-2026-006', source: 'API System', message: 'Gagal singkronisasi data transaksi dari POS cabang Bandung.', status: 'belum_dikerjakan', completed_by: null, completed_at: null, created_at: '2026-06-08 00:30', updated_at: '2026-06-08 00:30' },
      { ticket_number: 'TCK-2026-007', source: 'Email Support', message: 'Instalasi lisensi Microsoft Office 365 baru untuk staff Keuangan.', status: 'ditolak', completed_by: 'Budi Santoso', completed_at: '2026-06-07 16:00', created_at: '2026-06-07 15:00', updated_at: '2026-06-07 16:00' }
    ];

    for (const t of tickets) {
      await client.query(
        `INSERT INTO tickets (ticket_number, source, message, status, completed_by, completed_at, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [t.ticket_number, t.source, t.message, t.status, t.completed_by, t.completed_at, t.created_at, t.updated_at]
      );
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
