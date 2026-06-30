#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

find_optional_uv

coverage_json=""
coverage_data=""
portal_preview_log=""
portal_preview_pid=""
portal_visual_out=""
cleanup_validation() {
  rm -f "${coverage_json}" "${coverage_data}" "${portal_preview_log}"
  if [ -n "${portal_visual_out}" ]; then
    rm -rf "${portal_visual_out}"
  fi
  if [ -n "${portal_preview_pid}" ]; then
    kill "${portal_preview_pid}" >/dev/null 2>&1 || true
    wait "${portal_preview_pid}" >/dev/null 2>&1 || true
  fi
}
trap cleanup_validation EXIT

find_free_port() {
  python3 - <<'PY'
import socket

with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
PY
}

wait_for_http() {
  python3 - "$1" <<'PY'
import sys
import time
import urllib.request

url = sys.argv[1]
deadline = time.time() + 30
while time.time() < deadline:
    try:
        with urllib.request.urlopen(url, timeout=1) as response:
            if response.status < 500:
                raise SystemExit(0)
    except Exception:
        time.sleep(0.5)

print(f"Timed out waiting for {url}", file=sys.stderr)
raise SystemExit(1)
PY
}

echo "Validating JSON artifacts"
python3 -m json.tool "${ROOT_DIR}/data/evidence/benchmark-summary.json" >/dev/null
python3 -m json.tool "${ROOT_DIR}/data/evidence/metrics-highlight.json" >/dev/null
python3 -m json.tool "${ROOT_DIR}/data/evidence/production-readiness.json" >/dev/null
for script in "${ROOT_DIR}"/scripts/*.py; do
  python3 -m py_compile "${script}"
done
for script in "${ROOT_DIR}"/scripts/*.sh "${ROOT_DIR}"/scripts/lib/*.sh; do
  bash -n "${script}"
done

if [ -z "${UV_BIN}" ]; then
  echo "uv is required to run backend validation."
  exit 1
fi

echo "Running backend lint"
(cd "${ROOT_DIR}/server" && "${UV_BIN}" run ruff check app tests)

coverage_json="$(mktemp)"
coverage_data="$(mktemp)"

echo "Running backend tests with coverage"
(
  cd "${ROOT_DIR}/server"
  COVERAGE_FILE="${coverage_data}" "${UV_BIN}" run pytest \
    --cov=app \
    --cov-report=term-missing \
    --cov-report="json:${coverage_json}"
)
python3 "${ROOT_DIR}/scripts/check-coverage.py" \
  "${coverage_json}" \
  --min-percent 95 \
  --path-prefix app/

if command -v npm >/dev/null 2>&1 && [ -d "${ROOT_DIR}/portal/node_modules" ]; then
  echo "Running portal type check"
  (cd "${ROOT_DIR}/portal" && npm run lint)
  echo "Building portal"
  (cd "${ROOT_DIR}/portal" && npm run build)
  echo "Running portal visual smoke check"
  portal_visual_out="$(mktemp -d)"
  portal_visual_url="${PORTAL_VISUAL_URL:-}"
  if [ -z "${portal_visual_url}" ]; then
    portal_port="${PORTAL_VISUAL_PORT:-$(find_free_port)}"
    portal_visual_url="http://127.0.0.1:${portal_port}/"
    portal_preview_log="$(mktemp)"
    (
      cd "${ROOT_DIR}/portal"
      npm run preview -- --host 127.0.0.1 --port "${portal_port}"
    ) >"${portal_preview_log}" 2>&1 &
    portal_preview_pid="$!"
    if ! wait_for_http "${portal_visual_url}"; then
      cat "${portal_preview_log}" >&2
      exit 1
    fi
  fi
  (
    cd "${ROOT_DIR}/portal"
    PORTAL_VISUAL_URL="${portal_visual_url}" \
      PORTAL_VISUAL_OUT="${portal_visual_out}" \
      npm run visual-check
  )
else
  echo "Skipping portal checks; npm or node_modules unavailable."
fi

echo "Validation complete."
