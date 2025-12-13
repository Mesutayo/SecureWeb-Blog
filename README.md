# Blog Web Application

A basic blog web application with CRUD operations and role-based access control.

## Features

- **CRUD Operations**: Create, Read, Update, and Delete blog posts
- **User Authentication**: Registration and login system
- **Role-Based Access**: Two user roles - Admin and Regular User
- **Database Layer**: SQLite database for data persistence
- **RESTful API**: Express.js backend with REST endpoints
- **React Frontend**: Modern UI for interacting with the blog

## User Roles

1. **Admin**: Can create, edit, and delete any post
2. **User**: Can create posts and edit/delete only their own posts

## Prerequisites

- Node.js (v14 or higher) and npm
- If you don't have Node.js installed

Then install Node.js:

```bash
brew install node
```

## After Installing Node.js

Once Node.js is installed, you can proceed with setting up the blog application:

## Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

Or use the combined command:
```bash
npm run install-all
```

## Running the Application

1. Start the backend server:
```bash
npm start
# or for development with nodemon for auto-reload :
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
npm run client
```

The backend will run on `http://localhost:5050`
The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires authentication)

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post (requires authentication)
- `PUT /api/posts/:id` - Update post (requires authentication, author or admin only)
- `DELETE /api/posts/:id` - Delete post (requires authentication, author or admin only)

## Security Notes

This application is intentionally built with basic security measures to allow for security improvements. The application is designed to be flexible enough for security enhancements. Some intentional vulnerabilities/areas that could be enhanced:

### Current Security Issues (Intentional):

1. **Role Assignment**: Users can register with any role (including admin) - no validation
2. **Weak JWT Secret**: Default JWT secret is hardcoded and weak
3. **No Input Validation**: Limited input validation and sanitization
4. **No XSS Protection**: User-generated content is not sanitized
5. **No CSRF Protection**: No CSRF tokens implemented
6. **No Rate Limiting**: API endpoints are not rate-limited
7. **Weak Password Policy**: No password strength requirements
8. **No Token Refresh**: JWT tokens don't have refresh mechanism
9. **No HTTPS Enforcement**: Application doesn't enforce secure connections
10. **CORS Configuration**: CORS is open to all origins
11. **Error Messages**: Detailed error messages may leak information

### Security Improvements That Can Be Made:

- Implement proper role-based access control (RBAC)
- Add input validation and sanitization libraries
- Implement XSS protection with Content Security Policy
- Add CSRF tokens for state-changing operations
- Implement rate limiting on authentication endpoints
- Add password strength requirements and complexity rules
- Implement JWT refresh tokens
- Enforce HTTPS in production
- Configure CORS properly for production
- Sanitize error messages to prevent information leakage
- Add request logging and monitoring
- Implement session management best practices

## Project Structure

```
.
├── server/
│   ├── index.js          # Main server file
│   ├── database/
│   │   └── db.js         # Database
│   └── routes/
│       ├── auth.js       # Authentication routes
│       └── posts.js      # Blog post routes
├── client/               # React frontend
└── package.json

```

## Testing the Application

### As Admin:
- Can create posts
- Can edit any post
- Can delete any post

### As Regular User:
- Can create posts
- Can edit only your own posts
- Can delete only your own posts

## API Testing

You can test the API directly using tools like Postman or curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get all posts
curl http://localhost:5000/api/posts

# Create a post (replace TOKEN with actual token)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"My First Post","content":"This is the content"}'
```

