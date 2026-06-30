"""Data loading and normalization helpers for the demo backend."""

from __future__ import annotations

import json
from json import JSONDecodeError
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from .models import BenchmarkSummary, ProductionReadiness, QualityGateResult


class DataArtifactError(RuntimeError):
    """Raised when a required demo evidence artifact cannot be loaded."""


def _read_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError as exc:
        raise DataArtifactError(f"Required demo data artifact is missing: {path}") from exc
    except JSONDecodeError as exc:
        raise DataArtifactError(f"Demo data artifact is not valid JSON: {path}") from exc
    except OSError as exc:
        raise DataArtifactError(f"Demo data artifact cannot be read: {path}") from exc


def load_benchmark_summary(data_dir: Path) -> BenchmarkSummary:
    """Load benchmark summary shown in the portal."""
    path = data_dir / "evidence" / "benchmark-summary.json"
    try:
        return BenchmarkSummary.model_validate(_read_json(path))
    except ValidationError as exc:
        raise DataArtifactError(f"Benchmark summary schema validation failed: {path}") from exc


def load_production_readiness(data_dir: Path) -> ProductionReadiness:
    """Load operating-model evidence and attach live runtime summaries."""
    path = data_dir / "evidence" / "production-readiness.json"
    payload = _read_json(path)
    payload["runtime_runs"] = _load_runtime_ingestion_runs(data_dir)
    payload["quality_gate_results"] = _evaluate_quality_gates(
        payload.get("quality_loop", {}).get("release_gates", []),
        load_benchmark_summary(data_dir),
    )
    try:
        return ProductionReadiness.model_validate(payload)
    except ValidationError as exc:
        raise DataArtifactError(f"Production readiness schema validation failed: {path}") from exc


def _load_runtime_ingestion_runs(data_dir: Path) -> list[dict[str, Any]]:
    runtime_dir = data_dir / "runtime"
    if not runtime_dir.exists():
        return []

    runs: list[dict[str, Any]] = []
    for path in sorted(runtime_dir.glob("live-ingest-batch-*-summary.json")):
        try:
            payload = _read_json(path)
        except DataArtifactError:
            continue
        if isinstance(payload, dict):
            payload["source_artifact"] = str(path.relative_to(data_dir.parent))
            runs.append(payload)
    return runs


def _evaluate_quality_gates(
    release_gates: list[dict[str, Any]],
    benchmark: BenchmarkSummary,
) -> list[QualityGateResult]:
    results: list[QualityGateResult] = []
    for gate in release_gates:
        metric = str(gate.get("metric") or "")
        threshold = float(gate.get("threshold", 0))
        direction = str(gate.get("direction") or "min")
        current = _benchmark_metric_value(metric, benchmark)
        passed = None
        if current is not None:
            passed = current <= threshold if direction == "max" else current >= threshold
        results.append(
            QualityGateResult(
                metric=metric,
                threshold=threshold,
                direction=direction,
                current=current,
                passed=passed,
                source=benchmark.source_artifact or benchmark.source,
            )
        )
    return results


def _benchmark_metric_value(metric: str, benchmark: BenchmarkSummary) -> float | None:
    if metric == "p95_latency_ms":
        return benchmark.latency_ms.get("p95")
    return benchmark.metrics.get(metric)


def load_live_seed_lookup(data_dir: Path) -> dict[str, dict[str, Any]]:
    """Load runtime HF seed metadata keyed by S3 object key when available."""
    runtime_dir = data_dir / "runtime"
    paths = [runtime_dir / "hf-live-seed-summary.json"]
    if runtime_dir.exists():
        paths.extend(sorted(runtime_dir.glob("hf-live-seed-batch-*.json")))

    if not any(path.exists() for path in paths):
        return {}
    lookup: dict[str, dict[str, Any]] = {}
    for path in paths:
        if not path.exists():
            continue
        try:
            payload = _read_json(path)
        except DataArtifactError:
            continue
        for item in payload.get("items", []):
            if not isinstance(item, dict):
                continue
            s3_key = str(item.get("s3_key") or "")
            if s3_key:
                lookup[s3_key] = item
    return lookup
