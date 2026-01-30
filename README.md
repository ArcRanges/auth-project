# Auth Project

Full-stack authentication application with session management, rate limiting, and user management.

## Project Structure

```
auth-project/
├── backend/          # NestJS REST API
└── frontend/         # Next.js web application
```

## Backend (NestJS)

REST API for authentication, session management, rate limiting, and user CRUD.

- **Runtime:** NestJS + Prisma (PostgreSQL)
- **Redis:** sessions, token blacklist, and rate limiting
- **Docs:** Swagger UI at `http://localhost:3000/api/docs`

**Quick Start:**

```bash
cd backend
npm install
docker compose up -d  # Start Redis
npm run prisma:migrate
npm run start:dev
```

See [backend/README.md](backend/README.md) for detailed setup instructions.

### API Endpoints

**Authentication**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

**Sessions**

- `GET /auth/sessions` - List active sessions
- `DELETE /auth/sessions` - Revoke all sessions
- `DELETE /auth/sessions/:sessionId` - Revoke specific session

**Users** (JWT-protected)

- `GET /users` - List all users
- `GET /users/current` - Get current user
- `GET /users/:id` - Get user by ID
- `PATCH /users/current` - Update current user
- `DELETE /users/current` - Delete current user

## Frontend (Next.js)

Modern React-based web application for testing and interacting with the backend API.

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **API Client:** Fetch API with TypeScript
- **Features:** Authentication, session management, user profile

**Quick Start:**

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3001` to access the frontend.

See [frontend/README.md](frontend/README.md) for detailed setup instructions.

## Development Workflow

1. **Start Backend:**

   ```bash
   cd backend
   docker compose up -d  # Redis
   npm run start:dev
   ```

2. **Start Frontend:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Integration:**
   - Frontend: `http://localhost:3001`
   - Backend API: `http://localhost:3000`
   - Swagger Docs: `http://localhost:3000/api/docs`

## Environment Setup

### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_project_db?schema=public
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Tech Stack

### Backend

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Rate Limiting (Redis-backed)

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui (optional)

## Prerequisites

- Node.js >= 18 (Node 20+ recommended)
- PostgreSQL 15+
- Redis 7+
- Docker Desktop (optional, for Redis)

## Testing the Integration

1. **Register a new user:**
   - Use the frontend registration form
   - Or via curl: `curl -X POST http://localhost:3000/auth/register -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'`

2. **Login:**
   - Use the frontend login form
   - Tokens are stored in browser storage

3. **Access protected routes:**
   - View profile
   - Update user information
   - Manage sessions
   - List users

## Features

✅ User registration with password validation  
✅ Email/password authentication  
✅ JWT-based access & refresh tokens  
✅ Session management (Redis-backed)  
✅ Token blacklisting on logout  
✅ Rate limiting (IP-based and user-based)  
✅ User CRUD operations  
✅ Swagger API documentation  
✅ Frontend integration ready

## Future Updates

- **Role Management:** Role-based access control (RBAC) with admin, user, and custom roles
  - Admin-only access to user management features
  - Permission-based API endpoint protection
  - Role assignment and management interface

## License

MIT
