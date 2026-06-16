# Movie Microservice

Three **fully independent** gRPC services. Change and deploy one without touching the others.

## Layout

```
microservice/
├── services/
│   ├── user-service/      ← deploy alone (port 50051)
│   ├── upload-service/    ← deploy alone (port 50052)
│   └── watch-service/     ← deploy alone (port 50053)
├── docker-compose.yml     ← optional local dev only
└── package.json           ← optional compose helpers only
```

Each service folder is a complete app:

- `proto/` — gRPC contract for that service only
- `src/` — handlers, business logic, MongoDB models, Winston logger (`src/lib/logger/`)
- `package.json`, `Dockerfile`, `.env.example`

No shared npm package. No root-level code required to run or ship a service.

## Deploy one service

```bash
cd services/user-service
cp .env.example .env   # set MONGO_URI
npm install
npm run docker:build
npm run start
```

After a code change, rebuild **only that service**:

```bash
cd services/user-service
npm run docker:build
# push user-service image — upload-service and watch-service unchanged
```

## Optional: run everything locally

From repo root (uses root `.env` for `MONGO_URI` if set):

```bash
docker compose build user-service    # build one
docker compose up -d user-service    # run one
docker compose up -d                 # run all
```

## API contract note

`.proto` files are duplicated per service on purpose. If you change a public gRPC API, update the matching `proto/` in that service and redeploy **only that service**. Clients must use the same contract version.

## Suggested production setup

| Service | Own repo (optional) | Own CI pipeline | Own image tag |
|---------|-------------------|-----------------|---------------|
| user-service | `user-service.git` | `ci/user.yml` | `user-service:1.2.0` |
| upload-service | `upload-service.git` | `ci/upload.yml` | `upload-service:2.0.1` |
| watch-service | `watch-service.git` | `ci/watch.yml` | `watch-service:1.0.3` |

You can copy any `services/<name>/` folder to its own repository today — it has no dependency on sibling folders.

## Logging

All three services use [Winston](https://github.com/winstonjs/winston) for structured logging:

- **Development** — colored, human-readable lines with timestamps and service name
- **Production** (`NODE_ENV=production`) — one JSON object per line (Docker, CloudWatch, Datadog, etc.)
- **HTTP requests** — method, path, status, duration (health checks at `debug` level)
- **Errors** — stack traces on unhandled HTTP/gRPC errors and process crashes

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | unset | Set to `production` for JSON logs |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | `error`, `warn`, `info`, `debug` |

Production compose (`docker-compose.prod.yml`) sets `NODE_ENV=production` and `LOG_LEVEL` for every service.

### Reading logs in Docker

Local dev stack:

```bash
# All services, follow new lines
docker compose logs -f

# One service only
docker compose logs -f user-service

# Last 100 lines, then follow
docker compose logs -f --tail=100 upload-service
```

Production stack:

```bash
docker compose -f docker-compose.prod.yml logs -f watch-service
```

Production logs are JSON — pipe through `jq` to pretty-print or filter:

```bash
# Pretty-print
docker compose -f docker-compose.prod.yml logs --no-log-prefix user-service | jq .

# Errors only
docker compose -f docker-compose.prod.yml logs --no-log-prefix user-service | jq 'select(.level == "error")'

# Slow HTTP requests (> 500ms)
docker compose -f docker-compose.prod.yml logs --no-log-prefix upload-service \
  | jq 'select(.message == "HTTP request" and .durationMs > 500)'
```

Raise verbosity without rebuilding — set `LOG_LEVEL=debug` in `.env`, then `docker compose -f docker-compose.prod.yml up -d`.

## Production deployment

```bash
cp .env.production.example .env   # set JWT_SECRET, optional LOG_LEVEL
docker compose -f docker-compose.prod.yml up -d --build
```

See `deploy/VAULT.md` for optional HashiCorp Vault secret loading.
