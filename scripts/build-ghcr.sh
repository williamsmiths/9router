#!/usr/bin/env bash
# Build and push 9router image to GitHub Container Registry (GHCR).
#
# Usage:
#   export GHCR_OWNER=williamsmiths   # GitHub user/org
#   export GHCR_TOKEN=<PAT with write:packages>
#   ./scripts/build-ghcr.sh [tag]       # default: latest
#
# Pull:
#   docker pull ghcr.io/${GHCR_OWNER}/9router:latest

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GHCR_OWNER="${GHCR_OWNER:-williamsmiths}"
IMAGE="ghcr.io/${GHCR_OWNER}/9router"
TAG="${1:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [ -z "${GHCR_TOKEN:-}" ]; then
  if command -v gh >/dev/null 2>&1; then
    GHCR_TOKEN="$(gh auth token 2>/dev/null || true)"
    export GHCR_TOKEN
  fi
fi
if [ -z "${GHCR_TOKEN:-}" ]; then
  echo "Set GHCR_TOKEN in .env.deploy or: gh auth login" >&2
  exit 1
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-$GHCR_OWNER}" --password-stdin

BUILDER_NAME="${BUILDX_BUILDER:-router9-builder}"
docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1 \
  || docker buildx create --name "$BUILDER_NAME" --use
docker buildx use "$BUILDER_NAME"

echo "Building ${IMAGE}:${TAG} (${PLATFORMS})..."
docker buildx build \
  --platform "$PLATFORMS" \
  -t "${IMAGE}:${TAG}" \
  -t "${IMAGE}:latest" \
  --push \
  .

echo "Done: ${IMAGE}:${TAG}"
