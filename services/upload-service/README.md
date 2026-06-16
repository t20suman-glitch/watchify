# Upload Service

Upload **video** or **music** via HTTP REST or gRPC. No authentication required. Storage is behind a provider interface — **local disk now**, **AWS S3 later**.

## HTTP API

Base URL: `http://localhost:3002`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/uploads` | Multipart upload (`file` + fields) |
| `GET` | `/api/uploads` | List uploads (`?mediaType=video\|music`) |
| `GET` | `/api/uploads/:id` | Metadata |
| `GET` | `/api/uploads/:id/stream` | Stream/play file (local storage) |
| `GET` | `/health` | Health check |

### Upload (Postman)

- **Method:** `POST` → `http://localhost:3002/api/uploads`
- **Body:** `form-data` (not raw JSON)

| Key | Type | Required |
|-----|------|----------|
| `file` | **File** | yes — pick video or audio |
| `title` | **Text** | yes |
| `description` | **Text** | no |
| `mediaType` | **Text** | no — `video` or `music` |

**Important:** `title` must be **Text**, not File. Only `file` should be type File.

### Supported formats

- **Video:** mp4, webm, mov, avi, mkv
- **Music:** mp3, wav, flac, aac, ogg, webm audio

## Storage providers

| `STORAGE_PROVIDER` | Behavior |
|--------------------|----------|
| `local` (default) | Files saved under `UPLOAD_DIR` |
| `s3` | Stub in `src/storage/s3StorageProvider.js` — add `@aws-sdk/client-s3` when ready |

## Environment

| Variable | Default |
|----------|---------|
| `MONGO_URI` | required |
| `PORT` | `50052` (gRPC) |
| `HTTP_PORT` | `3002` (REST) |
| `STORAGE_PROVIDER` | `local` |
| `NODE_ENV` | unset — set `production` for JSON logs |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) |

## Run

```bash
npm install
cp .env.example .env
npm run dev
```
