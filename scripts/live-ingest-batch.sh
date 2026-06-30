#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

require_seed_tools
set_pipeline_dir

json_field() {
  local expression="$1"
  python3 -c "import json, sys; data=json.load(sys.stdin); print(${expression})"
}

json_summary() {
  python3 - "$@" <<'PY'
import json
import sys

keys = [
    "batch",
    "collection",
    "s3_prefix",
    "start_offset",
    "uploaded_count",
    "total_bytes",
    "points_before",
    "points_after",
    "added_vectors",
    "elapsed_seconds",
    "ingest_rate_per_second",
    "estimated_cost_usd",
    "verify_query",
    "verify_result_count",
    "first_result_key",
]

data = dict(zip(keys, sys.argv[1:]))
for int_key in (
    "batch",
    "start_offset",
    "uploaded_count",
    "total_bytes",
    "points_before",
    "points_after",
    "added_vectors",
    "elapsed_seconds",
    "verify_result_count",
):
    data[int_key] = int(float(data[int_key]))
for float_key in ("ingest_rate_per_second", "estimated_cost_usd"):
    data[float_key] = round(float(data[float_key]), 4)
print(json.dumps(data, indent=2))
PY
}

collection_points() {
  local collection="$1"
  local response
  response="$(curl -fsS "${QDRANT_API_URL}/collections/${collection}" 2>/dev/null || true)"
  if [ -z "${response}" ]; then
    echo "0"
    return 0
  fi
  printf '%s' "${response}" | json_field 'data.get("result", {}).get("points_count", 0)'
}

invalidate_search_cache() {
  # Same-query before/after demos must query the updated collection, not a
  # semantic-cache entry created before the new batch was ingested.
  curl -fsS -X DELETE "${PIPELINE_API_URL}/cache" >/dev/null 2>&1 || true
}

batch_arg="${1:-${DEMO_INGEST_BATCH:-1}}"
if ! [[ "${batch_arg}" =~ ^[0-9]+$ ]] || [ "${batch_arg}" -lt 1 ]; then
  echo "Usage: $0 [positive-batch-number]"
  exit 1
fi

PIPELINE_API_URL="${PIPELINE_API_URL:-http://localhost:8010}"
RAY_API_URL="${RAY_API_URL:-http://localhost:8265}"
QDRANT_API_URL="${QDRANT_API_URL:-http://localhost:6333}"
MINIO_PUBLIC_URL="${MINIO_PUBLIC_URL:-http://localhost:9000}"
DEMO_LIVE_COLLECTION="${DEMO_LIVE_COLLECTION:-inat-demo-live}"
DEMO_S3_BUCKET="${DEMO_S3_BUCKET:-pipeline}"
DEMO_S3_PREFIX="${DEMO_S3_PREFIX:-hf-inat/}"
DEMO_HF_IMAGES_PER_DATASET="${DEMO_HF_IMAGES_PER_DATASET:-8}"
DEMO_HF_BATCH_OFFSET_STRIDE="${DEMO_HF_BATCH_OFFSET_STRIDE:-500}"
DEMO_VERIFY_QUERY="${DEMO_VERIFY_QUERY:-nudibranch}"
DEMO_COST_PER_1K_IMAGES_USD="${DEMO_COST_PER_1K_IMAGES_USD:-0}"
DEMO_COST_PER_COMPUTE_HOUR_USD="${DEMO_COST_PER_COMPUTE_HOUR_USD:-0}"

batch_index="${batch_arg}"
base_prefix="${DEMO_S3_PREFIX%/}"
if [ -n "${base_prefix}" ]; then
  default_batch_prefix="${base_prefix}/batch-${batch_index}/"
else
  default_batch_prefix="batch-${batch_index}/"
fi
batch_prefix="${DEMO_BATCH_S3_PREFIX:-${default_batch_prefix}}"
start_offset="${DEMO_HF_START_OFFSET:-$(((batch_index - 1) * DEMO_HF_BATCH_OFFSET_STRIDE))}"
seed_summary_path="${DEMO_HF_SEED_SUMMARY:-${ROOT_DIR}/data/runtime/hf-live-seed-batch-${batch_index}.json}"
run_summary_path="${DEMO_INGEST_RUN_SUMMARY:-${ROOT_DIR}/data/runtime/live-ingest-batch-${batch_index}-summary.json}"

wait_for_url "${PIPELINE_API_URL}/healthz" "Pipeline API"
wait_for_url "${MINIO_PUBLIC_URL}/minio/health/live" "MinIO"

mkdir -p "$(dirname "${seed_summary_path}")" "$(dirname "${run_summary_path}")"

clear_prefix_flag=(--clear-prefix)
if [ "${DEMO_CLEAR_S3_PREFIX:-1}" = "0" ]; then
  clear_prefix_flag=(--no-clear-prefix)
fi

exclude_summary_args=()
exclude_summary_count=0
for existing_summary in "${ROOT_DIR}"/data/runtime/hf-live-seed-batch-*.json; do
  if [ ! -e "${existing_summary}" ] || [ "${existing_summary}" = "${seed_summary_path}" ]; then
    continue
  fi
  exclude_summary_args+=(--exclude-summary "${existing_summary}")
  exclude_summary_count=$((exclude_summary_count + 1))
done

points_before="$(collection_points "${DEMO_LIVE_COLLECTION}")"
run_start_epoch="$(date +%s)"

echo "Seeding batch ${batch_index} from HF row offset ${start_offset}"
seed_command=(
  "${UV_BIN}" run --project "${PIPELINE_DIR}" \
  "${ROOT_DIR}/scripts/seed-hf-inat-sample.py" \
  --per-dataset "${DEMO_HF_IMAGES_PER_DATASET}" \
  --bucket "${DEMO_S3_BUCKET}" \
  --prefix "${batch_prefix}" \
  --start-offset "${start_offset}" \
  --summary-path "${seed_summary_path}"
)
if [ "${exclude_summary_count}" -gt 0 ]; then
  seed_command+=("${exclude_summary_args[@]}")
fi
seed_command+=("${clear_prefix_flag[@]}")

seed_summary="$("${seed_command[@]}")"
uploaded_count="$(printf '%s' "${seed_summary}" | json_field 'data["uploaded_count"]')"
total_bytes="$(printf '%s' "${seed_summary}" | json_field 'data.get("total_bytes", 0)')"
if [ "${uploaded_count}" -le 0 ]; then
  echo "HF seed step did not upload any images."
  exit 1
fi

submit_payload="$(python3 - <<PY
import json
print(json.dumps({
    "s3_bucket": "${DEMO_S3_BUCKET}",
    "s3_prefix": "${batch_prefix}",
    "collection": "${DEMO_LIVE_COLLECTION}",
    "image_max_items": int("${uploaded_count}"),
}))
PY
)"

echo "Submitting Ray ingestion batch ${batch_index} to ${DEMO_LIVE_COLLECTION}"
job_response="$(curl -fsS -X POST "${PIPELINE_API_URL}/ray/jobs/images" \
  -H 'Content-Type: application/json' \
  -d "${submit_payload}")"
job_id="$(printf '%s' "${job_response}" | json_field 'data["job_id"]')"
echo "Ray job: ${job_id}"

job_status="UNKNOWN"
for ((attempt = 1; attempt <= 120; attempt++)); do
  job_json="$(curl -fsS "${RAY_API_URL}/api/jobs/${job_id}" || true)"
  if [ -n "${job_json}" ]; then
    job_status="$(printf '%s' "${job_json}" | json_field 'data.get("status", "UNKNOWN")')"
  fi

  case "${job_status}" in
    SUCCEEDED)
      echo "Ray ingestion batch ${batch_index} succeeded."
      break
      ;;
    FAILED|STOPPED|CANCELED)
      echo "Ray ingestion batch ${batch_index} ended with status ${job_status}."
      curl -fsS "${RAY_API_URL}/api/jobs/${job_id}/logs" || true
      exit 1
      ;;
  esac

  sleep 2
done

if [ "${job_status}" != "SUCCEEDED" ]; then
  echo "Ray ingestion batch ${batch_index} timed out with status ${job_status}."
  curl -fsS "${RAY_API_URL}/api/jobs/${job_id}/logs" || true
  exit 1
fi

points_after="$(collection_points "${DEMO_LIVE_COLLECTION}")"
added_vectors="$((points_after - points_before))"
invalidate_search_cache
elapsed_seconds="$(($(date +%s) - run_start_epoch))"
if [ "${elapsed_seconds}" -le 0 ]; then
  elapsed_seconds=1
fi

search_json="$(curl -fsS --get "${PIPELINE_API_URL}/search/images" \
  --data-urlencode "q=${DEMO_VERIFY_QUERY}" \
  --data-urlencode "limit=5" \
  --data-urlencode "collection=${DEMO_LIVE_COLLECTION}")"
result_count="$(printf '%s' "${search_json}" | json_field 'len(data.get("results", []))')"
first_key="$(printf '%s' "${search_json}" | json_field 'data["results"][0].get("s3_key", "") if data.get("results") else ""')"
if [ "${result_count}" -le 0 ]; then
  echo "Pipeline search returned no results for ${DEMO_LIVE_COLLECTION}."
  exit 1
fi

cost_and_rate="$(python3 - <<PY
uploaded = int("${uploaded_count}")
elapsed = int("${elapsed_seconds}")
per_1k = float("${DEMO_COST_PER_1K_IMAGES_USD}")
per_hour = float("${DEMO_COST_PER_COMPUTE_HOUR_USD}")
rate = uploaded / elapsed if elapsed else 0
cost = (uploaded / 1000) * per_1k + (elapsed / 3600) * per_hour
print(f"{rate:.4f} {cost:.4f}")
PY
)"
ingest_rate_per_second="${cost_and_rate%% *}"
estimated_cost_usd="${cost_and_rate##* }"

json_summary \
  "${batch_index}" \
  "${DEMO_LIVE_COLLECTION}" \
  "${batch_prefix}" \
  "${start_offset}" \
  "${uploaded_count}" \
  "${total_bytes}" \
  "${points_before}" \
  "${points_after}" \
  "${added_vectors}" \
  "${elapsed_seconds}" \
  "${ingest_rate_per_second}" \
  "${estimated_cost_usd}" \
  "${DEMO_VERIFY_QUERY}" \
  "${result_count}" \
  "${first_key}" > "${run_summary_path}"

storage_mb="$(python3 - <<PY
print(f'{int("${total_bytes}") / (1024 * 1024):.2f}')
PY
)"

echo "Ingestion batch ${batch_index} complete."
echo "Collection: ${DEMO_LIVE_COLLECTION} (${points_before} -> ${points_after} points, ${added_vectors} added)"
echo "Seeded images: ${uploaded_count} (${storage_mb} MB) from gt-csse Hugging Face datasets"
echo "Elapsed: ${elapsed_seconds}s (${ingest_rate_per_second} images/s)"
echo "Estimated demo cost: \$${estimated_cost_usd} (set DEMO_COST_PER_1K_IMAGES_USD and DEMO_COST_PER_COMPUTE_HOUR_USD to model cloud rates)"
echo "Search verification: ${result_count} results for \"${DEMO_VERIFY_QUERY}\""
echo "First image: ${MINIO_PUBLIC_URL}/${DEMO_S3_BUCKET}/${first_key}"
echo "Seed summary: ${seed_summary_path}"
echo "Run summary: ${run_summary_path}"
