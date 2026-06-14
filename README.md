# IT Ticketing System

Aplikasi dashboard manajemen tiket IT internal berbasis web fullstack. Dibangun dengan arsitektur monorepo yang memisahkan frontend dan backend dalam satu repository.

## Ringkasan

- Frontend React + TypeScript dengan Vite dan Tailwind CSS.
- Backend Node.js + Express dengan PostgreSQL sebagai database.
- Autentikasi menggunakan JWT.
- Siap dijalankan secara lokal dan didesain untuk deployment di Vercel.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- PostCSS
- ESLint
- jsPDF

### Backend

- Node.js
- Express
- PostgreSQL
- pg (node-postgres)
- JSON Web Token
- bcrypt
- cors
- dotenv

### Deployment & Tooling

- Vercel
- @vercel/static-build
- @vercel/node

## Struktur Projek

```
IT Ticketing System/
├── frontend/                   # Aplikasi React (Vite + TypeScript)
│   ├── src/                    # Kode sumber frontend
│   ├── public/                 # Asset statis
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                    # Server API (Express + PostgreSQL)
│   ├── api/                    # Entry point serverless untuk Vercel
│   ├── server.js               # Server Express lokal
│   ├── db.js                   # Koneksi database
│   ├── schema.sql              # Struktur tabel database
│   ├── seed.js                 # Data awal (opsional)
│   └── package.json
│
├── vercel.json                 # Konfigurasi deployment Vercel
├── test_connection.py          # Utilitas tes koneksi PostgreSQL
└── README.md
```

## Prasyarat

- Node.js 18+
- npm
- PostgreSQL (lokal atau cloud)

## Setup & Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd "IT Ticketing System"
```

### 2. Konfigurasi Koneksi Database

Siapkan connection string PostgreSQL dalam file environment lokal di folder `backend/`. Pastikan file konfigurasi ini tidak dibagikan atau dicatat di kartu publik.

### 3. Jalankan Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

## Catatan

- Hindari menyimpan data sensitif seperti credential database atau secret key di `README.md`.
- Gunakan file environment lokal yang tidak disertakan dalam kontrol versi untuk konfigurasi rahasia.
- Konfigurasi spesifik database dan secret hanya perlu dicatat secara pribadi atau di dalam dokumentasi deploy yang aman.


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



## Catatan

- Pastikan frontend dan backend berjalan pada origin yang diizinkan oleh CORS (`localhost:5173`, `localhost:3000`).
- Jika menggunakan PostgreSQL cloud (Supabase, Neon, Railway), pastikan SSL diaktifkan pada connection string (`?sslmode=require`).
- File `backend/api/index.js` adalah entrypoint khusus Vercel serverless — untuk development lokal, gunakan `server.js`.
