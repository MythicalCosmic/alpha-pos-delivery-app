#!/usr/bin/env bash
# ===== Smart Food — Telegram Mini App deploy =====
# Builds the Docker image and (re)runs the container that serves the Mini App
# behind nginx, reverse-proxying /api/smartfood to the backend.
#
# Everything is parameterized via env vars (override inline or in a .env file):
#   BACKEND_ORIGIN        backend origin proxied for /api/smartfood
#                         (default: https://pos.78.111.90.65.nip.io)
#   PUBLIC_WEBAPP_URL      canonical Telegram Mini App URL
#                         (default: https://delivery.78.111.90.65.nip.io/webapp/)
#   EDGE_NETWORK           shared Caddy network (default: edge)
#   WEBAPP_PORT           host port to publish (default: 8080)
#   IMAGE                 image tag (default: smartfood-webapp:latest)
#   CONTAINER             container name (default: smartfood-webapp)
#   VITE_API_BASE         API base baked into the bundle (default: /api/smartfood)
#   VITE_YANDEX_MAPS_KEY  Yandex JS Maps + Geocoder key (public; baked at build)
#   VITE_TRACK_POLL_MS    order tracking poll interval (default: 8000)
#
# Usage:
#   ./deploy.sh                 # build + run with defaults
#   BACKEND_ORIGIN=https://api.smartfood.uz WEBAPP_PORT=80 ./deploy.sh
#   ./deploy.sh --compose       # use docker compose instead of plain docker

set -euo pipefail
cd "$(dirname "$0")"

# Load a local .env if present (without overriding already-exported vars).
if [[ -f .env ]]; then
  set -a; # shellcheck disable=SC1091
  . ./.env; set +a
fi

BACKEND_ORIGIN="${BACKEND_ORIGIN:-https://pos.78.111.90.65.nip.io}"
# A trailing slash on the origin would make nginx rewrite the proxied path — strip it.
BACKEND_ORIGIN="${BACKEND_ORIGIN%/}"
PUBLIC_WEBAPP_URL="${PUBLIC_WEBAPP_URL:-https://delivery.78.111.90.65.nip.io/webapp/}"
EDGE_NETWORK="${EDGE_NETWORK:-edge}"
WEBAPP_PORT="${WEBAPP_PORT:-8080}"
IMAGE="${IMAGE:-smartfood-webapp:latest}"
CONTAINER="${CONTAINER:-smartfood-webapp}"
VITE_API_BASE="${VITE_API_BASE:-/api/smartfood}"
VITE_YANDEX_MAPS_KEY="${VITE_YANDEX_MAPS_KEY:-}"
VITE_TRACK_POLL_MS="${VITE_TRACK_POLL_MS:-8000}"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is not installed or not on PATH" >&2
  exit 1
fi

docker network inspect "${EDGE_NETWORK}" >/dev/null 2>&1 \
  || docker network create "${EDGE_NETWORK}" >/dev/null

echo "==> Smart Food Mini App deploy"
echo "    image          : ${IMAGE}"
echo "    backend origin : ${BACKEND_ORIGIN}"
echo "    public URL     : ${PUBLIC_WEBAPP_URL}"
echo "    edge network   : ${EDGE_NETWORK}"
echo "    published port : ${WEBAPP_PORT} -> 80"
echo

# Optional: docker compose path.
if [[ "${1:-}" == "--compose" ]]; then
  export BACKEND_ORIGIN PUBLIC_WEBAPP_URL EDGE_NETWORK WEBAPP_PORT VITE_API_BASE VITE_YANDEX_MAPS_KEY VITE_TRACK_POLL_MS
  docker compose up -d --build
  echo
  echo "==> Up via docker compose. Mini App: ${PUBLIC_WEBAPP_URL}"
  exit 0
fi

echo "==> Building image…"
docker build \
  --build-arg "VITE_API_BASE=${VITE_API_BASE}" \
  --build-arg "VITE_YANDEX_MAPS_KEY=${VITE_YANDEX_MAPS_KEY}" \
  --build-arg "VITE_TRACK_POLL_MS=${VITE_TRACK_POLL_MS}" \
  -t "${IMAGE}" .

echo "==> Replacing container '${CONTAINER}'…"
docker rm -f "${CONTAINER}" >/dev/null 2>&1 || true
docker run -d \
  --name "${CONTAINER}" \
  --restart unless-stopped \
  --network "${EDGE_NETWORK}" \
  --network-alias delivery-webapp \
  -e "BACKEND_ORIGIN=${BACKEND_ORIGIN}" \
  -p "${WEBAPP_PORT}:80" \
  "${IMAGE}"

echo
echo "==> Deployed. Mini App: ${PUBLIC_WEBAPP_URL}"
echo "    Health:           http://localhost:${WEBAPP_PORT}/healthz"
echo
echo "Next steps:"
echo "  • Caddy should route delivery.<server-ip>.nip.io to this webapp container."
echo "  • Set backend CUSTOMER_WEBAPP_URL and the Telegram menu to ${PUBLIC_WEBAPP_URL}"
echo "  • Restrict the Yandex Maps key by HTTP-Referer to your Mini App domain."
