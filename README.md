# IT Ticketing System

Dokumentasi ini menjelaskan cara menyiapkan dan menjalankan proyek IT Ticketing System yang terdiri dari backend Express + PostgreSQL dan frontend React + Vite.

## Struktur Projek

- `backend/` - server API Node.js menggunakan Express, Socket.IO, JWT, dan PostgreSQL
- `frontend/` - aplikasi web React + TypeScript + Vite
- `backend/schema.sql` - definisi tabel `users` dan `tickets` beserta trigger `notify_ticket_changes`
- `backend/seed.js` - skrip untuk menambahkan data awal ke database
- `IT_Ticketing_System.sql` - dump SQL untuk restore database jika diperlukan
- `restore_db_local.py` - utilitas Python untuk memulihkan database lokal
- `test_connection.py` - skrip sederhana untuk menguji koneksi PostgreSQL

## Prasyarat

- Node.js 18+ dan npm
- PostgreSQL
- Git (opsional)

## Setup Database

1. Buat database PostgreSQL baru.
2. Tentukan koneksi dengan environment variable `DATABASE_URL`.
   Contoh format:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/it_ticketing_db
JWT_SECRET=supersecretjwtkeyforticketing2026
PORT=5000
```

3. Jalankan file SQL untuk membuat schema:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

4. (Opsional) Isi data awal dengan seed:

```bash
cd backend
npm install
npm run seed
```

## Setup Backend

1. Masuk ke folder backend:

```bash
cd backend
```

2. Install dependency:

```bash
npm install
```

3. Jalankan server:

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000` secara default.

## Setup Frontend

1. Masuk ke folder frontend:

```bash
cd frontend
```

2. Install dependency:

```bash
npm install
```

3. Jalankan aplikasi:

```bash
npm run dev
```

Akses aplikasi di `http://localhost:5173`.

## Perintah Penting

### Backend
- `npm start` - menjalankan `server.js` secara normal
- `npm run dev` - menjalankan server dengan mode watch
- `npm run seed` - menjalankan seeding data awal

### Frontend
- `npm run dev` - menjalankan Vite development server
- `npm run build` - membangun aplikasi untuk produksi
- `npm run preview` - preview hasil build
- `npm run lint` - memeriksa kode dengan ESLint

## Informasi Tambahan

- Backend menggunakan `DATABASE_URL` untuk koneksi PostgreSQL.
- JWT secret ditentukan dari environment variable `JWT_SECRET`.
- API utama yang tersedia:
  - `POST /api/login` - otentikasi pengguna
  - `GET /api/users/me` - verifikasi sesi JWT
  - `GET /api/tickets` - daftar tiket
  - `POST /api/tickets` - membuat tiket baru
  - `PATCH /api/tickets/:id` - memperbarui status tiket (diperlukan JWT)

## Catatan

- Jika ingin menggunakan data dump SQL, gunakan `IT_Ticketing_System.sql` untuk memulihkan tabel dan data.
- Pastikan frontend dan backend berjalan pada origin yang diizinkan oleh CORS (`localhost:5173`, `localhost:3000`).
- Jika terjadi masalah koneksi, cek kembali nilai `DATABASE_URL` dan status layanan PostgreSQL.
