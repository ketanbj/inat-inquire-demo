#!/usr/bin/env bash
# Optional evidence refresh for the demo's "large-run" benchmark story.
#
# This does not start the live demo. It runs the source pipeline's benchmark
# command and records the output artifact used by docs/slides/fallback evidence
# when presenting scale or quality results beyond the small laptop ingest path.
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
