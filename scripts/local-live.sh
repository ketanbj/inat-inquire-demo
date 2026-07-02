#!/usr/bin/env bash
# Start the FastAPI backend and Vite portal for the local live demo.
#
# Usage: ./scripts/local-live.sh
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

require_uv "to run the demo backend"

require_command npm "Install Node.js, then run ./scripts/bootstrap.sh."

if [ ! -d "${ROOT_DIR}/portal/node_modules" ]; then
  echo "Portal dependencies are missing. Run ./scripts/bootstrap.sh first."
  exit 1
fi

SERVER_HOST="${DEMO_SERVER_HOST:-0.0.0.0}"
SERVER_PORT="${DEMO_SERVER_PORT:-8088}"
PORTAL_PORT="${PORTAL_PORT:-5173}"

ensure_port_free() {
  local port="$1"
  local label="$2"
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "${label} port ${port} is already in use:"
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN
    exit 1
  fi
}

cleanup() {
  for job in $(jobs -p); do
    kill "${job}" 2>/dev/null || true
  done
}
trap cleanup EXIT

ensure_port_free "${SERVER_PORT}" "Demo backend"
ensure_port_free "${PORTAL_PORT}" "Portal"

echo "Starting demo backend on ${SERVER_PORT}"
(cd "${ROOT_DIR}/server" && "${UV_BIN}" run uvicorn app.main:app --host "${SERVER_HOST}" --port "${SERVER_PORT}") &

echo "Starting demo portal on ${PORTAL_PORT}"
(cd "${ROOT_DIR}/portal" && VITE_DEMO_API_URL="http://localhost:${SERVER_PORT}" npm run dev -- --port "${PORTAL_PORT}") &

wait
