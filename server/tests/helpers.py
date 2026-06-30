import json

from app.auth import create_token
from app.config import Settings


def auth_headers(settings: Settings | None = None) -> dict[str, str]:
    active_settings = settings or Settings()
    token = create_token(active_settings.demo_password, active_settings)
    return {"Authorization": f"Bearer {token}"}


def write_json(path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def benchmark_payload() -> dict[str, object]:
    return {
        "dataset": "test-dataset",
        "provider": "test-provider",
        "query_count": 2,
        "metrics": {"precision@10": 0.9},
        "latency_ms": {"p95": 120},
        "narrative": "test benchmark",
        "source": "test",
    }


def production_readiness_payload() -> dict[str, object]:
    return {
        "source": "test",
        "updated_at": "2026-06-04T00:00:00.000Z",
        "control_plane": {},
        "collection_management": {},
        "observability": {},
        "quality_loop": {
            "release_gates": [
                {"metric": "precision@10", "threshold": 0.8, "direction": "min"},
                {"metric": "p95_latency_ms", "threshold": 200, "direction": "max"},
            ]
        },
        "resilience_scale": {},
    }


def hosted_event_settings(**overrides) -> Settings:
    values = {
        "DEMO_ENV": "production",
        "DEMO_PASSWORD": "event-password",
        "DEMO_TOKEN_SECRET": "x" * 32,
        "DEMO_CORS_ORIGINS": "https://demo.example",
        "DEMO_PRESIGN_IMAGE_URLS": False,
    }
    values.update(overrides)
    return Settings(**values)
