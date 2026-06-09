#!/usr/bin/env bash
set -euo pipefail

# Run on a fresh Ubuntu EC2 instance (as ubuntu or ec2-user with sudo).
# Installs Docker, clones the repo (or uses current directory), and starts the stack.

REPO_URL="${REPO_URL:-}"
APP_DIR="${APP_DIR:-$HOME/microservice}"

install_docker() {
  if command -v docker >/dev/null 2>&1; then
    echo "Docker already installed."
    return
  fi

  echo "Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Log out and back in if 'docker' permission is denied."
}

prepare_app() {
  if [ -n "$REPO_URL" ]; then
    if [ ! -d "$APP_DIR/.git" ]; then
      git clone "$REPO_URL" "$APP_DIR"
    else
      git -C "$APP_DIR" pull
    fi
  elif [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
    echo "Set REPO_URL or run this script from the project root."
    exit 1
  fi

  cd "$APP_DIR"

  if [ ! -f .env ]; then
    cp .env.production.example .env
    echo ""
    echo "Created .env from .env.production.example"
    echo "Edit .env and set JWT_SECRET before continuing:"
    echo "  nano .env"
    exit 1
  fi

  if grep -q 'replace-with-a-long-random-secret' .env; then
    echo "Update JWT_SECRET in .env before deploying."
    exit 1
  fi
}

start_stack() {
  cd "$APP_DIR"
  docker compose -f docker-compose.prod.yml up -d --build
  docker compose -f docker-compose.prod.yml ps
  echo ""
  echo "Stack is running. Open http://<your-ec2-public-ip> in a browser."
}

install_docker
prepare_app
start_stack
