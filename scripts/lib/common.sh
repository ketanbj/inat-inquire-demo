#!/usr/bin/env bash

COMMON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "${COMMON_DIR}/../.." && pwd)}"

load_demo_env() {
  local env_file="${1:-${ROOT_DIR}/.env}"
  if [ ! -f "${env_file}" ]; then
    return 0
  fi

  while IFS= read -r line || [ -n "${line}" ]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    if [ -z "${line}" ] || [ "${line#\#}" != "${line}" ]; then
      continue
    fi
    if [[ "${line}" == export\ * ]]; then
      line="${line#export }"
    fi
    if [[ "${line}" != *=* ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key//[[:space:]]/}"

    if [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && [ -z "${!key+x}" ]; then
      export "${key}=${value}"
    fi
  done < "${env_file}"
}

load_demo_env

find_uv() {
  if [ -n "${UV_BIN:-}" ]; then
    printf '%s\n' "${UV_BIN}"
    return 0
  fi
  if command -v uv >/dev/null 2>&1; then
    command -v uv
    return 0
  fi
  if [ -x "${HOME}/.local/bin/uv" ]; then
    printf '%s\n' "${HOME}/.local/bin/uv"
    return 0
  fi
  return 1
}

find_optional_uv() {
  UV_BIN="$(find_uv || true)"
  export UV_BIN
}

require_uv() {
  local purpose="$1"
  UV_BIN="$(find_uv || true)"
  if [ -z "${UV_BIN}" ]; then
    echo "uv is required ${purpose}."
    exit 1
  fi
  export UV_BIN
}

require_seed_tools() {
  require_command curl "Install curl and try again."
  require_command python3 "Install Python 3 and try again."
  require_uv "to seed the local pipeline"
}

set_pipeline_dir() {
  PIPELINE_DIR="$(resolve_from_root "${INQUIRE_VECTOR_SEARCH_PATH:-../Inquire-vector-search}")"
  export PIPELINE_DIR
}

set_pipeline_compose_context() {
  set_pipeline_dir
  COMPOSE_ARGS=(
    -f "zarf/compose/dev/docker-compose.yaml"
    -f "${ROOT_DIR}/infra/local/pipeline-port-8010.override.yaml"
  )
}

resolve_from_root() {
  local candidate="$1"
  if [[ "${candidate}" = /* ]]; then
    printf '%s\n' "${candidate}"
  else
    (cd "${ROOT_DIR}" && cd "${candidate}" && pwd)
  fi
}

require_command() {
  local command_name="$1"
  local install_hint="$2"
  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "${command_name} is required. ${install_hint}"
    exit 1
  fi
}

require_docker() {
  require_command docker "Install Docker Desktop, start it, and try again."
  if ! docker info >/dev/null 2>&1; then
    echo "Docker Desktop must be running before starting or stopping the local pipeline."
    exit 1
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-30}"
  local ready_message="${4:-}"

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if curl -fsS "${url}" >/dev/null 2>&1; then
      if [ -n "${ready_message}" ]; then
        echo "${ready_message}"
      fi
      return 0
    fi
    sleep 2
  done

  echo "${label} did not become ready at ${url}."
  exit 1
}
