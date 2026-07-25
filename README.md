<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
</p>

<div align="center">
  <h1>🎫 IT Support Tickets — Backend API</h1>
  <p><strong>REST API</strong> — authentication, ticket management, comments, metrics, real-time, push notifications</p>

  <p>
    <a href="https://github.com/rivankadesya/ticket-be.git"><img src="https://img.shields.io/github/stars/rivankadesya/ticket-be?style=flat-square&label=Stars&color=yellow" /></a>
    <a href="https://github.com/rivankadesya/ticket-be.git"><img src="https://img.shields.io/github/forks/rivankadesya/ticket-be?style=flat-square&label=Forks&color=blue" /></a>
    <a href="https://github.com/rivankadesya/ticket-fe.git"><img src="https://img.shields.io/badge/Frontend%20Repo-Link-6366f1?style=flat-square" /></a>
  </p>
</div>

---

## 📋 Table of Contents

- [Clone Repository](#-clone-repository)
- [Technologies](#-technologies)
- [Folder Structure](#-folder-structure)
- [Database](#-database)
- [API Endpoints](#-api-endpoints)
- [Installation](#-installation)
- [Database Migration](#-database-migration)
- [Production Deployment](#-production-deployment)
- [Security](#-security)

---

## 📦 Clone Repository

```bash
git clone https://github.com/rivankadesya/ticket-be.git
cd ticket-be
```

> **Frontend App:** [rivankadesya/ticket-fe](https://github.com/rivankadesya/ticket-fe.git)

---

## 🛠️ Technologies

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4 | Web framework |
| **PostgreSQL** (pg) | 8 | Database |
| **Socket.IO** | 4 | WebSocket real-time |
| **JWT** (jsonwebtoken) | 9 | Authentication |
| **bcryptjs** | 2 | Password hashing |
| **express-validator** | 7 | Input validation |
| **helmet** | 7 | HTTP security |
| **cors** | 2 | CORS |
| **dotenv** | 16 | Environment config |
| **pm2** | — | Process manager |

---

## 📁 Folder Structure

```
src/
├── config/
│   └── database.js          # PostgreSQL pool connection
│
├── controllers/
│   ├── authController.js    # Register, login, profile, password
│   ├── ticketController.js  # CRUD tickets & metrics
│   └── commentController.js # Ticket comments
│
├── middleware/
│   └── auth.js              # JWT verify + error handler
│
├── migrations/
│   └── 001_initial.sql      # Database migration
│
├── migrate.js               # Migration runner
│
├── routes/
│   ├── authRoutes.js        # /api/auth/*
│   ├── ticketRoutes.js      # /api/tickets/*
│   ├── commentRoutes.js     # /api/tickets/:id/comments/*
│
├── services/
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

### Tables

#### `users`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| email | VARCHAR(255) UNIQUE | Login email |
| password | VARCHAR(255) | bcrypt hash |
| name | VARCHAR(255) | Full name |
| role | VARCHAR(50) | `user` / `admin` |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `tickets`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| title | VARCHAR(255) | Ticket title |
| description | TEXT | Description |
| category | VARCHAR(100) | Category |
| priority | VARCHAR(50) | Low/Medium/High/Critical |
| status | VARCHAR(50) | Open/In Progress/Resolved/Closed |
| created_by | UUID (FK) | Ticket creator |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

#### `ticket_assignments`
| Column | Type | Description |
|---|---|---|
| ticket_id | UUID (FK) | Ticket |
| user_id | UUID (FK) | Assignee |

#### `ticket_comments`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| ticket_id | UUID (FK) | Related ticket |
| user_id | UUID (FK) | Author |
| comment | TEXT | Comment content |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

---

## 🔌 API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ✗ | Register user |
| POST | `/api/auth/login` | ✗ | Login → JWT |
| GET | `/api/auth/users` | ✓ | List users |
| GET | `/api/auth/me` | ✓ | My profile |
| PUT | `/api/auth/profile` | ✓ | Update name |
| PUT | `/api/auth/password` | ✓ | Change password |

### Tickets — `/api/tickets`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/tickets` | ✓ | Create ticket |
| GET | `/api/tickets` | ✓ | List tickets |
| GET | `/api/tickets/metrics` | ✓ | Dashboard metrics |
| GET | `/api/tickets/:id` | ✓ | Ticket detail |
| PUT | `/api/tickets/:id` | ✓ | Update ticket |
| DELETE | `/api/tickets/:id` | ✓ | Delete ticket |

### Comments — `/api/tickets/:ticket_id/comments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/.../comments` | ✓ | Add comment |
| GET | `/.../comments` | ✓ | Get comments |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health check |

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Steps

```bash
git clone https://github.com/rivankadesya/ticket-be.git
cd ticket-be
npm install
```

Create `.env` file:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/it_support_tickets
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# Pusher Beams (optional)
PUSHER_BEAMS_INSTANCE_ID=
PUSHER_BEAMS_SECRET_KEY=
```

Create database:
```bash
createdb it_support_tickets
```

Run migrations:
```bash
npm run migrate
```

Start server:
```bash
npm run dev     # development (nodemon)
# or
npm start       # production
```

Server at `http://localhost:5001`.

---

## 🔄 Database Migration

### Running migrations

```bash
npm run migrate
```

Only **new** files will be executed. History stored in `_migrations` table.

### Adding a new migration

```bash
touch src/migrations/002_description.sql
# Fill with SQL, then:
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

| Command | Function |
|---|---|
| `pm2 status` | Check processes |
| `pm2 log ticket-api` | View logs |
| `pm2 restart ticket-api` | Restart |
| `pm2 stop ticket-api` | Stop |

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

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

## 🔒 Security

- **Helmet** — HTTP protection (XSS, clickjacking, etc.)
- **JWT** — All endpoints (except register/login) require `Authorization: Bearer <token>`
- **bcryptjs** — Password hashed before storage
- **Role-based access** — Only creator/admin/assignee can update; creator/admin can delete
- **Input validation** — express-validator for all inputs
- **Parameterized queries** — Prevents SQL injection
- **Error Handler** — Consistent JSON responses

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/rivankadesya">rivankadesya</a>
</p>