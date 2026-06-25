#!/usr/bin/env bash
# Updates deploy/k8s/*-service.yaml and frontend.yaml image tags.
# Usage: ./update-k8s-images.sh <tag> [dockerhub_user]
set -euo pipefail

TAG="${1:?Usage: $0 <docker-tag> [dockerhub-user]}"
DOCKERHUB_USER="${2:-${DOCKERHUB_USER:-t20suman}}"
K8S_DIR="$(cd "$(dirname "$0")/../../k8s" && pwd)"

SERVICES=(user-service upload-service watch-service frontend)

for svc in "${SERVICES[@]}"; do
  file="${K8S_DIR}/${svc}.yaml"
  if [[ ! -f "$file" ]]; then
    echo "ERROR: missing ${file}" >&2
    exit 1
  fi
  sed -i.bak -E "s|(image: ${DOCKERHUB_USER}/${svc}:)[^[:space:]]+|\1${TAG}|" "$file"
  rm -f "${file}.bak"
  echo "Updated ${svc} -> ${DOCKERHUB_USER}/${svc}:${TAG}"
done

echo "--- manifest images ---"
grep -h 'image: ' "${K8S_DIR}/user-service.yaml" "${K8S_DIR}/upload-service.yaml" \
  "${K8S_DIR}/watch-service.yaml" "${K8S_DIR}/frontend.yaml"
