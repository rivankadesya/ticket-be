# IT Support Tickets - Backend API Documentation

## Overview
RESTful API for managing IT support tickets with user authentication, ticket CRUD operations, and comment management.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except `/auth/register` and `/auth/login`) require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Authentication

#### Register User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response (201):**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "jwt_token"
  }
  ```

#### Login User
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response (200):**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "token": "jwt_token"
  }
  ```

---

### 2. Tickets

#### Create Ticket
- **POST** `/tickets`
- **Auth:** Required
- **Body:**
  ```json
  {
    "title": "Cannot access email",
    "description": "User unable to access company email",
    "category": "Email",
    "priority": "High",
    "assigned_to": "user_uuid_or_null"
  }
  ```
- **Response (201):**
  ```json
  {
    "message": "Ticket created successfully",
    "ticket": {
      "id": "uuid",
      "title": "Cannot access email",
      "description": "User unable to access company email",
      "category": "Email",
      "priority": "High",
      "status": "Open",
      "assigned_to": "user_uuid",
      "created_by": "user_uuid",
      "created_at": "2026-07-22T06:45:20.504Z",
      "updated_at": "2026-07-22T06:45:20.504Z"
    }
  }
  ```

#### Get All Tickets
- **GET** `/tickets`
- **Auth:** Required
- **Query Parameters:**
  - `status` (optional): Filter by status (Open, In Progress, Resolved, Closed)
  - `priority` (optional): Filter by priority (Low, Medium, High, Critical)
  - `category` (optional): Filter by category
- **Example:** `/tickets?status=Open&priority=High`
- **Response (200):**
  ```json
  {
    "message": "Tickets retrieved successfully",
    "count": 10,
    "tickets": [
      {
        "id": "uuid",
        "title": "Cannot access email",
        "category": "Email",
        "priority": "High",
        "status": "Open",
        "assigned_to_name": "Jane Smith",
        "created_by_name": "John Doe",
        "created_at": "2026-07-22T06:45:20.504Z"
      }
    ]
  }
  ```

#### Get Ticket by ID
- **GET** `/tickets/:id`
- **Auth:** Required
- **Response (200):**
  ```json
  {
    "message": "Ticket retrieved successfully",
    "ticket": {
      "id": "uuid",
      "title": "Cannot access email",
      "description": "User unable to access company email",
      "category": "Email",
      "priority": "High",
      "status": "Open",
      "assigned_to_name": "Jane Smith",
      "created_by_name": "John Doe",
      "created_at": "2026-07-22T06:45:20.504Z",
      "updated_at": "2026-07-22T06:45:20.504Z"
    },
    "comments": [
      {
        "id": "uuid",
        "ticket_id": "uuid",
        "user_id": "uuid",
        "comment": "Working on this issue",
        "user_name": "Jane Smith",
        "created_at": "2026-07-22T06:45:20.504Z"
      }
    ]
  }
  ```

#### Update Ticket
- **PUT** `/tickets/:id`
- **Auth:** Required
- **Body (all fields optional):**
  ```json
  {
    "title": "Cannot access email - URGENT",
    "status": "In Progress",
    "priority": "Critical",
    "assigned_to": "user_uuid"
  }
  ```
- **Response (200):** Returns updated ticket object

#### Delete Ticket
- **DELETE** `/tickets/:id`
- **Auth:** Required
- **Response (200):**
  ```json
  {
    "message": "Ticket deleted successfully"
  }
  ```

#### Get Dashboard Metrics
- **GET** `/tickets/metrics`
- **Auth:** Required
- **Response (200):**
  ```json
  {
    "message": "Dashboard metrics retrieved successfully",
    "metrics": {
      "total_tickets": 25,
      "open_tickets": 10,
      "in_progress_tickets": 8,
      "high_priority_tickets": 5
    }
  }
  ```

---

### 3. Comments

#### Add Comment to Ticket
- **POST** `/tickets/:ticket_id/comments`
- **Auth:** Required
- **Body:**
  ```json
  {
    "comment": "We have resolved the issue. Please verify."
  }
  ```
- **Response (201):**
  ```json
  {
    "message": "Comment added successfully",
    "comment": {
      "id": "uuid",
      "ticket_id": "uuid",
      "user_id": "uuid",
      "comment": "We have resolved the issue. Please verify.",
      "created_at": "2026-07-22T06:45:20.504Z"
    }
  }
  ```

#### Get Comments for Ticket
- **GET** `/tickets/:ticket_id/comments`
- **Auth:** Required
- **Response (200):**
  ```json
  {
    "message": "Comments retrieved successfully",
    "count": 3,
    "comments": [
      {
        "id": "uuid",
        "ticket_id": "uuid",
        "user_id": "uuid",
        "comment": "We have resolved the issue. Please verify.",
        "user_name": "Jane Smith",
        "created_at": "2026-07-22T06:45:20.504Z"
      }
    ]
  }
  ```

---

## Error Responses

### 400 Bad Request
```json
{
  "errors": [
    {
      "value": "",
      "msg": "Password must be at least 8 characters",
      "param": "password",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "message": "Ticket not found"
}
```

### 409 Conflict
```json
{
  "message": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Setup Instructions

### Prerequisites
- Node.js v14+
- PostgreSQL v12+

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required variables (see `.env.example`)
4. Create PostgreSQL database: `it_support_tickets`
5. Run server: `npm start` or `npm run dev` (development)

### Database Setup
Tables are automatically created on first server run. Required tables:
- `users` - Store user accounts
- `tickets` - Store support tickets
- `ticket_comments` - Store ticket comments

---

## Security Features
- JWT-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS protection
- Helmet security headers
- SQL parameterized queries (PostgreSQL)
- Account active status checking

---

## Priority Levels
- Low
- Medium
- High
- Critical

## Status Options
- Open
- In Progress
- Resolved
- Closed

## Common Categories
- Hardware
- Software
- Network
- Email
- Printer
- Other
