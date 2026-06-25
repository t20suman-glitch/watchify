# Upload Service

Upload **video** or **music** via HTTP REST or gRPC. No authentication required. Storage uses **AWS S3** (EKS) or **local disk** (dev).

## Storage providers

| `STORAGE_PROVIDER` | Use case |
|--------------------|----------|
| `s3` (default in `.env.example`) | EKS — IRSA + VPC Gateway endpoint |
| `local` | Docker Compose / laptop — files under `UPLOAD_DIR` |

### S3 on EKS (recommended)

- **Auth:** IRSA — no `AWS_ACCESS_KEY_ID` in pods
- **Network:** S3 Gateway VPC endpoint — no public internet
- **Config:** `AWS_REGION`, `AWS_S3_BUCKET`
- **Optional:** `AWS_S3_ENDPOINT_URL` only for Interface endpoint without Private DNS

See [deploy/k8s/README.md](../../deploy/k8s/README.md).

## HTTP API

Base URL: `http://localhost:3002`

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/uploads` | Multipart upload (`file` + fields) |
| `GET` | `/api/uploads` | List uploads (`?mediaType=video\|music`) |
| `GET` | `/api/uploads/:id` | Metadata |
| `GET` | `/api/uploads/:id/stream` | Stream/play file |
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
| `s3` | Files in `AWS_S3_BUCKET` (EKS default in k8s ConfigMap) |
| `local` | Files saved under `UPLOAD_DIR` (docker-compose dev) |

### S3 credentials

| Setup | Variables |
|-------|-----------|
| **EKS (IRSA)** | `AWS_REGION`, `AWS_S3_BUCKET` only |
| **Local / dev** | + `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| **VPC Interface endpoint (rare)** | + `AWS_S3_ENDPOINT_URL`, `AWS_S3_FORCE_PATH_STYLE=true` |

## Environment

| Variable | Default |
|----------|---------|
| `MONGO_URI` | required |
| `PORT` | `50052` (gRPC) |
| `HTTP_PORT` | `3002` (REST) |
| `STORAGE_PROVIDER` | `local` in code; `s3` in k8s ConfigMap |
| `UPLOAD_DIR` | `./uploads` (local only) |
| `MAX_FILE_SIZE_MB` | `500` |
| `AWS_REGION` | required when `s3` |
| `AWS_S3_BUCKET` | required when `s3` |
| `AWS_S3_ENDPOINT_URL` | optional |
| `AWS_S3_FORCE_PATH_STYLE` | optional — `true` with custom endpoint |
| `AWS_ACCESS_KEY_ID` | optional — IRSA / instance profile if unset |
| `AWS_SECRET_ACCESS_KEY` | optional |
| `NODE_ENV` | unset — set `production` for JSON logs |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) |

## Run (local with S3)

```bash
npm install
cp .env.example .env   # set AWS_* and STORAGE_PROVIDER=s3
npm run dev
```

## Run (local disk)

Set `STORAGE_PROVIDER=local` and `UPLOAD_DIR=./uploads` in `.env`.
