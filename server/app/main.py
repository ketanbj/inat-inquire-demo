"""FastAPI backend-for-frontend for the iNat x INQUIRE demo."""

from __future__ import annotations

from contextlib import asynccontextmanager

import boto3
import httpx
from botocore.config import Config
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi import status as http_status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from httpx import HTTPError

from .auth import LoginAttemptLimiter, create_token, require_demo_auth
from .config import Settings, get_settings
from .data import DataArtifactError, load_benchmark_summary, load_live_seed_lookup
from .data import load_production_readiness
from .models import AuthRequest, AuthResponse, DemoStatus, SearchRequest, SearchResponse
from .pipeline import PipelinePayloadError, fetch_pipeline_metrics, pipeline_is_online
from .pipeline import presigned_object_url
from .pipeline import search_live_pipeline
from .pipeline import summarize_prometheus_metrics


def create_app() -> FastAPI:
    """Create the demo backend application."""
    settings = get_settings()
    settings.validate_security_posture()
    login_limiter = LoginAttemptLimiter(
        max_attempts=settings.demo_auth_attempt_limit,
        window_seconds=settings.demo_auth_window_seconds,
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        timeout = httpx.Timeout(
            settings.pipeline_request_timeout_seconds,
            connect=settings.pipeline_health_timeout_seconds,
        )
        app.state.pipeline_client = httpx.AsyncClient(
            timeout=timeout,
            headers={"User-Agent": f"inat-inquire-demo/{app.version}"},
        )
        app.state.image_url_factory = create_image_url_factory(settings)
        try:
            yield
        finally:
            await app.state.pipeline_client.aclose()

    app = FastAPI(
        title="iNat x INQUIRE Demo API",
        version="0.1.0",
        description="Password-gated backend proxy for the live iNat x INQUIRE demo portal.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.exception_handler(DataArtifactError)
    async def data_artifact_error_handler(
        _: Request,
        exc: DataArtifactError,
    ) -> JSONResponse:
        detail = (
            str(exc)
            if settings.demo_environment != "production"
            else "Required demo data is unavailable."
        )
        return JSONResponse(status_code=500, content={"detail": detail})

    @app.get("/healthz")
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/readyz", response_model=None)
    async def readyz(s: Settings = Depends(get_settings)):
        checks: dict[str, bool] = {
            "benchmark_summary": False,
            "production_readiness": False,
            "static_portal": s.static_dir.exists(),
        }
        try:
            load_benchmark_summary(s.data_dir)
            checks["benchmark_summary"] = True
            load_production_readiness(s.data_dir)
            checks["production_readiness"] = True
        except DataArtifactError:
            pass

        if all(checks.values()):
            return {"status": "ok", "checks": checks}
        return JSONResponse(status_code=503, content={"status": "not_ready", "checks": checks})

    @app.post("/auth/login", response_model=AuthResponse)
    async def login(
        payload: AuthRequest,
        request: Request,
        s: Settings = Depends(get_settings),
    ) -> AuthResponse:
        client_key = client_identifier(request)
        retry_after = login_limiter.retry_after_seconds(client_key)
        if retry_after is not None:
            raise HTTPException(
                status_code=http_status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        try:
            token = create_token(payload.password, s)
        except HTTPException as exc:
            if exc.status_code == http_status.HTTP_401_UNAUTHORIZED:
                login_limiter.record_failure(client_key)
            raise

        login_limiter.clear(client_key)
        return AuthResponse(token=token)

    @app.get("/demo/status", response_model=DemoStatus)
    async def status(
        request: Request,
        _: bool = Depends(require_demo_auth),
        s: Settings = Depends(get_settings),
    ) -> DemoStatus:
        client: httpx.AsyncClient = request.app.state.pipeline_client
        online = await pipeline_is_online(
            s.normalized_pipeline_api_url,
            client,
            timeout_s=s.pipeline_health_timeout_seconds,
        )
        metric_source = "live pipeline unavailable"
        metric_highlights: dict[str, str | int | float] = {}
        if online:
            try:
                live_metrics = summarize_prometheus_metrics(
                    await fetch_pipeline_metrics(
                        s.normalized_pipeline_api_url,
                        client,
                        timeout_s=s.pipeline_metrics_timeout_seconds,
                    )
                )
                if live_metrics:
                    metric_highlights = live_metrics
                metric_source = "live pipeline /metrics"
            except HTTPError:
                pass
        return DemoStatus(
            mode="live",
            authenticated=True,
            pipeline_online=online,
            pipeline_url=s.normalized_pipeline_api_url,
            metric_highlights=metric_highlights,
            metric_source=metric_source,
        )

    @app.get("/demo/benchmark")
    async def benchmark(
        _: bool = Depends(require_demo_auth),
        s: Settings = Depends(get_settings),
    ) -> dict[str, object]:
        return load_benchmark_summary(s.data_dir).model_dump()

    @app.get("/demo/production-readiness")
    async def production_readiness(
        _: bool = Depends(require_demo_auth),
        s: Settings = Depends(get_settings),
    ) -> dict[str, object]:
        return load_production_readiness(s.data_dir).model_dump()

    @app.post("/demo/search", response_model=SearchResponse, response_model_exclude_none=True)
    async def search(
        request: SearchRequest,
        http_request: Request,
        _: bool = Depends(require_demo_auth),
        s: Settings = Depends(get_settings),
    ) -> SearchResponse:
        client: httpx.AsyncClient = http_request.app.state.pipeline_client
        try:
            return await search_live_pipeline(
                base_url=s.normalized_pipeline_api_url,
                client=client,
                query=request.query,
                limit=request.limit,
                collection=request.collection,
                minio_public_url=s.normalized_minio_public_url,
                seed_lookup=load_live_seed_lookup(s.data_dir),
                object_url_factory=http_request.app.state.image_url_factory,
                timeout_s=s.pipeline_request_timeout_seconds,
            )
        except HTTPError as exc:
            raise HTTPException(
                status_code=503,
                detail="Live pipeline search is unavailable. Run ./scripts/live-pipeline-up.sh first.",
            ) from exc
        except PipelinePayloadError as exc:
            detail = "Live pipeline search returned an unexpected response."
            if settings.demo_environment != "production":
                detail = f"{detail}: {exc}"
            raise HTTPException(
                status_code=502,
                detail=detail,
            ) from exc

    if settings.static_dir.exists():
        app.mount("/", StaticFiles(directory=settings.static_dir, html=True), name="portal")

    return app


def create_image_url_factory(settings: Settings):
    """Create the image URL builder used for live search results."""
    if not settings.demo_presign_image_urls:
        return None

    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.normalized_minio_public_url,
        aws_access_key_id=settings.demo_s3_access_key_id,
        aws_secret_access_key=settings.demo_s3_secret_access_key,
        region_name=settings.demo_s3_region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )

    def factory(s3_uri: str, s3_key: str) -> str:
        return presigned_object_url(
            s3_client,
            s3_uri,
            s3_key,
            expires_in_seconds=settings.demo_image_url_ttl_seconds,
        )

    return factory


def client_identifier(request: Request) -> str:
    """Return the network identity used for local app-level auth throttling."""
    return request.client.host if request.client else "unknown-client"


app = create_app()
