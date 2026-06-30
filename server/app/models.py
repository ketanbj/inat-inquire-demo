"""Pydantic models for the demo backend API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuthRequest(BaseModel):
    """Password authentication request."""

    model_config = ConfigDict(extra="forbid")

    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    """Password authentication response."""

    token: str


class DemoStatus(BaseModel):
    """Summary of live demo availability."""

    mode: str
    authenticated: bool
    pipeline_online: bool
    pipeline_url: str
    metric_highlights: dict[str, str | int | float]
    metric_source: str


class SearchRequest(BaseModel):
    """Demo search request."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    query: str = Field(min_length=1, max_length=512)
    limit: int = Field(default=6, ge=1, le=24)
    collection: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9_.-]*$",
    )


class SearchResult(BaseModel):
    """Normalized search result for the portal."""

    id: str
    rank: int
    score: float
    title: str
    image_url: str
    s3_key: str
    s3_uri: str
    format: str | None = None
    width: int | None = None
    height: int | None = None
    source: str
    dataset: str | None = None
    source_url: str | None = None
    license: str | None = None
    explanation: str


class SearchResponse(BaseModel):
    """Normalized search response."""

    query: str
    mode: str
    provider: str
    model: str
    collection: str
    latency_ms: int | None = None
    total: int
    results: list[SearchResult]
    raw: dict[str, Any] | None = None


class BenchmarkSummary(BaseModel):
    """Benchmark highlights used by the portal."""

    dataset: str
    provider: str
    query_count: int
    metrics: dict[str, float]
    latency_ms: dict[str, float]
    narrative: str
    source: str = "benchmark-artifact"
    source_command: str | None = None
    source_artifact: str | None = None


class QualityGateResult(BaseModel):
    """Evaluated search quality gate."""

    metric: str
    threshold: float
    direction: str = "min"
    current: float | None = None
    passed: bool | None = None
    source: str


class ProductionReadiness(BaseModel):
    """Operating-model evidence shown by the demo portal."""

    source: str
    updated_at: str
    control_plane: dict[str, Any]
    collection_management: dict[str, Any]
    observability: dict[str, Any]
    quality_loop: dict[str, Any]
    resilience_scale: dict[str, Any]
    runtime_runs: list[dict[str, Any]] = Field(default_factory=list)
    quality_gate_results: list[QualityGateResult] = Field(default_factory=list)
