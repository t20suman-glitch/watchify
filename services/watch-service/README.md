# Watch Service

Browse latest uploaded **videos** (public) and **watch** them when logged in (JWT from user-service).

## HTTP API

Base URL: `http://localhost:3003`

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/videos/latest` | No | Latest uploaded videos |
| `GET` | `/api/videos/:mediaId` | No | Video metadata |
| `GET` | `/api/videos/:mediaId/stream` | **Yes** | Stream video |
| `PATCH` | `/api/videos/:mediaId/progress` | **Yes** | Save watch position |
| `GET` | `/api/videos/history` | **Yes** | Your watch history |
| `GET` | `/health` | No | Health check |

## Flow

1. **List videos** (no login):
   ```http
   GET http://localhost:3003/api/videos/latest
   ```

2. **Login** via user-service → copy `access_token`

3. **Watch video**:
   ```http
   GET http://localhost:3003/api/videos/<mediaId>/stream
   Authorization: Bearer <token>
   ```
   Response headers include `X-Watch-Session-Id` and `X-Resume-Position-Seconds`.

4. **Save progress**:
   ```http
   PATCH http://localhost:3003/api/videos/<mediaId>/progress
   Authorization: Bearer <token>
   Content-Type: application/json

   { "positionSeconds": 120, "sessionId": "<from stream header>" }
   ```

## Environment

| Variable | Default |
|----------|---------|
| `MONGO_URI` | required |
| `PORT` | `50053` (gRPC) |
| `HTTP_PORT` | `3003` |
| `UPLOAD_SERVICE_URL` | `http://localhost:3002` |
| `JWT_SECRET` | must match **user-service** |
| `NODE_ENV` | unset — set `production` for JSON logs |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) |

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Upload-service must be running so watch-service can fetch videos.
