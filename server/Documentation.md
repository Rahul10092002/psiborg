# Psiborg Server Documentation

## Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Environment Variables](#environment-variables)
4. [Running the Application](#running-the-application)
5. [Database Seeding](#database-seeding)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Design Decisions & Assumptions](#design-decisions--assumptions)
9. [Error Handling](#error-handling)

---

## Overview

Psiborg is a task management application built with Node.js, Express, and MongoDB. It provides a RESTful API for managing users, teams, and tasks with role-based access control (RBAC).

### Key Features
- User authentication with JWT tokens
- Role-based access control (Admin, Manager, User)
- Team management
- Task creation and assignment
- Comprehensive input validation
- Security best practices (Helmet, CORS, rate limiting)

### Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Validation**: express-validator

---

## Setup Instructions

### Prerequisites
Before setting up the application, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (for cloning the repository)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd psiborg/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy the `.env.example` file to create your `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file with your configuration (see [Environment Variables](#environment-variables) section)

4. **Set up MongoDB**
   - **Option A: Local MongoDB**
     - Install MongoDB on your machine
     - Start the MongoDB service
     - Use the default URI: `mongodb://localhost:27017/psiborg`

   - **Option B: MongoDB Atlas (Cloud)**
     - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - Create a cluster and get your connection string
     - Add your connection string to the `MONGODB_URI` variable in `.env`

5. **Seed the database (optional but recommended)**
   ```bash
   npm run seed
   ```
   This creates default users and sample data for testing.

---

## Environment Variables

Create a `.env` file in the server directory with the following variables:

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Application environment | `development` | `development` or `production` |
| `PORT` | Server port number | `3000` | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/psiborg` | `mongodb://localhost:27017/psiborg` or MongoDB Atlas URI |
| `JWT_SECRET` | Secret key for JWT signing | - | `your-super-secret-jwt-key-change-this-in-production` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` | `7d`, `24h`, `30m` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` | `http://localhost:5173` |
| `BCRYPT_ROUNDS` | BCrypt hashing rounds | `12` | `12` |
| `PASSWORD_MIN_LENGTH` | Minimum password length | `8` | `8` |
| `LOG_LEVEL` | Logging level | `info` | `info`, `debug`, `error` |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | `15` | `15` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | `100` |
| `AUTH_RATE_LIMIT_MAX` | Auth endpoint rate limit | `5` | `5` |

### Email Configuration (Optional)
For email functionality (currently optional):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Psiborg Task Manager
```

### Security Note
- **NEVER** commit the `.env` file to version control
- Change the `JWT_SECRET` to a strong, random value in production
- Use strong passwords and keep credentials secure

---

## Running the Application

### Development Mode
Start the server with auto-reload on file changes:
```bash
npm run dev
```

### Production Mode
Start the server in production mode:
```bash
npm start
```

### Seeding the Database
Populate the database with sample data:
```bash
npm run seed
```

### Verifying the Server
Once the server is running, you should see output like:
```
Connected to MongoDB
 Auth routes loaded
 Task routes loaded
 Team routes loaded
 User routes loaded
=€ Server is running on port 3000
=Ú API Documentation: Check API_DOCUMENTATION.md
< Environment: development
= Health Check: http://localhost:3000/health
```

### Health Check
Test if the server is running:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-24T...",
  "uptime": 123.456,
  "database": "connected"
}
```

---

## Database Seeding

The seed script creates default users and sample tasks for testing purposes.

### Default Test Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | `admin@psiborg.com` | `AdminPass123!` | Full system access |
| Manager | `manager1@psiborg.com` | `ManagerPass123!` | Team management |
| User | `user1@psiborg.com` | `UserPass123!` | Basic task access |
| User | `user2@psiborg.com` | `UserPass123!` | Basic task access |

### What Gets Created
- 1 Admin user
- 1 Manager user
- 2 Regular users
- 1 Development Team with all users
- 5 Sample tasks with different priorities and statuses

### Running the Seed Script
```bash
npm run seed
```

**Note**: This will delete all existing data before seeding!

---

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints (`/api/auth`)

#### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/auth/register` | Register a new user | `{ username, email, password, role?, team? }` |
| `POST` | `/auth/login` | Login user | `{ email, password }` |
| `POST` | `/auth/refresh` | Refresh JWT token | `{ refreshToken }` |

#### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/auth/logout` | Logout user | - |
| `GET` | `/auth/profile` | Get current user profile | - |
| `PUT` | `/auth/profile` | Update user profile | `{ username?, email? }` |
| `PUT` | `/auth/change-password` | Change password | `{ currentPassword, newPassword }` |

#### Example: Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "User"
  }'
```

#### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@psiborg.com",
    "password": "AdminPass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "username": "admin",
      "email": "admin@psiborg.com",
      "role": "Admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Task Endpoints (`/api/tasks`)

All task endpoints require authentication.

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| `GET` | `/tasks` | Get all tasks (with filters) | All authenticated users |
| `GET` | `/tasks/stats` | Get task statistics | All authenticated users |
| `GET` | `/tasks/my-tasks` | Get tasks assigned to current user | All authenticated users |
| `GET` | `/tasks/:taskId` | Get specific task by ID | Task creator/assignee/admin |
| `POST` | `/tasks` | Create a new task | All authenticated users |
| `PUT` | `/tasks/:taskId` | Update a task | Task creator/assignee/admin |
| `DELETE` | `/tasks/:taskId` | Delete a task | Task creator/admin |
| `PUT` | `/tasks/:taskId/assign` | Assign task to user | Admin/Manager only |

#### Query Parameters for GET `/tasks`
- `status` - Filter by status (Pending, In Progress, Completed)
- `priority` - Filter by priority (Low, Medium, High)
- `page` - Page number for pagination (default: 1)
- `limit` - Items per page (default: 10)

#### Example: Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Implement login feature",
    "description": "Create user authentication system",
    "dueDate": "2025-11-01T00:00:00.000Z",
    "priority": "High",
    "status": "Pending"
  }'
```

#### Example: Get My Tasks
```bash
curl http://localhost:3000/api/tasks/my-tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Team Endpoints (`/api/teams`)

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| `GET` | `/teams/public` | Get teams for registration | Public |
| `GET` | `/teams/my-team` | Get current user's team | Authenticated users |
| `GET` | `/teams` | Get all teams | Admin only |
| `GET` | `/teams/:teamId` | Get specific team | Admin/Team members |
| `GET` | `/teams/:teamId/members` | Get team members | Admin/Team members |
| `POST` | `/teams` | Create a new team | Admin only |
| `PUT` | `/teams/:teamId` | Update team | Admin only |
| `DELETE` | `/teams/:teamId` | Delete team | Admin only |
| `POST` | `/teams/:teamId/members` | Add team member | Admin/Manager |
| `DELETE` | `/teams/:teamId/members/:userId` | Remove team member | Admin/Manager |

#### Example: Create Team
```bash
curl -X POST http://localhost:3000/api/teams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Frontend Team",
    "manager": "USER_ID_HERE"
  }'
```

---

### User Endpoints (`/api/users`)

All endpoints require authentication.

| Method | Endpoint | Description | Access Level |
|--------|----------|-------------|--------------|
| `GET` | `/users` | Get all users | Admin only |
| `GET` | `/users/stats` | Get user statistics | Admin only |
| `GET` | `/users/team-members` | Get team members | Admin/Manager |
| `GET` | `/users/:userId` | Get user by ID | Admin only |
| `POST` | `/users` | Create a new user | Admin/Manager |
| `PUT` | `/users/:userId` | Update user | Admin only |
| `DELETE` | `/users/:userId` | Delete user | Admin only |

#### Example: Get All Users
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Authentication & Authorization

### JWT Token Authentication

The API uses JWT (JSON Web Tokens) for authentication. After logging in, you receive a token that must be included in subsequent requests.

#### Including the Token
Add the token to the `Authorization` header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Token Expiration
- Default expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
- Use the `/auth/refresh` endpoint to get a new token

### Role-Based Access Control (RBAC)

Three user roles with different permissions:

#### Admin
- Full system access
- Can create, read, update, and delete all resources
- Can manage all users, teams, and tasks
- Can assign any role to users

#### Manager
- Can manage their own team
- Can create users within their team
- Can assign tasks to team members
- Can add/remove team members
- Limited to their own team's data

#### User
- Can view and update their own profile
- Can create tasks
- Can view tasks assigned to them
- Can update tasks they created or are assigned to
- Limited access to team information

### Security Features

1. **Password Security**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, number, and special character
   - Hashed using bcrypt with 12 rounds

2. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Authentication endpoints: 5 requests per 15 minutes
   - Currently disabled in development (can be enabled in [index.js:65-81](server/index.js#L65-L81))

3. **Security Headers**
   - Helmet.js for security headers
   - CORS configured for specific origins
   - Cookie security settings

4. **Input Validation**
   - All inputs validated using express-validator
   - MongoDB ID validation
   - Email format validation
   - Custom validation rules for business logic

---

## Design Decisions & Assumptions

### Architecture Decisions

1. **ES Modules (ESM)**
   - Using `import/export` instead of CommonJS `require`
   - Configured via `"type": "module"` in [package.json:7](server/package.json#L7)
   - Modern JavaScript standard for better tree-shaking and compatibility

2. **Middleware-Based Architecture**
   - Separation of concerns with dedicated middleware
   - Authentication middleware for protected routes
   - Role-based middleware for authorization
   - Validation middleware for input sanitization

3. **Controller-Route Pattern**
   - Routes define endpoints and middleware chains
   - Controllers handle business logic
   - Clean separation makes code maintainable

4. **Error Handling Strategy**
   - Centralized error handler in [utils/errorHandler.js](server/utils/errorHandler.js)
   - Graceful shutdown on critical errors
   - MongoDB connection monitoring
   - Comprehensive logging

5. **Database Design**
   - Normalized schema with references between collections
   - Indexed fields for performance (email, username)
   - Mongoose ODM for schema validation and middleware

### Key Assumptions

1. **User Registration**
   - Users can self-register with "User" role
   - Admins can create users with any role
   - Email verification is tracked but not enforced (future feature)

2. **Team Structure**
   - Each team has one manager
   - Users belong to at most one team
   - Teams are optional for users
   - Admin users don't require team membership

3. **Task Management**
   - Tasks belong to one team
   - Tasks can be assigned to one user
   - Task creators have special permissions
   - Tasks can exist without being assigned

4. **Authentication Flow**
   - JWT tokens stored by client (localStorage/cookies)
   - Tokens expire after 7 days by default
   - Refresh tokens used for token renewal
   - Logout invalidates token on client side

5. **CORS Policy**
   - Development: Allows localhost:3000 and localhost:5173
   - Production: Requires specific frontend URL
   - Credentials enabled for cookie-based auth

6. **Rate Limiting**
   - Currently disabled for development convenience
   - Should be enabled in production
   - Separate limits for auth vs general endpoints

7. **Data Validation**
   - Usernames: 3-30 characters, alphanumeric + underscore
   - Passwords: Minimum 8 characters with complexity requirements
   - MongoDB ObjectIDs validated for all references
   - Email addresses normalized and validated

### Security Assumptions

1. **Environment Variables**
   - Assumed to be properly secured in production
   - JWT_SECRET should be cryptographically random
   - Database credentials properly protected

2. **HTTPS**
   - Assumed HTTPS is used in production
   - Cookies configured for secure transmission

3. **Database Security**
   - MongoDB authentication enabled in production
   - Network access properly restricted
   - Regular backups maintained

### Future Enhancements (Not Implemented)

1. Email verification for new users
2. Password reset functionality
3. File upload for task attachments
4. Real-time notifications (WebSocket/SSE)
5. Task comments and activity logs
6. Advanced search and filtering
7. User profile images
8. Two-factor authentication (2FA)
9. Audit logs for admin actions
10. Task templates and recurring tasks

---

## Error Handling

### Error Response Format

All errors follow a consistent format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (e.g., email already exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server errors |

### Example Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "message": "Authentication required. Please log in."
}
```

#### Authorization Error (403)
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to perform this action."
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "message": "Task not found"
}
```

### Error Handling Features

1. **Global Error Handler**
   - Catches all unhandled errors
   - Provides consistent error responses
   - Logs errors for debugging

2. **Validation Errors**
   - Field-specific error messages
   - Multiple validation errors returned together
   - Client-friendly error descriptions

3. **Database Errors**
   - MongoDB connection monitoring
   - Automatic reconnection attempts
   - Graceful degradation

4. **Process Error Handlers**
   - Uncaught exception handler
   - Unhandled promise rejection handler
   - Graceful shutdown on SIGTERM/SIGINT

---

## Testing the API

### Using cURL

Example workflow for testing:

1. **Register a user**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!"}'
```

2. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

3. **Use the token from login response**
```bash
TOKEN="your_jwt_token_here"
```

4. **Create a task**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My Task","description":"Task description","priority":"High","status":"Pending"}'
```

5. **Get your tasks**
```bash
curl http://localhost:3000/api/tasks/my-tasks \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman or Insomnia

1. Import the API endpoints
2. Set base URL: `http://localhost:3000/api`
3. Configure authentication header: `Authorization: Bearer <token>`
4. Create requests for each endpoint

---

## Additional Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Express.js Documentation**: https://expressjs.com/
- **Mongoose Documentation**: https://mongoosejs.com/
- **JWT Documentation**: https://jwt.io/

## Support

For issues or questions:
1. Check the error messages in the server logs
2. Verify environment variables are correctly set
3. Ensure MongoDB is running and accessible
4. Check that all dependencies are installed

---

**Last Updated**: October 2025
**Version**: 1.0.0
