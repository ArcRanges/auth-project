**Problem Statement**

Using Node.js as your framework and Redis for data storage, we need an authentication API for internal services to create and authenticate users. This API should be RESTful and use JSON. It should be fast and secure, and be able to pass a basic security audit (e.g. password complexity). If there are areas of security that your solution hasn't had time to address they should be annotated for future development.

The API should be able to create a new login with a username and password, ensuring that usernames are unique. It should also be able to authenticate this login at a separate end point. It should respond with 200 OK messages for correct requests, and 401 for failing authentication requests. It should do proper error checking, with error responses in a JSON response body.

**Chosen Stack**

Frontend
NextJS

Backend
NestJS
Prisma
Redis
PostgreSQL
Docker

**MVP Features**

- Login and Registration
- Authorization and Validations
- CRUD for Users

**Test Cases**

User must be able to:

- create an account
- log in / log out
- make authorized requests
