# Auth Project — Backend (NestJS)

REST API for authentication, session management, rate limiting, and user CRUD.

- **Runtime:** NestJS + Prisma (PostgreSQL)
- **Redis:** sessions, token blacklist, and rate limiting
- **Docs:** Swagger UI at `http://localhost:<PORT>/api/docs`

## Features

- **Auth**
  - `POST /auth/register` (password policy enforced)
  - `POST /auth/login`
  - `POST /auth/refresh` (refresh token → new access token)
  - `POST /auth/logout` (requires Bearer access token; can also blacklist refresh token)
- **Sessions (Redis-backed)**
  - `GET /auth/sessions` list active sessions
  - `DELETE /auth/sessions` revoke all sessions
  - `DELETE /auth/sessions/:sessionId` revoke one session
- **Users (JWT-protected)**
  - `GET /users` list users
  - `GET /users/current` get current user
  - `GET /users/:id` get user by id
  - `PATCH /users/current` update current user
  - `DELETE /users/current` delete current user
- **Rate limiting (Redis-backed)**
  - Global guard with per-route overrides (e.g., tighter limits on auth endpoints)
  - Subject key is `user:<id>` when authenticated, otherwise `ip:<ip>`

## Prerequisites

- Node.js `>= 18` (Node `20+` recommended)
- PostgreSQL `15+` (local or hosted)
- Redis `7+` (local or Docker)
- Docker Desktop (optional, recommended for Redis locally)

## Local development (recommended)

From `auth-project/backend`:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Redis (Docker):
   ```bash
   docker compose up -d
   ```
3. Start PostgreSQL (choose one):
   - Local (macOS/Homebrew example):
     ```bash
     brew install postgresql@15
     brew services start postgresql@15
     createdb auth_project_db
     ```
   - Docker:
     ```bash
     docker run --name auth-project-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=auth_project_db -p 5432:5432 -d postgres:15-alpine
     ```
4. Create `.env` (see “Environment variables” below).
5. Apply Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```
6. Start the API:
   ```bash
   npm run start:dev
   ```
7. Open Swagger:
   - `http://localhost:3000/api/docs`

## Environment variables

Create `backend/.env` (or `.env` if your working directory is `backend/`). It is intentionally gitignored.

**Required**

- `DATABASE_URL` - PostgreSQL connection string (example):
  - `postgresql://postgres:postgres@localhost:5432/auth_project_db?schema=public`
- `JWT_SECRET` - used to sign JWTs (use a strong secret in staging/prod; `>= 32` chars recommended)

**Auth token configuration**

- `JWT_EXPIRES_IN` - access token TTL (default: `1h`)
- `JWT_REFRESH_EXPIRES_IN` - refresh token TTL (default: `7d`)

**Redis**

- `REDIS_HOST` (default: `localhost`)
- `REDIS_PORT` (default: `6379`)
- `REDIS_PASSWORD` (optional; if set, Redis must be configured with `requirepass`)
- `REDIS_TTL` - default cache TTL in seconds (default: `3600`)

**Rate limiting**

- `RATE_LIMIT_TTL` - window size in seconds (default: `60`)
- `RATE_LIMIT_LIMIT` - requests allowed per window (default: `100`)

**App**

- `PORT` (default: `3000`)
- `NODE_ENV` (use `production` for staging/prod)
- `TRUST_PROXY` - set to `true` when running behind a reverse proxy/load balancer so IP-based rate limiting uses `X-Forwarded-For`

## Quick API smoke test (curl)

1. Register:
   ```bash
   curl -s -X POST http://localhost:3000/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'
   ```
2. Login:
   ```bash
   curl -s -X POST http://localhost:3000/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"test@example.com","password":"Password123"}'
   ```
3. Use the returned `access_token` as a Bearer token:
   ```bash
   curl -s http://localhost:3000/auth/profile -H 'Authorization: Bearer <ACCESS_TOKEN>'
   ```

## Staging / Production setup

At a minimum you need reachable **PostgreSQL** + **Redis**, and all env vars set via your deployment environment (recommended) or a `.env` file.

1. Set environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET` (strong secret)
   - `DATABASE_URL` (hosted/staging DB)
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (if applicable)
   - `TRUST_PROXY=true` if behind a reverse proxy
2. Run database migrations (recommended flow for non-dev deployments):
   ```bash
   npx prisma migrate deploy
   ```
   (Use `npm run prisma:migrate` for local development; it runs `prisma migrate dev`.)
3. Build and run:
   ```bash
   npm ci
   npm run build
   npm run start:prod
   ```

## Useful commands

- `npm run start:dev` - start API in watch mode
- `npm run prisma:studio` - inspect the database
- `npm test` - run unit tests

### Notes

- Redis is a **hard dependency** for sessions + token blacklisting; the API may not start if Redis is unreachable.
- Rate limiting is configured to **fail open** if Redis is unavailable (requests are allowed), to avoid taking the API down due to rate-limit infrastructure issues.
