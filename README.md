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
- `src/` — handlers, business logic, MongoDB models
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
