# Psiborg API Documentation

## Overview

Psiborg is a task management API with role-based access control, featuring user authentication, team management, and comprehensive task operations.

## Features

- **User Authentication**: Registration, login, logout with JWT tokens
- **Role-Based Access Control**: Admin, Manager, and User roles
- **Task Management**: Complete CRUD operations with filtering and pagination
- **Team Management**: Team creation and member management
- **Security**: Rate limiting, input validation, and secure authentication
- **Email Verification**: Optional email confirmation system

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Roles and Permissions

### Admin

- Full access to all endpoints
- Can manage all users, teams, and tasks
- Can create, update, and delete teams
- Can assign any user to any task

### Manager

- Can manage tasks within their team
- Can assign tasks to team members
- Can view and update team information
- Cannot create or delete teams

### User

- Can create and manage their own tasks
- Can update status of tasks assigned to them
- Can view their team information
- Cannot assign tasks to others

## Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user.

**Request Body:**

```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, must contain uppercase, lowercase, number, special char)",
  "role": "string (optional: Admin, Manager, User)",
  "team": "string (optional: MongoDB ObjectId, required for Manager/User)"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "team": "string",
      "isEmailVerified": false
    },
    "accessToken": "string"
  }
}
```

#### POST /api/auth/login

Login with username/email and password.

**Request Body:**

```json
{
  "identifier": "string (username or email)",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "team": "object",
      "isEmailVerified": boolean
    },
    "accessToken": "string"
  }
}
```

#### POST /api/auth/logout

Logout current user (requires authentication).

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET /api/auth/profile

Get current user profile (requires authentication).

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "string",
      "team": "object",
      "isEmailVerified": boolean,
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

#### PUT /api/auth/profile

Update user profile (requires authentication).

**Request Body:**

```json
{
  "username": "string (optional)",
  "email": "string (optional)"
}
```

#### PUT /api/auth/change-password

Change user password (requires authentication).

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

#### POST /api/auth/refresh

Refresh access token using refresh token.

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

### Task Endpoints

#### POST /api/tasks

Create a new task (requires authentication).

**Request Body:**

```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (optional, max 1000 chars)",
  "dueDate": "string (ISO 8601 date, must be in future)",
  "priority": "string (optional: Low, Medium, High)",
  "status": "string (optional: Pending, In Progress, Completed)",
  "assignedTo": "string (optional: MongoDB ObjectId)"
}
```

#### GET /api/tasks

Get all tasks with filtering and pagination (requires authentication).

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `priority`: Filter by priority
- `assignedTo`: Filter by assigned user ID
- `createdBy`: Filter by creator user ID
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (asc/desc, default: desc)
- `search`: Search in title and description

**Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTasks": 50,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### GET /api/tasks/my-tasks

Get tasks assigned to current user (requires authentication).

#### GET /api/tasks/stats

Get task statistics for current user's scope (requires authentication).

#### GET /api/tasks/:taskId

Get specific task by ID (requires authentication and appropriate access).

#### PUT /api/tasks/:taskId

Update task (requires authentication and appropriate access).

#### DELETE /api/tasks/:taskId

Delete task (requires authentication and appropriate access).

#### PUT /api/tasks/:taskId/assign

Assign task to user (requires Admin or Manager role).

**Request Body:**

```json
{
  "assignedTo": "string (MongoDB ObjectId)"
}
```

### Team Endpoints

#### POST /api/teams

Create a new team (Admin only).

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "manager": "string (required: MongoDB ObjectId)",
  "members": ["string"] (optional: array of MongoDB ObjectIds)
}
```

#### GET /api/teams

Get all teams with pagination (Admin only).

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in team name

#### GET /api/teams/my-team

Get current user's team (requires authentication).

#### GET /api/teams/:teamId

Get specific team by ID (requires authentication and team access).

#### GET /api/teams/:teamId/members

Get team members (requires authentication and team access).

#### PUT /api/teams/:teamId

Update team (Admin only).

#### POST /api/teams/:teamId/members

Add member to team (Admin and Manager only).

**Request Body:**

```json
{
  "userId": "string (MongoDB ObjectId)"
}
```

#### DELETE /api/teams/:teamId/members/:userId

Remove member from team (Admin and Manager only).

#### DELETE /api/teams/:teamId

Delete team (Admin only).

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Additional error details"] // Optional
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Login: 5 attempts per 15 minutes per IP
- Registration: 5 attempts per hour per IP

## Environment Variables

Create a `.env` file in the server directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/psiborg

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@psiborg.com
```

## Getting Started

1. **Install Dependencies:**

   ```bash
   cd server
   npm install
   ```

2. **Set Up Environment:**

   - Copy the environment variables above to a `.env` file
   - Update the MongoDB URI and JWT secrets

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the Server:**

   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

5. **Test the API:**
   The server will start on `http://localhost:3000`

## Example Usage

### 1. Register a new user:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "User"
  }'
```

### 2. Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Create a task:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "priority": "High"
  }'
```

### 4. Get tasks:

```bash
curl -X GET "http://localhost:3000/api/tasks?page=1&limit=10&status=Pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Considerations

1. **Password Requirements:**

   - Minimum 8 characters
   - Must contain uppercase, lowercase, number, and special character

2. **Rate Limiting:**

   - Implemented to prevent brute force attacks
   - Different limits for different endpoints

3. **JWT Security:**

   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens are invalidated on logout

4. **Input Validation:**

   - All inputs are validated and sanitized
   - MongoDB injection prevention
   - XSS protection through input validation

5. **CORS Configuration:**
   - Configured for specific origins in production
   - Credentials support for authentication

This API provides a robust foundation for task management applications with proper security, role-based access control, and comprehensive error handling.
