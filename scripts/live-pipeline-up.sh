#!/usr/bin/env bash
# Start the local source-pipeline stack, reset the demo collection, and ingest batch 1.
#
# Usage: ./scripts/live-pipeline-up.sh
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

require_docker
require_seed_tools

PIPELINE_API_URL="${PIPELINE_API_URL:-http://localhost:8010}"
QDRANT_API_URL="${QDRANT_API_URL:-http://localhost:6333}"
MINIO_PUBLIC_URL="${MINIO_PUBLIC_URL:-http://localhost:9000}"
DEMO_LIVE_COLLECTION="${DEMO_LIVE_COLLECTION:-inat-demo-live}"
DEMO_RESET_COLLECTION="${DEMO_RESET_COLLECTION:-1}"
DEMO_SEMANTIC_CACHE_ENABLED="${DEMO_SEMANTIC_CACHE_ENABLED:-false}"
export DEMO_SEMANTIC_CACHE_ENABLED

set_pipeline_compose_context

echo "Starting local pipeline stack from ${PIPELINE_DIR}"
echo "Semantic cache enabled: ${DEMO_SEMANTIC_CACHE_ENABLED}"
(cd "${PIPELINE_DIR}" && docker compose "${COMPOSE_ARGS[@]}" up -d --build --remove-orphans)

wait_for_url "${PIPELINE_API_URL}/healthz" "Pipeline API" 60 "Pipeline API is ready."
wait_for_url "${MINIO_PUBLIC_URL}/minio/health/live" "MinIO" 60 "MinIO is ready."

if [ "${DEMO_RESET_COLLECTION}" = "1" ]; then
  echo "Resetting Qdrant collection ${DEMO_LIVE_COLLECTION}"
  curl -fsS -X DELETE "${QDRANT_API_URL}/collections/${DEMO_LIVE_COLLECTION}" >/dev/null 2>&1 || true
  docker exec ray-head rm -f "/tmp/ray-checkpoints/${DEMO_LIVE_COLLECTION}.json" >/dev/null 2>&1 || true
fi

echo "Running initial ingestion batch for ${DEMO_LIVE_COLLECTION}"
DEMO_INGEST_BATCH=1 "${ROOT_DIR}/scripts/live-ingest-batch.sh" 1

echo "Live pipeline is ready."
echo "Search API: ${PIPELINE_API_URL}/search/images"
echo "Next: ./scripts/local-live.sh"
echo "After the first search, add new images with: ./scripts/live-ingest-batch.sh 2"
