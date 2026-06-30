"""Runtime configuration for the demo backend."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven settings for the backend-for-frontend.

    The defaults are intentionally laptop-friendly. Set ``DEMO_ENV=production``
    in hosted environments to turn weak local defaults into startup failures.
    """

    demo_password: str = Field(default="inat-demo", alias="DEMO_PASSWORD")
    demo_token_secret: str | None = Field(default=None, alias="DEMO_TOKEN_SECRET")
    demo_token_ttl_seconds: int = Field(
        default=12 * 60 * 60,
        ge=60,
        le=7 * 24 * 60 * 60,
        alias="DEMO_TOKEN_TTL_SECONDS",
    )
    demo_auth_attempt_limit: int = Field(default=10, ge=1, le=100, alias="DEMO_AUTH_ATTEMPT_LIMIT")
    demo_auth_window_seconds: int = Field(
        default=5 * 60,
        ge=60,
        le=60 * 60,
        alias="DEMO_AUTH_WINDOW_SECONDS",
    )
    demo_environment: Literal["local", "production"] = Field(default="local", alias="DEMO_ENV")
    pipeline_api_url: str = Field(default="http://localhost:8010", alias="PIPELINE_API_URL")
    minio_public_url: str = Field(default="http://localhost:9000", alias="MINIO_PUBLIC_URL")
    demo_s3_access_key_id: str = Field(default="minioadmin", alias="DEMO_S3_ACCESS_KEY_ID")
    demo_s3_secret_access_key: str = Field(default="minioadmin", alias="DEMO_S3_SECRET_ACCESS_KEY")
    demo_s3_region: str = Field(default="us-east-1", alias="DEMO_S3_REGION")
    demo_presign_image_urls: bool = Field(default=True, alias="DEMO_PRESIGN_IMAGE_URLS")
    demo_image_url_ttl_seconds: int = Field(
        default=60 * 60,
        ge=60,
        le=24 * 60 * 60,
        alias="DEMO_IMAGE_URL_TTL_SECONDS",
    )
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="DEMO_CORS_ORIGINS",
    )
    pipeline_health_timeout_seconds: float = Field(
        default=3.0,
        gt=0,
        le=30,
        alias="PIPELINE_HEALTH_TIMEOUT_SECONDS",
    )
    pipeline_metrics_timeout_seconds: float = Field(
        default=5.0,
        gt=0,
        le=30,
        alias="PIPELINE_METRICS_TIMEOUT_SECONDS",
    )
    pipeline_request_timeout_seconds: float = Field(
        default=30.0,
        gt=0,
        le=120,
        alias="PIPELINE_REQUEST_TIMEOUT_SECONDS",
    )
    data_dir: Path = Field(
        default=Path(__file__).resolve().parents[2] / "data",
        alias="DEMO_DATA_DIR",
    )
    static_dir: Path = Field(
        default=Path(__file__).resolve().parents[2] / "portal" / "dist",
        alias="DEMO_STATIC_DIR",
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("demo_password")
    @classmethod
    def _password_must_not_be_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("DEMO_PASSWORD must not be blank")
        return value

    @field_validator("demo_token_secret", mode="before")
    @classmethod
    def _blank_token_secret_is_unset(cls, value: str | None) -> str | None:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("pipeline_api_url", "minio_public_url")
    @classmethod
    def _url_must_be_http(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("URL must be absolute and use http or https")
        return value.rstrip("/")

    @property
    def normalized_pipeline_api_url(self) -> str:
        """Return pipeline API URL without a trailing slash."""
        return self.pipeline_api_url

    @property
    def normalized_minio_public_url(self) -> str:
        """Return MinIO public URL without a trailing slash."""
        return self.minio_public_url

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_security_posture(self) -> None:
        """Fail fast when hosted production is using local-demo security defaults."""
        if self.demo_environment != "production":
            return

        problems: list[str] = []
        if self.demo_password == "inat-demo" or len(self.demo_password) < 12:
            problems.append("set DEMO_PASSWORD to an event-specific value with at least 12 characters")
        if not self.demo_token_secret or len(self.demo_token_secret) < 32:
            problems.append("set DEMO_TOKEN_SECRET to at least 32 random characters")
        if "*" in self.cors_origin_list:
            problems.append("replace wildcard DEMO_CORS_ORIGINS with explicit HTTPS origins")
        insecure_origins = [
            origin
            for origin in self.cors_origin_list
            if urlparse(origin).scheme != "https"
            or (urlparse(origin).hostname or "").lower()
            in {"localhost", "127.0.0.1", "0.0.0.0"}
        ]
        if insecure_origins:
            problems.append("use only hosted HTTPS origins in DEMO_CORS_ORIGINS")

        if problems:
            joined = "; ".join(problems)
            raise RuntimeError(f"Unsafe production demo configuration: {joined}.")


@lru_cache
def get_settings() -> Settings:
    """Return cached backend settings."""
    return Settings()
