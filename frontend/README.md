# Frontend — Auth Project (Next.js)

Next.js web application for testing and interacting with the NestJS authentication backend.

## Features

- **Authentication UI** - Register, login, logout
- **Session Management** - View and manage active sessions
- **User Profile** - View and update user information
- **Protected Routes** - Automatic JWT token handling
- **TypeScript** - Full type safety
- **Tailwind CSS** - Modern, responsive styling

## Prerequisites

- Node.js >= 18 (Node 20+ recommended)
- Backend API running on `http://localhost:3000`

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**
   Create `.env.local` in the frontend directory:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3001
   ```

## Environment Variables

Create a `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## API Integration

The frontend communicates with the backend API at `http://localhost:3000`.

### Authentication Flow

1. **Register:** `POST /auth/register`
2. **Login:** `POST /auth/login` - Returns access & refresh tokens
3. **Authenticated Requests:** Include `Authorization: Bearer <token>` header
4. **Token Refresh:** `POST /auth/refresh` - Auto-refresh expired tokens
5. **Logout:** `POST /auth/logout` - Blacklist tokens

### Backend Endpoints

**Authentication**

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

**Sessions**

- `GET /auth/sessions` - List active sessions
- `DELETE /auth/sessions` - Revoke all sessions
- `DELETE /auth/sessions/:sessionId` - Revoke specific session

**Users**

- `GET /users/current` - Get current user
- `PATCH /users/current` - Update current user
- `DELETE /users/current` - Delete current user

## Development

Run the development server (available at `http://localhost:3001`):

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

## Testing the Integration

1. **Ensure backend is running:**

   ```bash
   cd ../backend
   npm run start:dev
   ```

2. **Start frontend:**

   ```bash
   npm run dev
   ```

3. **Test the flow:**
   - Navigate to `http://localhost:3001`
   - Register a new account
   - Login and test protected routes
   - Backend Swagger docs: `http://localhost:3000/api/docs`

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ESLint** - Code linting

## Common Issues

**CORS Errors:** Ensure backend CORS is configured for `http://localhost:3001`

**Connection Refused:** Verify backend is running on port 3000

**Token Expiration:** Access tokens expire after 1 hour (configurable in backend)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Backend README](../backend/README.md)
- [API Docs](http://localhost:3000/api/docs) (when backend is running)

## License

MIT
