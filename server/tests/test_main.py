import httpx
from fastapi.testclient import TestClient

import app.main as main_module
from app.config import Settings, get_settings
from app.main import app
from app.models import SearchResponse
from app.pipeline import PipelinePayloadError
from tests.helpers import auth_headers, benchmark_payload, hosted_event_settings
from tests.helpers import production_readiness_payload, write_json


def test_healthz():
    with TestClient(app) as client:
        response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_production_readiness_endpoint_evaluates_quality_gates():
    with TestClient(app) as client:
        auth = client.post("/auth/login", json={"password": "inat-demo"})
        token = auth.json()["token"]

        response = client.get(
            "/demo/production-readiness",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["control_plane"]["title"] == "Managed ingestion control plane"
    assert any(gate["metric"] == "precision@10" for gate in payload["quality_gate_results"])


def test_benchmark_endpoint_returns_artifact():
    with TestClient(app) as client:
        response = client.get("/demo/benchmark", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["dataset"]


def test_data_artifact_errors_return_json_response(tmp_path):
    settings = Settings(DEMO_DATA_DIR=tmp_path, DEMO_TOKEN_SECRET="x" * 32)
    app.dependency_overrides[get_settings] = lambda: settings

    with TestClient(app) as client:
        response = client.get("/demo/benchmark", headers=auth_headers(settings))

    assert response.status_code == 500
    assert "Required demo data artifact is missing" in response.json()["detail"]


def test_data_artifact_errors_are_generic_in_production(monkeypatch, tmp_path):
    settings = hosted_event_settings(DEMO_DATA_DIR=tmp_path, DEMO_STATIC_DIR=tmp_path / "dist")
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    production_app = main_module.create_app()
    production_app.dependency_overrides[get_settings] = lambda: settings

    with TestClient(production_app) as client:
        response = client.get("/demo/benchmark", headers=auth_headers(settings))

    assert response.status_code == 500
    assert response.json()["detail"] == "Required demo data is unavailable."


def test_readyz_reports_ready_when_artifacts_and_static_portal_exist(monkeypatch, tmp_path):
    write_json(tmp_path / "evidence" / "benchmark-summary.json", benchmark_payload())
    write_json(tmp_path / "evidence" / "production-readiness.json", production_readiness_payload())
    static_dir = tmp_path / "dist"
    static_dir.mkdir()
    settings = Settings(
        DEMO_DATA_DIR=tmp_path,
        DEMO_STATIC_DIR=static_dir,
        DEMO_PRESIGN_IMAGE_URLS=False,
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    ready_app = main_module.create_app()

    with TestClient(ready_app) as client:
        response = client.get("/readyz")

    assert response.status_code == 200
    assert response.json()["checks"] == {
        "benchmark_summary": True,
        "production_readiness": True,
        "static_portal": True,
    }


def test_readyz_reports_not_ready_when_artifacts_or_static_portal_are_missing(
    monkeypatch,
    tmp_path,
):
    settings = Settings(
        DEMO_DATA_DIR=tmp_path,
        DEMO_STATIC_DIR=tmp_path / "dist",
        DEMO_PRESIGN_IMAGE_URLS=False,
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    ready_app = main_module.create_app()

    with TestClient(ready_app) as client:
        response = client.get("/readyz")

    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"
    assert response.json()["checks"]["static_portal"] is False


def test_status_uses_live_metrics_when_pipeline_is_online(monkeypatch):
    async def online(*_args, **_kwargs):
        return True

    async def metrics(*_args, **_kwargs):
        return """
        inatinq_ingestion_documents_processed_total{status="success"} 8
        inatinq_search_vector_query_duration_seconds_bucket{le="0.1"} 1
        """

    monkeypatch.setattr(main_module, "pipeline_is_online", online)
    monkeypatch.setattr(main_module, "fetch_pipeline_metrics", metrics)

    with TestClient(app) as client:
        response = client.get("/demo/status", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["metric_source"] == "live pipeline /metrics"
    assert response.json()["metric_highlights"]["ingested_success_total"] == 8


def test_status_ignores_live_metric_fetch_failures(monkeypatch):
    async def online(*_args, **_kwargs):
        return True

    async def metrics(*_args, **_kwargs):
        raise httpx.ReadTimeout("metrics timed out")

    monkeypatch.setattr(main_module, "pipeline_is_online", online)
    monkeypatch.setattr(main_module, "fetch_pipeline_metrics", metrics)

    with TestClient(app) as client:
        response = client.get("/demo/status", headers=auth_headers())

    assert response.status_code == 200
    assert response.json()["metric_source"] == "live pipeline unavailable"


def test_search_endpoint_returns_normalized_live_results(monkeypatch):
    async def live_search(**kwargs):
        assert kwargs["query"] == "nudibranch"
        return SearchResponse(
            query="nudibranch",
            mode="live",
            provider="qdrant",
            model="clip",
            collection="inat-demo-live",
            total=0,
            results=[],
        )

    monkeypatch.setattr(main_module, "search_live_pipeline", live_search)

    with TestClient(app) as client:
        response = client.post(
            "/demo/search",
            json={"query": "nudibranch", "collection": "inat-demo-live"},
            headers=auth_headers(),
        )

    assert response.status_code == 200
    assert response.json()["query"] == "nudibranch"


def test_search_endpoint_maps_pipeline_transport_errors(monkeypatch):
    async def live_search(**_kwargs):
        raise httpx.ConnectError("pipeline unavailable")

    monkeypatch.setattr(main_module, "search_live_pipeline", live_search)

    with TestClient(app) as client:
        response = client.post("/demo/search", json={"query": "kelp"}, headers=auth_headers())

    assert response.status_code == 503
    assert "Live pipeline search is unavailable" in response.json()["detail"]


def test_search_endpoint_maps_bad_pipeline_payloads(monkeypatch):
    async def live_search(**_kwargs):
        raise PipelinePayloadError("missing results")

    monkeypatch.setattr(main_module, "search_live_pipeline", live_search)

    with TestClient(app) as client:
        response = client.post("/demo/search", json={"query": "kelp"}, headers=auth_headers())

    assert response.status_code == 502
    assert "missing results" in response.json()["detail"]


def test_search_endpoint_hides_bad_pipeline_payload_details_in_production(monkeypatch):
    settings = hosted_event_settings()
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)

    async def live_search(**_kwargs):
        raise PipelinePayloadError("sensitive upstream schema detail")

    monkeypatch.setattr(main_module, "search_live_pipeline", live_search)
    production_app = main_module.create_app()
    production_app.dependency_overrides[get_settings] = lambda: settings

    with TestClient(production_app) as client:
        response = client.post(
            "/demo/search",
            json={"query": "kelp"},
            headers=auth_headers(settings),
        )

    assert response.status_code == 502
    assert response.json()["detail"] == "Live pipeline search returned an unexpected response."


def test_create_app_mounts_static_dir_when_present(monkeypatch, tmp_path):
    settings = Settings(DEMO_STATIC_DIR=tmp_path, DEMO_PRESIGN_IMAGE_URLS=False)
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)

    created = main_module.create_app()

    assert any(route.name == "portal" for route in created.routes)


def test_image_url_factory_can_be_disabled():
    settings = Settings(DEMO_PRESIGN_IMAGE_URLS=False)

    assert main_module.create_image_url_factory(settings) is None


def test_image_url_factory_presigns_with_configured_client(monkeypatch):
    calls = []

    class FakeS3Client:
        def generate_presigned_url(self, operation, *, Params, ExpiresIn):
            calls.append((operation, Params, ExpiresIn))
            return "http://signed.test/sample.jpg"

    def fake_client(*args, **kwargs):
        calls.append((args, kwargs))
        return FakeS3Client()

    monkeypatch.setattr(main_module.boto3, "client", fake_client)
    settings = Settings(
        MINIO_PUBLIC_URL="http://minio.test",
        DEMO_S3_ACCESS_KEY_ID="access",
        DEMO_S3_SECRET_ACCESS_KEY="secret",
        DEMO_IMAGE_URL_TTL_SECONDS=900,
    )

    factory = main_module.create_image_url_factory(settings)

    assert factory("s3://pipeline/folder/sample.jpg", "") == "http://signed.test/sample.jpg"
    assert calls[0][0] == ("s3",)
    assert calls[1] == (
        "get_object",
        {"Bucket": "pipeline", "Key": "folder/sample.jpg"},
        900,
    )
