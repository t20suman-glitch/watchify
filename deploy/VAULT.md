# HashiCorp Vault integration

Watchify services already read secrets from **environment variables** (`JWT_SECRET`, `MONGO_URI`, AWS keys). Vault replaces storing those in a plain `.env` file on disk.

## Secrets to store in Vault

| Vault path key | Used by | Env var |
|----------------|---------|---------|
| `jwt_secret` | user-service, watch-service | `JWT_SECRET` |
| `user_mongo_uri` | user-service | `USER_MONGO_URI` |
| `upload_mongo_uri` | upload-service | `UPLOAD_MONGO_URI` |
| `watch_mongo_uri` | watch-service | `WATCH_MONGO_URI` |
| `aws_access_key_id` | upload-service (S3) | `AWS_ACCESS_KEY_ID` |
| `aws_secret_access_key` | upload-service (S3) | `AWS_SECRET_ACCESS_KEY` |

Suggested KV path: `secret/data/watchify/prod`

---

## Architecture (recommended for EC2 + Docker Compose)

```
┌─────────────┐     AppRole auth      ┌──────────────┐
│ Vault Agent │ ───────────────────►  │ Vault Server │
│  (on EC2)   │ ◄── read secrets ───  │ (HCP or EC2) │
└──────┬──────┘                       └──────────────┘
       │ renders
       ▼
   .env.runtime  ──►  docker compose -f docker-compose.prod.yml --env-file .env.runtime up -d
       │
       ▼
 user / upload / watch / frontend containers
```

**No app code changes** — services keep using `process.env.JWT_SECRET`, etc.

---

## Option A — Deploy-time fetch (simplest)

Run once before starting Docker. Good for single EC2.

### 1. Store secrets in Vault

```bash
export VAULT_ADDR=https://your-vault:8200
export VAULT_TOKEN=<admin-token>   # use AppRole in production

vault kv put secret/watchify/prod \
  jwt_secret="your-long-random-jwt-secret" \
  user_mongo_uri="mongodb://mongodb:27017/user_service" \
  upload_mongo_uri="mongodb://mongodb:27017/upload_service" \
  watch_mongo_uri="mongodb://mongodb:27017/watch_service"
```

### 2. Fetch into env file on EC2

```bash
cd microservice
bash deploy/vault/load-secrets.sh
docker compose -f docker-compose.prod.yml --env-file .env.runtime up -d --build
```

Add `.env.runtime` to `.gitignore` (never commit).

---

## Option B — Vault Agent (continuous, production)

Vault Agent runs on EC2, auto-renews tokens, re-renders `.env.runtime` when secrets rotate.

### 1. Enable AppRole on Vault

```bash
vault auth enable approle

vault policy write watchify-policy - <<EOF
path "secret/data/watchify/prod" {
  capabilities = ["read"]
}
EOF

vault write auth/approle/role/watchify \
  token_policies="watchify-policy" \
  token_ttl=1h \
  token_max_ttl=4h

vault read auth/approle/role/watchify/role-id
vault write -f auth/approle/role/watchify/secret-id
```

Save `role_id` and `secret_id` on EC2 (e.g. `/etc/watchify/vault-approle.env`, chmod 600).

### 2. Configure agent

Copy and edit:

```bash
cp deploy/vault/agent.hcl.example /etc/watchify/agent.hcl
cp deploy/vault/env.tpl /etc/watchify/env.tpl
# Set VAULT_ADDR, role_id, secret_id in agent.hcl
```

### 3. Run agent as systemd service

```bash
sudo vault agent -config=/etc/watchify/agent.hcl
```

Agent writes `/opt/watchify/.env.runtime`. Start compose with that file.

---

## Option C — AWS Secrets Manager (if you prefer AWS-native)

On EC2 with IAM role, skip Vault and use:

```bash
aws secretsmanager get-secret-value --secret-id watchify/prod \
  --query SecretString --output text | jq -r '
  "JWT_SECRET=\(.jwt_secret)",
  "USER_MONGO_URI=\(.user_mongo_uri)",
  ...
' > .env.runtime
```

Same `--env-file .env.runtime` flow for Docker Compose.

---

## Security checklist

- Do **not** commit `.env`, `.env.runtime`, or Vault tokens
- Use **AppRole** (not root token) on production EC2
- Restrict Vault policy to `read` only on `secret/watchify/prod`
- Rotate `JWT_SECRET` only with a planned logout (invalidates existing tokens)
- Keep Vault server off public internet or use HCP Vault with TLS

---

## Local development

Keep using `.env` / `.env.local` locally. Vault is for **EC2/production** only.

```bash
# Local — unchanged
docker compose up -d

# Production EC2 — Vault
bash deploy/vault/load-secrets.sh
docker compose -f docker-compose.prod.yml --env-file .env.runtime up -d
```

---

## Files in this repo

| File | Purpose |
|------|---------|
| `deploy/vault/load-secrets.sh` | One-shot: Vault → `.env.runtime` |
| `deploy/vault/env.tpl` | Agent template for `.env.runtime` |
| `deploy/vault/agent.hcl.example` | Vault Agent config template |
