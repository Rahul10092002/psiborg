# Psiborg API Server

A comprehensive task management API with role-based access control, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin, Manager, User)
  - Secure password hashing with bcrypt
  - Rate limiting for security

- **User Management**

  - User registration and login
  - Profile management
  - Password change functionality
  - Email verification support

- **Task Management**

  - Complete CRUD operations
  - Task assignment and status tracking
  - Filtering, sorting, and pagination
  - Role-based task access control

- **Team Management**

  - Team creation and management
  - Member assignment and removal
  - Manager-specific operations

- **Security Features**
  - Input validation and sanitization
  - CORS configuration
  - Helmet security headers
  - Rate limiting
  - JWT token security

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the server root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/psiborg

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@psiborg.com
```

### 3. Seed Database (Optional)

To populate the database with sample data:

```bash
npm run seed
```

This creates:

- Admin user: `admin@psiborg.com` / `AdminPass123!`
- Manager user: `manager1@psiborg.com` / `ManagerPass123!`
- Regular users: `user1@psiborg.com` / `UserPass123!` and `user2@psiborg.com` / `UserPass123!`
- Sample team and tasks

### 4. Start the Server

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick API Overview

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

#### Tasks

- `GET /api/tasks` - Get all tasks (with filtering)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/my-tasks` - Get user's tasks
- `GET /api/tasks/stats` - Get task statistics

#### Teams

- `GET /api/teams` - Get all teams (Admin only)
- `POST /api/teams` - Create team (Admin only)
- `GET /api/teams/my-team` - Get user's team
- `GET /api/teams/:id` - Get specific team
- `PUT /api/teams/:id` - Update team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

## 🔐 Role-Based Access Control

### Admin

- Full access to all endpoints
- Can manage users, teams, and tasks
- Can create and delete teams
- Can assign any user to any task

### Manager

- Can manage tasks within their team
- Can assign tasks to team members
- Can add/remove team members
- Cannot create or delete teams

### User

- Can create and manage their own tasks
- Can update status of assigned tasks
- Can view team information
- Limited to their own scope

## 🏗️ Project Structure

```
server/
├── controllers/          # Route handlers
│   ├── authController.js    # Authentication logic
│   ├── taskController.js    # Task management
│   └── teamController.js    # Team management
├── middleware/           # Custom middleware
│   └── auth.js             # Authentication & authorization
├── models/              # Database schemas
│   ├── user.js             # User model
│   ├── task.js             # Task model
│   └── team.js             # Team model
├── routes/              # API routes
│   ├── auth.js             # Auth routes
│   ├── tasks.js            # Task routes
│   └── teams.js            # Team routes
├── utils/               # Utility functions
│   ├── validation.js       # Input validation
│   └── errorHandler.js     # Error handling
├── index.js             # Server entry point
├── seed.js              # Database seeding
└── .env                 # Environment variables
```

## 🧪 Testing the API

### Using curl

1. **Register a new user:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "role": "User"
  }'
```

2. **Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "TestPass123!"
  }'
```

3. **Create a task (requires auth token):**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "priority": "Medium"
  }'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for base URL and auth token
3. Use the authentication endpoints to get a JWT token
4. Include the token in the Authorization header for protected routes

## 🔧 Development

### Code Style

- ES6+ JavaScript with modules
- Async/await for asynchronous operations
- Consistent error handling patterns
- Input validation on all endpoints

### Adding New Features

1. **New Model**: Add to `models/` directory
2. **New Controller**: Add to `controllers/` directory
3. **New Routes**: Add to `routes/` directory and register in `index.js`
4. **New Middleware**: Add to `middleware/` directory
5. **New Validation**: Add to `utils/validation.js`

### Database Schema Changes

1. Update the relevant model in `models/`
2. Test with existing data
3. Consider migration scripts for production

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
FRONTEND_URL=https://your-production-frontend.com
```

### Security Considerations

1. Use strong, unique JWT secrets
2. Enable HTTPS in production
3. Use environment variables for all secrets
4. Consider using a key management service
5. Regular security audits

### Performance

- MongoDB indexes are recommended for frequently queried fields
- Consider Redis for session management in high-traffic scenarios
- Implement database connection pooling
- Add response caching where appropriate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

- Check the API documentation
- Review the error messages and logs
- Ensure all environment variables are set correctly
- Verify MongoDB connection

## 🔄 Changelog

### v1.0.0

- Initial release
- User authentication and authorization
- Task management with CRUD operations
- Team management
- Role-based access control
- Comprehensive error handling
- API documentation
