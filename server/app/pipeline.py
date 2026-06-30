"""Live pipeline API adapter for the demo backend."""

from __future__ import annotations

import re
import time
from collections.abc import Callable
from typing import Any
from urllib.parse import quote

import httpx

from .models import SearchResponse, SearchResult


_PROMETHEUS_LABEL_RE = re.compile(r'([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\.|[^"\\])*)"')


class PipelinePayloadError(RuntimeError):
    """Raised when the live pipeline returns an unexpected payload shape."""


ObjectUrlFactory = Callable[[str, str], str]


async def pipeline_is_online(
    base_url: str,
    client: httpx.AsyncClient,
    *,
    timeout_s: float = 3.0,
) -> bool:
    """Return whether the live pipeline health endpoint responds."""
    try:
        response = await client.get(f"{base_url}/healthz", timeout=timeout_s)
        return response.status_code == 200
    except httpx.HTTPError:
        return False


async def fetch_pipeline_metrics(
    base_url: str,
    client: httpx.AsyncClient,
    *,
    timeout_s: float = 5.0,
) -> str:
    """Fetch Prometheus metrics text from the live pipeline."""
    response = await client.get(f"{base_url}/metrics", timeout=timeout_s)
    response.raise_for_status()
    return response.text


def summarize_prometheus_metrics(metrics_text: str) -> dict[str, str | int | float]:
    """Extract demo-safe highlights from the live pipeline Prometheus metrics."""
    samples = _parse_prometheus_samples(metrics_text)
    highlights: dict[str, str | int | float] = {}

    successful = _sum_metric(samples, "inatinq_ingestion_documents_processed_total", {"status": "success"})
    failed = _sum_metric(samples, "inatinq_ingestion_documents_processed_total", {"status": "failed"})
    checkpoint_saves = _sum_metric(samples, "inatinq_ingestion_checkpoint_saves_total")
    cache_hits = _sum_metric(samples, "inatinq_cache_hits_total")
    cache_misses = _sum_metric(samples, "inatinq_cache_misses_total")
    embedding_p95 = _histogram_quantile_ms(
        samples, "inatinq_search_embedding_duration_seconds_bucket", 0.95
    )
    vector_p95 = _histogram_quantile_ms(
        samples, "inatinq_search_vector_query_duration_seconds_bucket", 0.95
    )

    if successful is not None:
        highlights["ingested_success_total"] = int(successful)
    if failed is not None:
        highlights["ingested_failed_total"] = int(failed)
    if checkpoint_saves is not None:
        highlights["checkpoint_saves"] = int(checkpoint_saves)
    if cache_hits is not None or cache_misses is not None:
        hits = cache_hits or 0.0
        misses = cache_misses or 0.0
        total = hits + misses
        highlights["cache_hit_ratio"] = f"{round((hits / total) * 100)}%" if total else "0%"
    if embedding_p95 is not None:
        highlights["embedding_p95_ms"] = round(embedding_p95)
    if vector_p95 is not None:
        highlights["vector_query_p95_ms"] = round(vector_p95)
        highlights["p95_search_latency_ms"] = round(vector_p95)

    return highlights


def _parse_prometheus_samples(metrics_text: str) -> list[tuple[str, dict[str, str], float]]:
    samples: list[tuple[str, dict[str, str], float]] = []
    for raw_line in metrics_text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        metric_part, _, value_part = line.rpartition(" ")
        if not metric_part or not value_part:
            continue
        try:
            value = float(value_part)
        except ValueError:
            continue
        if "{" in metric_part and metric_part.endswith("}"):
            name, label_text = metric_part.split("{", 1)
            labels = _parse_labels(label_text[:-1])
        else:
            name = metric_part
            labels = {}
        samples.append((name, labels, value))
    return samples


def _parse_labels(label_text: str) -> dict[str, str]:
    """Parse Prometheus labels without splitting on escaped commas in values."""
    return {
        key: bytes(value, "utf-8").decode("unicode_escape")
        for key, value in _PROMETHEUS_LABEL_RE.findall(label_text)
    }


def _labels_match(labels: dict[str, str], expected: dict[str, str]) -> bool:
    return all(labels.get(key) == value for key, value in expected.items())


def _sum_metric(
    samples: list[tuple[str, dict[str, str], float]],
    name: str,
    expected_labels: dict[str, str] | None = None,
) -> float | None:
    total = 0.0
    found = False
    expected = expected_labels or {}
    for sample_name, labels, value in samples:
        if sample_name == name and _labels_match(labels, expected):
            total += value
            found = True
    return total if found else None


def _histogram_quantile_ms(
    samples: list[tuple[str, dict[str, str], float]],
    bucket_name: str,
    quantile: float,
) -> float | None:
    buckets: dict[float, float] = {}
    for sample_name, labels, value in samples:
        if sample_name != bucket_name:
            continue
        le = labels.get("le")
        if le in (None, "+Inf"):
            continue
        try:
            upper_bound = float(le)
        except ValueError:
            continue
        buckets[upper_bound] = buckets.get(upper_bound, 0.0) + value

    if not buckets:
        return None

    ordered = sorted(buckets.items())
    total = ordered[-1][1]
    if total <= 0:
        return None
    target = total * quantile
    for upper_bound, cumulative in ordered:
        if cumulative >= target:
            return upper_bound * 1000
    return ordered[-1][0] * 1000


async def search_live_pipeline(
    *,
    base_url: str,
    client: httpx.AsyncClient,
    query: str,
    limit: int,
    collection: str | None,
    minio_public_url: str,
    seed_lookup: dict[str, dict[str, Any]] | None = None,
    object_url_factory: ObjectUrlFactory | None = None,
    timeout_s: float = 30.0,
) -> SearchResponse:
    """Call the existing pipeline API and normalize the response for the portal."""
    params: dict[str, Any] = {"q": query, "limit": limit}
    if collection:
        params["collection"] = collection

    start = time.perf_counter()
    response = await client.get(f"{base_url}/search/images", params=params, timeout=timeout_s)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise PipelinePayloadError("Pipeline search response must be a JSON object.")
    latency_ms = round((time.perf_counter() - start) * 1000)

    normalized: list[SearchResult] = []
    raw_results = payload.get("results", [])
    if not isinstance(raw_results, list):
        raise PipelinePayloadError("Pipeline search response field 'results' must be a list.")

    for idx, item in enumerate(raw_results, start=1):
        if not isinstance(item, dict):
            continue
        s3_key = str(item.get("s3_key") or "")
        s3_uri = str(item.get("s3_uri") or "")
        title = s3_key.rsplit("/", 1)[-1] or "Search result"
        image_url = (
            object_url_factory(s3_uri, s3_key)
            if object_url_factory
            else _public_object_url(minio_public_url, s3_uri, s3_key)
        )
        seed = (seed_lookup or {}).get(s3_key, {})
        dataset = seed.get("dataset")
        normalized.append(
            SearchResult(
                id=str(item.get("id", s3_key or idx)),
                rank=idx,
                score=_safe_float(item.get("score"), default=0.0),
                title=title,
                image_url=image_url,
                s3_key=s3_key,
                s3_uri=s3_uri,
                format=item.get("format"),
                width=_safe_int(item.get("width")),
                height=_safe_int(item.get("height")),
                source="live-pipeline",
                dataset=dataset,
                source_url=seed.get("source_url"),
                license=seed.get("license"),
                explanation=(
                    f"Live vector search result ingested from {dataset}."
                    if dataset
                    else "Live vector search result returned by the iNatInq pipeline."
                ),
            )
        )

    total = _safe_int(payload.get("total"), default=len(normalized))
    return SearchResponse(
        query=str(payload.get("query") or query),
        mode="live",
        provider=str(payload.get("provider") or "qdrant"),
        model=str(payload.get("model") or "unknown"),
        collection=str(payload.get("collection") or collection or "documents"),
        latency_ms=latency_ms,
        total=total if total is not None else len(normalized),
        results=normalized,
    )


def _public_object_url(minio_public_url: str, s3_uri: str, s3_key: str) -> str:
    """Build a browser-visible MinIO object URL for live ingested image data."""
    location = _object_location(s3_uri, s3_key)
    if location is None:
        return ""
    bucket, key = location
    encoded_bucket = quote(bucket, safe="")
    encoded_key = "/".join(quote(part, safe="") for part in key.lstrip("/").split("/"))
    return f"{minio_public_url.rstrip('/')}/{encoded_bucket}/{encoded_key}"


def presigned_object_url(
    s3_client: Any,
    s3_uri: str,
    s3_key: str,
    *,
    expires_in_seconds: int,
) -> str:
    """Build a browser-visible, short-lived MinIO object URL."""
    location = _object_location(s3_uri, s3_key)
    if location is None:
        return ""
    bucket, key = location
    return str(
        s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in_seconds,
        )
    )


def _object_location(s3_uri: str, s3_key: str) -> tuple[str, str] | None:
    """Return the S3 bucket and key represented by the live pipeline payload."""
    bucket = "pipeline"
    if not s3_key and s3_uri.startswith("s3://"):
        path = s3_uri.removeprefix("s3://")
        bucket, _, key_from_uri = path.partition("/")
        if key_from_uri:
            s3_key = key_from_uri
    if not s3_key:
        return None
    return bucket, s3_key


def _safe_float(value: Any, *, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, *, default: int | None = None) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
