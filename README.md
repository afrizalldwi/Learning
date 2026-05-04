# Belajar Vibe Coding

## Deskripsi Aplikasi
Belajar Vibe Coding adalah aplikasi backend berbasis API untuk manajemen pengguna (User Management). Aplikasi ini menyediakan fitur dasar seperti registrasi pengguna, otentikasi (login), pengambilan profil pengguna, dan manajemen sesi (logout). Aplikasi ini dirancang dengan arsitektur modern, ringan, dan sangat cepat menggunakan ekosistem Bun.

## Technology Stack
- **Runtime:** [Bun](https://bun.sh/)
- **Web Framework:** [ElysiaJS](https://elysiajs.com/) (Framework ringan berkinerja tinggi untuk Bun)
- **Database:** MySQL
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Bahasa Pemrograman:** TypeScript

## Library Utama yang Digunakan
- `elysia`: Routing aplikasi, middleware, dan validasi input.
- `drizzle-orm` & `drizzle-kit`: ORM TypeScript-first untuk definisi skema dan migrasi database.
- `mysql2`: Database driver resmi untuk terhubung ke MySQL secara asynchronous.

## Arsitektur dan Struktur Folder
Aplikasi ini mengadopsi pola arsitektur **Layered Architecture (Separation of Concerns)** yang memisahkan tugas antara routing, logika bisnis (services), dan konfigurasi database. Format penamaan file di aplikasi ini menggunakan pola `kebab-case` (contoh: `users-route.ts`, `users-service.ts`).

```text
├── src/
│   ├── index.ts                 # Entry point aplikasi (Inisiasi server Elysia)
│   ├── db/                      # Modul pengaturan Database
│   │   ├── index.ts             # Koneksi MySQL2 dan instance Drizzle ORM
│   │   └── schema.ts            # Definisi struktur tabel database
│   ├── errors/                  # Custom error classes
│   │   └── unauthorized-error.ts# Custom class untuk exception otentikasi
│   ├── routes/                  # Controller / API Routes
│   │   └── users-route.ts       # Endpoint definition & validasi input API user
│   └── services/                # Layer logika bisnis
│       └── users-service.ts     # Pemrosesan register, login, get user, logout
├── tests/                       # Direktori Unit & Integration Test
│   └── users.test.ts            # Pengujian skenario otomatis untuk endpoint Users
├── drizzle.config.ts            # Konfigurasi Drizzle Kit untuk migrasi
├── package.json                 # Daftar dependencies
├── tsconfig.json                # Konfigurasi compiler TypeScript
└── .env                         # Environment variables (koneksi database)
```

## Schema Database
Aplikasi ini memiliki dua tabel utama yang saling berelasi:

1. **Table `users`** (Tabel Induk)
   - `id`: `BIGINT UNSIGNED` / Serial (Primary Key)
   - `name`: `VARCHAR(255)` (Not Null)
   - `email`: `VARCHAR(255)` (Not Null, Unique)
   - `password`: `VARCHAR(255)` (Not Null)
   - `createdAt`: `TIMESTAMP` (Default: CURRENT_TIMESTAMP)

2. **Table `sessions`** (Tabel Anak)
   - `id`: `BIGINT UNSIGNED` / Serial (Primary Key)
   - `token`: `VARCHAR(255)` (Not Null) - UUID string token autentikasi pengguna
   - `userId`: `BIGINT UNSIGNED` (Not Null) - Foreign Key mereferensikan `users.id`
   - `createdAt`: `TIMESTAMP` (Default: CURRENT_TIMESTAMP)

## API Endpoints Tersedia

| Method | Endpoint | Deskripsi | Keterangan |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Registrasi Pengguna | Membutuhkan payload JSON: `name`, `email`, dan `password`.
| `POST` | `/api/users/login` | Login | Membutuhkan `email` dan `password`. Mengembalikan token sesi.
| `GET` | `/api/users/current` | Dapatkan Profil | Wajib menyertakan Header: `Authorization: Bearer <token>`.
| `DELETE` | `/api/users/current` | Logout | Menghapus sesi. Wajib menyertakan Header: `Authorization: Bearer <token>`.

## Cara Setup Project

1. **Install Bun**: Pastikan Anda sudah menginstal Bun v1.3+ di mesin Anda.
2. **Install Dependencies**:
   Jalankan perintah berikut di root folder:
   ```bash
   bun install
   ```
3. **Konfigurasi Environment**:
   Pastikan terdapat file `.env` di direktori proyek Anda. Atur URI koneksi database MySQL:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/nama_database"
   PORT=3000
   ```
4. **Push Skema ke Database (Migrasi)**:
   Buat tabel database secara otomatis berdasarkan definisi di `src/db/schema.ts`:
   ```bash
   bunx drizzle-kit push
   ```

## Cara Menjalankan Aplikasi

Anda dapat menjalankan server dalam mode biasa atau dengan hot-reloading (untuk development):

```bash
# Menjalankan server aplikasi
bun run src/index.ts

# Atau menjalankan dengan hot-reloading
bun run --hot src/index.ts
```
*Aplikasi secara default akan berjalan di alamat `http://localhost:3000` (atau sesuai `PORT` di `.env`).*

## Cara Menjalankan Test Aplikasi

Proyek ini dilengkapi dengan skenario *Integration Test* menggunakan test runner bawaan Bun.
> **Peringatan**: Pengujian ini langsung berinteraksi dengan database dan akan menghapus isi tabel (`users` dan `sessions`) setiap kali skenario test dimulai (`beforeEach`). Sangat disarankan untuk menggunakan database development/testing lokal saat menguji.

Untuk mengeksekusi semua file test:
```bash
bun test
```
