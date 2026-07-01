#!/usr/bin/env bash
# Export the Marp slide source to PDF.
#
# Usage: ./scripts/export-slides.sh
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/common.sh"

SOURCE="${ROOT_DIR}/slides/inat-inquire-demo.marp.md"
OUTPUT="${ROOT_DIR}/slides/exports/inat-inquire-demo.pdf"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required for Marp export."
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT}")"
npx @marp-team/marp-cli "${SOURCE}" --pdf --output "${OUTPUT}"
echo "Exported ${OUTPUT}"
