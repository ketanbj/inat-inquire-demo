#!/usr/bin/env bash
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

pipeline_path="${INQUIRE_VECTOR_SEARCH_PATH:-../Inquire-vector-search}"
if [[ "${pipeline_path}" = /* ]]; then
  PIPELINE_DIR="${pipeline_path}"
else
  PIPELINE_DIR="${ROOT_DIR}/${pipeline_path}"
fi
OUTPUT="${ROOT_DIR}/recordings/metadata/benchmark/recorded-run-summary.json"

if [ ! -d "${PIPELINE_DIR}" ]; then
  echo "Pipeline repo not found: ${PIPELINE_DIR}"
  exit 1
fi

require_uv "to run the source pipeline benchmark"

mkdir -p "$(dirname "${OUTPUT}")"

cd "${PIPELINE_DIR}"
"${UV_BIN}" run inq bench run \
  --dataset bench/datasets/inquire/inquire-val-subset.json \
  --provider qdrant \
  --limit 10 \
  --format both \
  --output "${OUTPUT}"

echo "Recorded benchmark output: ${OUTPUT}"
