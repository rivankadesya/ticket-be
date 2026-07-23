# IT Support Tickets - Backend API

Backend REST API untuk dashboard tiket IT Support, menangani autentikasi pengguna, manajemen tiket (CRUD + drag-and-drop status), komentar, dan metrik dashboard.

---

## Teknologi & Tools

| Teknologi | Kegunaan |
|---|---|
| **Node.js** (v18+) | Runtime JavaScript |
| **Express.js** (v4) | Web framework / routing |
| **PostgreSQL** (`pg` v8) | Database relasional |
| **JSON Web Token** (`jsonwebtoken` v9) | Autentikasi berbasis token |
| **bcryptjs** (v2) | Hashing password |
| **UUID** (v9) | Generate ID unik tiap record |
| **express-validator** (v7) | Validasi input request |
| **helmet** (v7) | Keamanan header HTTP |
| **cors** (v2) | Cross-Origin Resource Sharing |
| **dotenv** (v16) | Konfigurasi environment variable |
| **nodemon** (v3, dev) | Auto-restart saat development |
| **@pusher/push-notifications-server** (v2) | Push notification engine (Pusher Beams) |

---

## Struktur Folder

```
backend/
├── src/
│   ├── config/
│   │   └── database.js         # Koneksi pool PostgreSQL
│   │
│   ├── controllers/
│   │   ├── authController.js   # Handler register, login, getUsers
│   │   ├── ticketController.js # Handler CRUD tiket & metrik dashboard
│   │   └── commentController.js# Handler tambah & lihat komentar
│   │
│   ├── middleware/
│   │   └── auth.js             # Verify JWT token & error handler global
│   │
│   ├── models/
│   │   └── index.js            # Inisialisasi & migrasi tabel database
│   │
│   ├── routes/
│   │   ├── authRoutes.js       # Route /api/auth/*
│   │   ├── ticketRoutes.js     # Route /api/tickets/*
│   │   ├── commentRoutes.js    # Route /api/tickets/:ticket_id/comments/*
│   │   └── pusherRoutes.js     # Route /api/pusher/*
│   │
│   ├── services/
│   │   └── pusher.js           # Pusher Beams client & publish helpers
│   │
│   ├── utils/
│   │   └── validators.js       # Aturan validasi express-validator
│   │
│   └── server.js               # Entry point aplikasi
│
├── .env                        # Konfigurasi environment (git-ignored)
├── package.json
└── Postman_Collection.json     # Collection API untuk testing
```

---

## Database (PostgreSQL)

### Entity Relationship

```
users ──1:N── tickets ──1:N── ticket_comments
  │                             │
  └── N:N ──────────────────────┘
  (ticket_assignments)
```

### Tabel

#### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Auto-generate |
| email | VARCHAR(255) UNIQUE | Email login |
| password | VARCHAR(255) | Hash bcrypt |
| name | VARCHAR(255) | Nama lengkap |
| role | VARCHAR(50) | `user` atau `admin` |
| is_active | BOOLEAN | Status akun |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

#### `tickets`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Auto-generate |
| title | VARCHAR(255) | Judul tiket |
| description | TEXT | Deskripsi |
| category | VARCHAR(100) | Kategori |
| priority | VARCHAR(50) | `Low`, `Medium`, `High`, `Critical` |
| status | VARCHAR(50) | `Open`, `In Progress`, `Resolved`, `Closed` |
| created_by | UUID (FK → users.id) | Pembuat tiket |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

#### `ticket_assignments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| ticket_id | UUID (FK → tickets.id) | Tiket |
| user_id | UUID (FK → users.id) | Assignee |

#### `ticket_comments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Auto-generate |
| ticket_id | UUID (FK → tickets.id) | Tiket terkait |
| user_id | UUID (FK → users.id) | Penulis komentar |
| comment | TEXT | Isi komentar |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

### Index
- `tickets(status)`, `tickets(priority)`, `tickets(created_by)`
- `ticket_assignments(ticket_id)`, `ticket_assignments(user_id)`

---

## API Endpoints

### Autentikasi — `/api/auth`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | ✗ | Registrasi user baru |
| POST | `/api/auth/login` | ✗ | Login, mengembalikan JWT |
| GET | `/api/auth/users` | ✓ | Daftar semua user aktif |

### Tiket — `/api/tickets`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/tickets` | ✓ | Buat tiket baru (dengan assignees) |
| GET | `/api/tickets` | ✓ | List tiket (filter: `status`, `priority`, `category`) |
| GET | `/api/tickets/metrics` | ✓ | Metrik dashboard (jumlah tiket per status/priority + total user) |
| GET | `/api/tickets/:id` | ✓ | Detail tiket + komentar |
| PUT | `/api/tickets/:id` | ✓ | Update tiket (creator/admin/assignee) |
| DELETE | `/api/tickets/:id` | ✓ | Hapus tiket (creator/admin) |

### Komentar — `/api/tickets/:ticket_id/comments`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/tickets/:ticket_id/comments` | ✓ | Tambah komentar |
| GET | `/api/tickets/:ticket_id/comments` | ✓ | Ambil komentar (urut DESC) |

### Pusher Beams — `/api/pusher`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/pusher/beams-auth` | ✓ | Generate token autentikasi Pusher Beams untuk user |

### Health Check

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Cek server aktif |

---

## Keamanan

- **Helmet** — Melindungi dari serangan HTTP (XSS, clickjacking, dll).
- **JWT** — Setiap endpoint (kecuali register/login) mewajibkan `Authorization: Bearer <token>`.
- **bcryptjs** — Password di-hash dengan salt rounds dari env `BCRYPT_ROUNDS` sebelum disimpan.
- **Role-based access** — Hanya creator/admin/assignee yang bisa update tiket; hanya creator/admin yang bisa hapus.
- **Validasi input** — `express-validator` memvalidasi email, panjang password, enum priority/status, dll.
- **Parameterized queries** — Semua query SQL menggunakan parameter (`$1`, `$2`) untuk mencegah SQL injection.
- **Error Handler** — Middleware global menangani error dan mengembalikan response JSON konsisten.

---

## Keputusan Teknis

### 1. Query Metrik Dashboard Terpisah
Pada `getDashboardMetrics`, query `total_tickets` dan `total_users` dijalankan secara **independen** (dua query terpisah) untuk memastikan `total_users` tetap mengembalikan nilai yang benar bahkan saat tabel `tickets` kosong.

### 2. Multi-Assignee dengan Join Table
Tiket dapat memiliki banyak assignee melalui tabel `ticket_assignments` (relasi N:N). Saat update, semua assignment lama dihapus lalu diganti dengan yang baru dalam satu transaksi.

### 3. Short-Polling untuk Real-Time
Backend menggunakan arsitektur REST stateless (tanpa WebSocket). Sinkronisasi real-time di-handle sepenuhnya oleh frontend melalui polling berkala (setiap 5 detik untuk tiket, 3 detik untuk komentar).

### 4. Push Notification (Pusher Beams)
Backend terintegrasi dengan **Pusher Beams** untuk mengirim notifikasi push ke browser pengguna secara real-time.

- **Beams Auth** (`POST /api/pusher/beams-auth`) — Frontend memanggil endpoint ini setelah login untuk mendapatkan token autentikasi Pusher yang ditandatangani dengan `secretKey`.
- **Publish on Events** — Saat tiket dibuat, notifikasi dikirim ke semua assignee. Saat tiket diperbarui (status/priority berubah), notifikasi dikirim ke creator dan semua assignee.
- **Graceful degredation** — Jika credential Pusher tidak dikonfigurasi di `.env`, seluruh fitur push notification dinonaktifkan tanpa menyebabkan error.

### 5. Transaksi Database
Operasi yang memodifikasi banyak tabel (create/update ticket dengan assignments) dibungkus dalam `BEGIN/COMMIT/ROLLBACK` untuk menjaga atomicity.

---

## Instalasi & Menjalankan

1. Pastikan **Node.js v18+** dan **PostgreSQL** sudah terinstall.

2. Clone repositori dan masuk ke folder backend:
```bash
cd backend
```

3. Pasang dependensi:
```bash
npm install
```

4. Buat file `.env` di root folder backend:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/it_support_tickets
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
PUSHER_BEAMS_INSTANCE_ID=your_instance_id
PUSHER_BEAMS_SECRET_KEY=your_secret_key
```

5. Jalankan server (tabel database akan otomatis dibuat saat pertama kali server dijalankan):
```bash
npm run dev   # development (dengan nodemon)
```
atau
```bash
npm start     # production
```

Server akan berjalan di `http://localhost:5001`.
