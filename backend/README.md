# IT Ticketing System

Aplikasi dashboard manajemen tiket IT internal berbasis web fullstack. Dibangun dengan arsitektur monorepo yang memisahkan frontend dan backend dalam satu repository. Petugas IT Support dapat menerima, memproses, dan menyelesaikan tiket masalah yang masuk melalui dashboard terpusat.

## Fitur Utama

- **Autentikasi JWT** — Login aman dengan token JWT (masa berlaku 8 jam) dan proteksi endpoint API.
- **Manajemen Tiket** — Buat, lihat, filter, cari, dan perbarui status tiket (`belum_dikerjakan`, `diproses`, `selesai`, `ditolak`).
- **Dashboard Statistik** — Ringkasan jumlah tiket per status, progress bar visual, dan widget analitik performa petugas.
- **Leaderboard Petugas** — Peringkat petugas berdasarkan jumlah tiket yang diselesaikan, diambil langsung dari database.
- **Ekspor Laporan PDF** — Generate laporan kinerja petugas dalam format PDF (via jsPDF + AutoTable) langsung dari browser.
- **Dark Mode** — Toggle tema gelap/terang dengan persistensi ke `localStorage`.
- **Optimistic UI Update** — Perubahan status tiket langsung terlihat di UI sebelum respons server, dengan mekanisme rollback jika gagal.
- **Deployment Vercel** — Konfigurasi siap deploy ke Vercel dengan serverless function untuk backend API.

## Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **React** | 19.x | Library UI komponen |
| **TypeScript** | 6.x | Type-safe JavaScript |
| **Vite** | 8.x | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **Lucide React** | 1.17 | Icon library |
| **PostCSS** | 8.x | CSS processor (pipeline Tailwind) |
| **ESLint** | 10.x | Linter kode |
| **jsPDF** | 2.5 | Generate PDF di browser (CDN) |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Node.js** | 18+ | Runtime JavaScript server-side |
| **Express** | 4.19 | Web framework HTTP API |
| **PostgreSQL** | - | Database relasional utama |
| **pg (node-postgres)** | 8.11 | Driver PostgreSQL untuk Node.js |
| **JSON Web Token** | 9.x | Autentikasi token stateless |
| **bcrypt** | 5.x | Hashing password |
| **cors** | 2.8 | Middleware Cross-Origin |
| **dotenv** | 16.x | Manajemen environment variable |

### Deployment & Tooling

| Teknologi | Fungsi |
|-----------|--------|
| **Vercel** | Platform deployment (static + serverless) |
| **@vercel/static-build** | Builder frontend Vite |
| **@vercel/node** | Builder serverless function backend |

## Struktur Projek

```
IT Ticketing System/
├── frontend/                   # Aplikasi React (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx             # Komponen utama (dashboard, tiket, staff, analitik)
│   │   ├── App.css             # Custom styles
│   │   ├── index.css           # Global styles + Tailwind directives
│   │   └── main.tsx            # Entry point React
│   ├── public/                 # Asset statis (favicon, icons)
│   ├── .env                    # Environment variable lokal
│   ├── .env.production         # Environment variable produksi
│   ├── tailwind.config.js      # Konfigurasi Tailwind CSS
│   ├── vite.config.ts          # Konfigurasi Vite
│   ├── tsconfig.json           # Konfigurasi TypeScript
│   └── package.json
│
├── backend/                    # Server API (Express + PostgreSQL)
│   ├── api/
│   │   └── index.js            # Entry point serverless (Vercel)
│   ├── server.js               # Entry point lokal (Express server)
│   ├── db.js                   # Koneksi pool PostgreSQL
│   ├── schema.sql              # DDL tabel users, tickets, dan trigger
│   ├── seed.js                 # Data awal (3 user + 7 tiket)
│   ├── hash_passwords.js       # Utilitas hash password
│   ├── .env                    # Environment variable backend
│   └── package.json
│
├── vercel.json                 # Konfigurasi deployment Vercel
├── test_connection.py          # Utilitas tes koneksi PostgreSQL
└── README.md
```

## Prasyarat

- **Node.js** 18+ dan npm
- **PostgreSQL** (lokal atau cloud seperti Supabase, Neon, Railway)
- **Git** (opsional)

## Setup & Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd "IT Ticketing System"
```

### 2. Setup Database

Buat database PostgreSQL baru, lalu konfigurasi koneksi melalui environment variable.

Buat file `backend/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/it_ticketing_db
JWT_SECRET=supersecretjwtkeyforticketing2026
PORT=5000
```

Jalankan schema SQL untuk membuat tabel:

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

(Opsional) Isi data awal dengan seed:

```bash
cd backend
npm install
npm run seed
```

Data seed berisi 3 akun petugas dan 7 tiket contoh. Semua akun menggunakan password default `password123`.

### 3. Jalankan Backend

```bash
cd backend
npm install
npm run dev
```

Server berjalan di `http://localhost:5000`.

### 4. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

## API Endpoints

Semua endpoint menggunakan prefix `/api`. Endpoint yang ditandai 🔒 memerlukan header `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/health` | - | Health check server |
| `POST` | `/api/login` | - | Login dan dapatkan JWT token |
| `GET` | `/api/users/me` | 🔒 | Verifikasi sesi user aktif |
| `GET` | `/api/staff` | - | Daftar petugas dan jumlah tiket selesai |
| `GET` | `/api/tickets` | - | Daftar semua tiket (terbaru di atas) |
| `POST` | `/api/tickets` | - | Buat tiket baru |
| `PATCH` | `/api/tickets/:id` | 🔒 | Ubah status tiket |

### Contoh Request

**Login:**

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "andri_admin", "password": "password123"}'
```

**Buat Tiket:**

```bash
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"source": "WhatsApp", "message": "Printer lantai 3 tidak bisa cetak"}'
```

**Update Status Tiket:**

```bash
curl -X PATCH http://localhost:5000/api/tickets/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status": "selesai"}'
```

## Database Schema

### Tabel `users`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `SERIAL` | Primary key |
| `username` | `VARCHAR(50)` | Unique, untuk login |
| `password_hash` | `VARCHAR(255)` | Hash bcrypt |
| `name` | `VARCHAR(100)` | Nama tampilan |
| `role` | `VARCHAR(20)` | Role user (`admin` / `petugas`) |
| `avatar` | `TEXT` | URL foto profil |
| `completed_count` | `INT` | Jumlah tiket diselesaikan |

### Tabel `tickets`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `SERIAL` | Primary key |
| `ticket_number` | `VARCHAR(30)` | Nomor tiket unik (format `TCK-2026-XXX`) |
| `source` | `VARCHAR(50)` | Sumber tiket (WhatsApp, Telepon, dll.) |
| `message` | `TEXT` | Deskripsi masalah |
| `status` | `VARCHAR(30)` | Status: `belum_dikerjakan`, `diproses`, `selesai`, `ditolak` |
| `completed_by` | `VARCHAR(100)` | Nama petugas yang menyelesaikan |
| `completed_at` | `VARCHAR(30)` | Waktu penyelesaian |
| `created_at` | `VARCHAR(30)` | Waktu pembuatan |
| `updated_at` | `VARCHAR(30)` | Waktu update terakhir |

### Trigger

Database memiliki trigger `notify_ticket_changes()` yang otomatis menjalankan `pg_notify()` setiap kali ada INSERT atau UPDATE pada tabel `tickets`. Trigger ini digunakan untuk sinkronisasi data dan pencatatan perubahan di level database.

## Deployment ke Vercel

Projek ini dikonfigurasi untuk deploy ke Vercel sebagai monorepo dengan frontend statis dan backend serverless function.

### 1. Push ke GitHub

```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

### 2. Import di Vercel

- Buka [vercel.com](https://vercel.com) dan import repository.
- Vercel akan otomatis mendeteksi `vercel.json`.

### 3. Set Environment Variables

Tambahkan variabel berikut di Vercel Dashboard → Settings → Environment Variables:

| Variable | Contoh Nilai |
|----------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `JWT_SECRET` | `your-secure-secret-key` |

### 4. Deploy

Klik **Deploy**. Vercel akan:
- Build frontend dengan `@vercel/static-build` (menjalankan `npm run build` di folder `frontend/`)
- Deploy backend sebagai serverless function via `@vercel/node` (dari `backend/api/index.js`)
- Routing `/api/*` → backend, sisanya → frontend

## Perintah Penting

### Backend

| Perintah | Fungsi |
|----------|--------|
| `npm start` | Jalankan `server.js` |
| `npm run dev` | Jalankan server dengan auto-reload (`--watch`) |
| `npm run seed` | Jalankan seeding data awal ke database |

### Frontend

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan Vite dev server |
| `npm run build` | Build produksi (`tsc` + `vite build`) |
| `npm run preview` | Preview hasil build lokal |
| `npm run lint` | Jalankan ESLint |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `DATABASE_URL` | ✅ | - | Connection string PostgreSQL |
| `JWT_SECRET` | ❌ | `supersecretjwt...` | Secret key untuk JWT |
| `PORT` | ❌ | `5000` | Port server Express |

### Frontend (`frontend/.env`)

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `VITE_API_URL` | ❌ | `http://localhost:5000` | Base URL backend API |

> Pada produksi (`.env.production`), `VITE_API_URL` dikosongkan agar frontend memanggil API dari domain yang sama.

## Akun Default (Seed)

| Username | Password | Nama | Role |
|----------|----------|------|------|
| `andri_admin` | `password123` | Andri Hermawan | Admin |
| `budi_support` | `password123` | Budi Santoso | Admin |
| `citra_it` | `password123` | Citra Lestari | Admin |

## Catatan

- Pastikan frontend dan backend berjalan pada origin yang diizinkan oleh CORS (`localhost:5173`, `localhost:3000`).
- Jika menggunakan PostgreSQL cloud (Supabase, Neon, Railway), pastikan SSL diaktifkan pada connection string (`?sslmode=require`).
- File `backend/api/index.js` adalah entrypoint khusus Vercel serverless — untuk development lokal, gunakan `server.js`.
