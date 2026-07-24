<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</p>

<div align="center">
  <h1>🎫 IT Support Tickets — Backend API</h1>
  <p><strong>REST API</strong> — autentikasi, manajemen tiket, komentar, metrik, real-time, push notification</p>

  <p>
    <a href="https://github.com/rivankadesya/ticket-be.git"><img src="https://img.shields.io/github/stars/rivankadesya/ticket-be?style=flat-square&label=Stars&color=yellow" /></a>
    <a href="https://github.com/rivankadesya/ticket-be.git"><img src="https://img.shields.io/github/forks/rivankadesya/ticket-be?style=flat-square&label=Forks&color=blue" /></a>
    <a href="https://github.com/rivankadesya/ticket-fe.git"><img src="https://img.shields.io/badge/Frontend%20Repo-Link-6366f1?style=flat-square" /></a>
  </p>
</div>

---

## 📋 Daftar Isi

- [Clone Repository](#-clone-repository)
- [Teknologi](#-teknologi)
- [Struktur Folder](#-struktur-folder)
- [Database](#-database)
- [API Endpoints](#-api-endpoints)
- [Instalasi](#-instalasi)
- [Database Migration](#-database-migration)
- [Production Deployment](#-production-deployment)
- [Keamanan](#-keamanan)

---

## 📦 Clone Repository

```bash
git clone https://github.com/rivankadesya/ticket-be.git
cd ticket-be
```

> **Frontend App:** [rivankadesya/ticket-fe](https://github.com/rivankadesya/ticket-fe.git)

---

## 🛠️ Teknologi

| Teknologi | Versi | Kegunaan |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4 | Web framework |
| **PostgreSQL** (pg) | 8 | Database |
| **Socket.IO** | 4 | WebSocket real-time |
| **JWT** (jsonwebtoken) | 9 | Autentikasi |
| **bcryptjs** | 2 | Hashing password |
| **express-validator** | 7 | Validasi input |
| **helmet** | 7 | Keamanan HTTP |
| **cors** | 2 | CORS |
| **dotenv** | 16 | Environment config |
| **Pusher Beams** | 2 | Push notification |
| **pm2** | — | Process manager |

---

## 📁 Struktur Folder

```
src/
├── config/
│   └── database.js          # Koneksi pool PostgreSQL
│
├── controllers/
│   ├── authController.js    # Register, login, profile, password
│   ├── ticketController.js  # CRUD tiket & metrik
│   └── commentController.js # Komentar tiket
│
├── middleware/
│   └── auth.js              # Verify JWT + error handler
│
├── migrations/
│   └── 001_initial.sql      # Migrasi database
│
├── migrate.js               # Runner migrasi
│
├── routes/
│   ├── authRoutes.js        # /api/auth/*
│   ├── ticketRoutes.js      # /api/tickets/*
│   ├── commentRoutes.js     # /api/tickets/:id/comments/*
│   └── pusherRoutes.js      # /api/pusher/*
│
├── services/
│   ├── pusher.js            # Pusher Beams
│   └── socketEmitter.js     # Socket.IO emitter
│
├── utils/
│   └── validators.js        # Validation rules
│
└── server.js                # Entry point + Socket.IO
```

---

## 🗄️ Database

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
| role | VARCHAR(50) | `user` / `admin` |
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
| priority | VARCHAR(50) | Low/Medium/High/Critical |
| status | VARCHAR(50) | Open/In Progress/Resolved/Closed |
| created_by | UUID (FK) | Pembuat tiket |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

#### `ticket_assignments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| ticket_id | UUID (FK) | Tiket |
| user_id | UUID (FK) | Assignee |

#### `ticket_comments`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID (PK) | Auto-generate |
| ticket_id | UUID (FK) | Tiket terkait |
| user_id | UUID (FK) | Penulis |
| comment | TEXT | Isi komentar |
| created_at | TIMESTAMP | Otomatis |
| updated_at | TIMESTAMP | Otomatis |

---

## 🔌 API Endpoints

### Autentikasi — `/api/auth`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/register` | ✗ | Registrasi |
| POST | `/api/auth/login` | ✗ | Login → JWT |
| GET | `/api/auth/users` | ✓ | Daftar user |
| GET | `/api/auth/me` | ✓ | Profile saya |
| PUT | `/api/auth/profile` | ✓ | Update nama |
| PUT | `/api/auth/password` | ✓ | Ganti password |

### Tiket — `/api/tickets`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/tickets` | ✓ | Buat tiket |
| GET | `/api/tickets` | ✓ | List tiket |
| GET | `/api/tickets/metrics` | ✓ | Metrik dashboard |
| GET | `/api/tickets/:id` | ✓ | Detail tiket |
| PUT | `/api/tickets/:id` | ✓ | Update tiket |
| DELETE | `/api/tickets/:id` | ✓ | Hapus tiket |

### Komentar — `/api/tickets/:ticket_id/comments`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/.../comments` | ✓ | Tambah komentar |
| GET | `/.../comments` | ✓ | Ambil komentar |

### Pusher Beams — `/api/pusher`

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/pusher/beams-auth` | ✓ | Auth token Pusher |

### Health Check

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/health` | Cek server hidup |

---

## 🚀 Instalasi

### Prasyarat

- Node.js 18+
- PostgreSQL 14+

### Langkah

```bash
git clone https://github.com/rivankadesya/ticket-be.git
cd ticket-be
npm install
```

Buat file `.env`:
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

Buat database:
```bash
createdb it_support_tickets
```

Jalankan migrasi:
```bash
npm run migrate
```

Jalankan server:
```bash
npm run dev     # development (nodemon)
# atau
npm start       # production
```

Server di `http://localhost:5001`.

---

## 🔄 Database Migration

### Menjalankan migrasi

```bash
npm run migrate
```

Hanya file **baru** yang akan dieksekusi. Riwayat tersimpan di tabel `_migrations`.

### Menambah migrasi baru

```bash
touch src/migrations/002_deskripsi.sql
# isi dengan SQL, lalu:
npm run migrate
```

---

## ⚙️ Production Deployment

### PM2

```bash
npm install pm2 --save-dev
npx pm2 start src/server.js --name ticket-api
npx pm2 save
npx pm2 startup
```

### Commands

| Perintah | Fungsi |
|---|---|
| `pm2 status` | Cek proses |
| `pm2 log ticket-api` | Lihat log |
| `pm2 restart ticket-api` | Restart |
| `pm2 stop ticket-api` | Stop |

### Nginx Reverse Proxy

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

---

## 🔒 Keamanan

- **Helmet** — Proteksi HTTP (XSS, clickjacking, dll)
- **JWT** — Setiap endpoint (kecuali register/login) wajib `Authorization: Bearer <token>`
- **bcryptjs** — Password di-hash sebelum disimpan
- **Role-based access** — Hanya creator/admin/assignee bisa update; creator/admin bisa hapus
- **Validasi input** — express-validator untuk semua input
- **Parameterized queries** — Mencegah SQL injection
- **Error Handler** — JSON response konsisten

---

<p align="center">
  Dibuat dengan ❤️ oleh <a href="https://github.com/rivankadesya">rivankadesya</a>
</p>