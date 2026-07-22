# IT Support Tickets Backend

Professional IT Support Ticket Management System Backend API built with Node.js, Express, and PostgreSQL.

## Features

- User authentication with JWT
- Complete ticket CRUD operations
- Ticket filtering and search
- Dashboard metrics
- Comment system for tickets
- Input validation and sanitization
- Security best practices (CORS, Helmet, bcryptjs)
- PostgreSQL with connection pooling

## Prerequisites

- Node.js v14+
- PostgreSQL v12+
- npm or yarn

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/it_support_tickets
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
```

## Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE it_support_tickets;
```

2. Tables are automatically created on first server run

## Running the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Documentation

See `API_DOCUMENTATION.md` for complete endpoint documentation.

### Quick Start

1. **Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Create a ticket (use token from login):**
```bash
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Cannot access email",
    "description": "User unable to access company email",
    "category": "Email",
    "priority": "High"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── ticketController.js  # Ticket CRUD operations
│   │   └── commentController.js # Comment management
│   ├── middleware/
│   │   └── auth.js              # JWT verification & error handling
│   ├── models/
│   │   └── index.js             # Database schema & initialization
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   ├── ticketRoutes.js      # Ticket endpoints
│   │   └── commentRoutes.js     # Comment endpoints
│   ├── utils/
│   │   └── validators.js        # Input validation rules
│   └── server.js                # Express app initialization
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
├── API_DOCUMENTATION.md         # Full API documentation
└── Postman_Collection.json      # Postman collection for testing
```

## Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** Bcryptjs with configurable rounds
- **Input Validation:** Express-validator for all inputs
- **SQL Injection Protection:** Parameterized queries with PostgreSQL
- **CORS Protection:** Configurable CORS settings
- **Security Headers:** Helmet.js for HTTP headers
- **Account Status:** User account active status checking
- **Error Handling:** Secure error messages (no sensitive data leakage)

## Postman Collection

Import `Postman_Collection.json` into Postman for easy API testing. Variables to set:
- `base_url`: http://localhost:5000/api
- `jwt_token`: Token from login response
- `ticket_id`: Ticket ID for specific operations

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email
- `password` (VARCHAR) - Hashed password
- `name` (VARCHAR) - User full name
- `role` (VARCHAR) - User role
- `is_active` (BOOLEAN) - Account status
- `created_at`, `updated_at` - Timestamps

### Tickets Table
- `id` (UUID) - Primary key
- `title` (VARCHAR) - Ticket title
- `description` (TEXT) - Issue description
- `category` (VARCHAR) - Issue category
- `priority` (VARCHAR) - Priority level
- `status` (VARCHAR) - Current status
- `assigned_to` (UUID FK) - Assigned user
- `created_by` (UUID FK) - Creator user
- `created_at`, `updated_at` - Timestamps

### Ticket Comments Table
- `id` (UUID) - Primary key
- `ticket_id` (UUID FK) - Related ticket
- `user_id` (UUID FK) - Comment author
- `comment` (TEXT) - Comment content
- `created_at`, `updated_at` - Timestamps

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## License

ISC
