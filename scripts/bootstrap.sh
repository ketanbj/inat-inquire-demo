#!/usr/bin/env bash
# Prepare a fresh clone for local demo use.
#
# Usage: ./scripts/bootstrap.sh
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

find_optional_uv

if [ ! -f "${ROOT_DIR}/.env" ]; then
  cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
  echo "Created .env from .env.example"
fi

if [ -n "${UV_BIN}" ]; then
  (cd "${ROOT_DIR}/server" && "${UV_BIN}" sync --dev)
else
  echo "uv is not installed; install uv before running the backend."
fi

if command -v npm >/dev/null 2>&1; then
  (cd "${ROOT_DIR}/portal" && npm install)
else
  echo "npm is not installed; install Node.js before running the portal."
fi

echo "Bootstrap complete."
