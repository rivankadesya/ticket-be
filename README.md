# IT Support Tickets - Backend API

Backend REST API untuk dashboard tiket IT Support, menangani autentikasi pengguna, manajemen tiket (CRUD + drag-and-drop status), komentar, metrik dashboard, real-time sinkronisasi via Socket.IO, dan push notification via Pusher Beams.

---

## Teknologi & Tools

| Teknologi | Kegunaan |
|---|---|
| **Node.js** (v18+) | Runtime JavaScript |
| **Express.js** (v4) | Web framework / routing |
| **Socket.IO** (v4) | Real-time WebSocket bidirectional |
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
| **pm2** (dev) | Process manager untuk production |

---

## Struktur Folder

```
backend/
├── src/
│   ├── config/
│   │   └── database.js             # Koneksi pool PostgreSQL
│   │
│   ├── controllers/
│   │   ├── authController.js       # Handler register, login, getUsers
│   │   ├── ticketController.js     # Handler CRUD tiket & metrik dashboard
│   │   └── commentController.js    # Handler tambah & lihat komentar
│   │
│   ├── middleware/
│   │   └── auth.js                 # Verify JWT token & error handler global
│   │
│   ├── migrations/
│   │   └── 001_initial.sql         # Migrasi database (SQL)
│   │
│   ├── migrate.js                  # Runner migrasi database
│   │
│   ├── models/
│   │   └── index.js                # (Legacy) Inisialisasi tabel — gunakan migrate
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # Route /api/auth/*
│   │   ├── ticketRoutes.js         # Route /api/tickets/*
│   │   ├── commentRoutes.js        # Route /api/tickets/:ticket_id/comments/*
│   │   └── pusherRoutes.js         # Route /api/pusher/* (Beams auth)
│   │
│   ├── services/
│   │   ├── pusher.js               # Pusher Beams client & publish helpers
│   │   └── socketEmitter.js        # Helper emit event Socket.IO
│   │
│   ├── utils/
│   │   └── validators.js           # Aturan validasi express-validator
│   │
│   └── server.js                   # Entry point + inisialisasi Socket.IO
│
├── .env                            # Konfigurasi environment (git-ignored)
├── package.json
└── Postman_Collection.json         # Collection API untuk testing
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
| id | UUID (PK) | Auto-generate via `gen_random_uuid()` |
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
| priority | VARCHAR(50) | `Low`, `Medium`, `High`, `Critical` (dengan CHECK constraint) |
| status | VARCHAR(50) | `Open`, `In Progress`, `Resolved`, `Closed` (default `Open`) |
| created_by | UUID (FK → users.id) | Pembuat tiket |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

#### `ticket_assignments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| ticket_id | UUID (FK → tickets.id) ON DELETE CASCADE | Tiket |
| user_id | UUID (FK → users.id) ON DELETE CASCADE | Assignee |

#### `ticket_comments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Auto-generate |
| ticket_id | UUID (FK → tickets.id) ON DELETE CASCADE | Tiket terkait |
| user_id | UUID (FK → users.id) ON DELETE CASCADE | Penulis komentar |
| comment | TEXT | Isi komentar |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

### Index
- `tickets(status)`, `tickets(priority)`, `tickets(created_by)`
- `ticket_assignments(ticket_id)`, `ticket_assignments(user_id)`

### Catatan Desain Database
- Semua relasi menggunakan `ON DELETE CASCADE` — menghapus tiket otomatis menghapus assignment & komentar terkait.
- ID menggunakan UUID (bukan serial integer) untuk keamanan dan distribusi.

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
| GET | `/api/tickets/metrics` | ✓ | Metrik dashboard |
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
| POST | `/api/pusher/beams-auth` | ✓ | Generate token autentikasi Pusher Beams |

### Health Check

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Cek server hidup |

---

## Keamanan

- **Helmet** — Melindungi dari serangan HTTP (XSS, clickjacking, MIME sniffing, dll).
- **JWT** — Setiap endpoint (kecuali register/login) mewajibkan header `Authorization: Bearer <token>`.
- **bcryptjs** — Password di-hash dengan salt rounds dari env `BCRYPT_ROUNDS` sebelum disimpan.
- **Role-based access** — Hanya creator/admin/assignee yang bisa update tiket; hanya creator/admin yang bisa hapus.
- **Validasi input** — `express-validator` memvalidasi email, panjang password (min 8), enum `priority` dan `status`, dll.
- **Parameterized queries** — Semua query SQL menggunakan placeholder (`$1`, `$2`) mencegah SQL injection.
- **Error Handler** — Middleware global menangani error dan mengembalikan JSON konsisten.

---

## Real-Time Sinkronisasi (Socket.IO)

Backend menggunakan **Socket.IO** untuk mengirim event real-time ke semua klien yang terhubung.

### Arsitektur

```
┌──────────────┐      Socket.IO (WebSocket)      ┌──────────────┐
│   Backend    │ ──────────────────────────────►  │   Frontend   │
│  (Express +  │     tickets:created              │   (React +   │
│  Socket.IO)  │     tickets:updated              │ socket.io-   │
│              │     tickets:deleted              │   client)    │
│              │     comments:added               │              │
└──────────────┘                                  └──────────────┘
```

### Event yang Dikirim

| Event | Trigger | Data |
|---|---|---|
| `tickets:created` | Tiket baru dibuat | `{ ticket_id }` |
| `tickets:updated` | Tiket diperbarui | `{ ticket_id }` |
| `tickets:deleted` | Tiket dihapus | `{ ticket_id }` |
| `comments:added` | Komentar baru | `{ ticket_id }` |

### Implementasi

1. **server.js** — Membuat `http.Server` dan `Socket.IO` instance, menyimpannya ke `app.set('io', io)`.
2. **socketEmitter.js** — Helper yang memanggil `io.emit(channel, event, data)`.
3. **Controller** — Setiap operasi create/update/delete memanggil `emit(req.app.get('io'), 'tickets', 'created', data)`.

---

## Push Notification (Pusher Beams)

Backend terintegrasi dengan **Pusher Beams** untuk mengirim notifikasi push ke browser.

- **Beams Auth** (`POST /api/pusher/beams-auth`) — Frontend memanggil endpoint ini setelah login untuk mendapatkan token autentikasi Pusher.
- **Publish on Events** — Notifikasi dikirim ke assignee saat tiket dibuat/diperbarui.
- **Graceful degradation** — Jika credential Pusher tidak dikonfigurasi, fitur dinonaktifkan otomatis.

---

## Database Migration

Gunakan sistem migrasi untuk mengelola perubahan tabel. Setiap perubahan database dibuat sebagai file SQL di `src/migrations/`.

### Menjalankan migrasi

```bash
npm run migrate
```

### Menambah migrasi baru

Buat file baru di `src/migrations/` dengan format `NNN_deskripsi.sql`:

```bash
touch src/migrations/002_add_some_column.sql
```

Isi dengan query SQL, lalu jalankan:
```bash
npm run migrate
```

Hanya file baru yang akan dieksekusi. Riwayat tersimpan di tabel `_migrations`.

---

## Instalasi & Menjalankan (Development)

1. Pastikan **Node.js v18+** dan **PostgreSQL** terinstall.

2. Clone repositori dan masuk ke folder backend:
```bash
cd ticket-be
```

3. Pasang dependensi:
```bash
npm install
```

4. Buat file `.env`:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/it_support_tickets
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# Pusher Beams (opsional)
PUSHER_BEAMS_INSTANCE_ID=
PUSHER_BEAMS_SECRET_KEY=
```

5. Buat database:
```bash
createdb it_support_tickets
```

6. Jalankan migrasi:
```bash
npm run migrate
```

7. Jalankan server:
```bash
npm run dev   # development (nodemon)
```
atau
```bash
npm start     # production
```

Server akan berjalan di `http://localhost:5001`.

---

## Production Deployment

### 1. Setup PM2

```bash
npm install pm2 --save-dev
npx pm2 start src/server.js --name ticket-api
npx pm2 save
npx pm2 startup
```

### 2. Environment Production

Tambahkan di `.env`:
```
NODE_ENV=production
FRONTEND_URL=https://domain-anda.com
```

### 3. Nginx Reverse Proxy (Opsional)

```nginx
server {
    listen 80;
    server_name api.domain-anda.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 4. PM2 Commands

```bash
pm2 status              # Cek semua proses
pm2 log ticket-api      # Lihat log
pm2 restart ticket-api  # Restart
pm2 stop ticket-api     # Stop
pm2 delete ticket-api   # Hapus dari pm2
```

---

## Keputusan Teknis

### 1. Query Metrik Dashboard Terpisah
Pada `getDashboardMetrics`, query `total_tickets` dan `total_users` dijalankan secara **independen** — memastikan `total_users` tetap benar meskipun tabel `tickets` kosong.

### 2. Multi-Assignee dengan Join Table
Tiket dapat memiliki banyak assignee melalui tabel `ticket_assignments` (relasi N:N). Update assignment dalam satu transaksi database.

### 3. Socket.IO untuk Real-Time
Menggunakan Socket.IO WebSocket — update instan tanpa polling.

### 4. Transaksi Database
Operasi create/update ticket dengan assignments dibungkus dalam `BEGIN`/`COMMIT`/`ROLLBACK`.

### 5. Migration-based Schema Management
Perubahan tabel dikelola via file SQL migration, bukan auto-init. Riwayat migrasi tersimpan di database.