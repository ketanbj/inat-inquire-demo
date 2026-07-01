#!/usr/bin/env bash
# Stop the local source-pipeline stack used by the demo.
#
# Usage: ./scripts/live-pipeline-down.sh
# Set DEMO_REMOVE_VOLUMES=1 to also remove Docker volumes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

require_docker
set_pipeline_compose_context
DOWN_ARGS=(--remove-orphans)

if [ "${DEMO_REMOVE_VOLUMES:-0}" = "1" ]; then
  DOWN_ARGS+=(--volumes)
fi

echo "Stopping local pipeline stack from ${PIPELINE_DIR}"
(cd "${PIPELINE_DIR}" && docker compose "${COMPOSE_ARGS[@]}" --profile infinity down "${DOWN_ARGS[@]}")

echo "Local pipeline stack stopped."
