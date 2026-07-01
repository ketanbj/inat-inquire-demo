#!/usr/bin/env bash
# Run the source-pipeline benchmark and save the result under recordings metadata.
#
# Usage: ./scripts/record-large.sh
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

set_pipeline_dir
OUTPUT="${ROOT_DIR}/recordings/metadata/benchmark/recorded-run-summary.json"

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
