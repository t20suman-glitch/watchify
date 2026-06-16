# User Service

User registration, login, and profile over **HTTP REST** and **gRPC**.

## HTTP API (Postman / browser)

| Method | Route | Body / headers |
|--------|-------|----------------|
| `POST` | `/api/users/register` | `{ "email", "username", "password" }` |
| `POST` | `/api/users/login` | `{ "email", "password" }` |
| `GET` | `/api/users/profile` | Header: `Authorization: Bearer <token>` |
| `GET` | `/health` | — |

Base URL: `http://localhost:3001` (see `HTTP_PORT`).

## gRPC API

| RPC | Port (default `50051`) |
|-----|------------------------|
| `CreateUser` | Same logic as register |
| `LoginUser` | Same logic as login |
| `GetProfile` | `{ "access_token": "..." }` |

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment

| Variable | Default |
|----------|---------|
| `MONGO_URI` | required |
| `PORT` | `50051` (gRPC) |
| `HTTP_PORT` | `3001` (REST) |
| `JWT_SECRET` | required in production |
| `NODE_ENV` | unset — set `production` for JSON logs |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) |
