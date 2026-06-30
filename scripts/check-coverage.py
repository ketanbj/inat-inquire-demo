#!/usr/bin/env python3
"""Fail validation when any covered source file is below the coverage threshold."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("coverage_json", type=Path)
    parser.add_argument("--min-percent", type=float, default=95.0)
    parser.add_argument("--path-prefix", default="")
    return parser.parse_args()


def percent_covered(report: dict[str, Any]) -> float:
    summary = report.get("summary", {})
    return float(summary.get("percent_covered", 0.0))


def main() -> int:
    args = parse_args()
    data = json.loads(args.coverage_json.read_text(encoding="utf-8"))
    files = data.get("files", {})
    checked: list[tuple[str, float]] = []
    failing: list[tuple[str, float]] = []

    for filename, report in sorted(files.items()):
        normalized = filename.replace("\\", "/")
        if args.path_prefix and not normalized.startswith(args.path_prefix):
            continue
        percent = percent_covered(report)
        checked.append((normalized, percent))
        if percent < args.min_percent:
            failing.append((normalized, percent))

    if not checked:
        print(f"No coverage entries matched prefix {args.path_prefix!r}.", file=sys.stderr)
        return 1

    if failing:
        print(f"Coverage is below {args.min_percent:g}% for:", file=sys.stderr)
        for filename, percent in failing:
            print(f"  {filename}: {percent:.2f}%", file=sys.stderr)
        return 1

    print(f"Coverage gate passed for {len(checked)} files at >= {args.min_percent:g}%.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
