# Deploy to EC2 with Docker

This guide runs the full stack (MongoDB, 3 microservices, Next.js frontend) on one EC2 instance using Docker Compose.

## 1. Launch EC2

| Setting | Recommendation |
|---------|----------------|
| AMI | Ubuntu 22.04 LTS |
| Instance | `t3.small` or larger (4 containers + Mongo) |
| Storage | 20 GB+ (uploads grow over time) |
| Key pair | Create or use an existing SSH key |

### Security group (inbound)

| Port | Source | Purpose |
|------|--------|---------|
| 22 | Your IP | SSH |
| 80 | `0.0.0.0/0` | Web app (frontend) |

Do **not** expose MongoDB (27017) or backend API ports (3001–3003) publicly. Only the frontend is published.

## 2. Connect and install Docker

```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>
```

Option A — automated script (clone from Git):

```bash
export REPO_URL=https://github.com/t20suman-glitch/watchify.git
bash -c "$(curl -fsSL https://raw.githubusercontent.com/t20suman-glitch/watchify/main/deploy/ec2-setup.sh)"
```

Option B — manual:

```bash
# Install Docker (Ubuntu)
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
# Log out and SSH back in so docker group applies

# Get the code
git clone https://github.com/t20suman-glitch/watchify.git
cd microservice

# Configure secrets
cp .env.production.example .env
nano .env   # set JWT_SECRET to a long random string
```

## 3. Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f frontend
```

Open **http://\<ec2-public-ip\>** in your browser.

## 4. Architecture on EC2

```
Internet :80
    │
    ▼
┌─────────────┐
│  frontend   │  Next.js (only public service)
└──────┬──────┘
       │ Docker network (internal)
       ├── user-service:3001
       ├── upload-service:3002
       └── watch-service:3003
              │
              ├── mongodb:27017
              └── upload volume (/app/uploads)
```

## 5. Useful commands

```bash
# Restart after code changes
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Stop everything
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Rebuild one service
docker compose -f docker-compose.prod.yml up -d --build frontend
```

## 6. Production tips

- **JWT_SECRET** — required; must match between user-service and watch-service (handled via `.env`).
- **Uploads** — stored in Docker volume `upload_data`. Back up regularly or switch to S3 later.
- **MongoDB** — data in volume `mongo_data`. For production at scale, consider MongoDB Atlas (set `*_MONGO_URI` in `.env`).
- **HTTPS** — put an Application Load Balancer + ACM certificate in front, or use Caddy/nginx on the host as a reverse proxy.
- **Updates** — `git pull` then `docker compose -f docker-compose.prod.yml up -d --build`.

## 7. Test locally before EC2

Simulate production compose on your machine:

```bash
cp .env.production.example .env
# Edit JWT_SECRET
docker compose -f docker-compose.prod.yml up -d --build
```

App runs at http://localhost (port 80).
