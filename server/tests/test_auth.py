import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

import app.main as main_module
from app.auth import TOKEN_PREFIX, LoginAttemptLimiter, _base64url_encode, _decode_token
from app.auth import _sign, create_token, require_demo_auth
from app.config import Settings
from app.main import app


def test_auth_and_status():
    with TestClient(app) as client:
        auth = client.post("/auth/login", json={"password": "inat-demo"})
        assert auth.status_code == 200
        token = auth.json()["token"]
        status = client.get("/demo/status", headers={"Authorization": f"Bearer {token}"})
    assert status.status_code == 200
    assert status.json()["authenticated"] is True


def test_auth_rejects_invalid_password():
    with TestClient(app) as client:
        response = client.post("/auth/login", json={"password": "wrong"})

    assert response.status_code == 401


def test_auth_dependency_rejects_missing_header():
    with pytest.raises(HTTPException) as missing:
        require_demo_auth(None, Settings())

    assert missing.value.detail == "Missing demo token"


def test_signed_token_rejects_tampering_and_expiry():
    settings = Settings(
        DEMO_PASSWORD="correct-password",
        DEMO_TOKEN_SECRET="x" * 32,
        DEMO_TOKEN_TTL_SECONDS=60,
    )
    token = create_token("correct-password", settings)
    payload = _decode_token(token, settings)

    with pytest.raises(HTTPException) as tampered:
        _decode_token(f"{token}x", settings)
    with pytest.raises(HTTPException) as expired:
        _decode_token(token, settings, now=payload["exp"])

    assert tampered.value.status_code == 401
    assert expired.value.detail == "Demo token expired"


def test_signed_token_rejects_malformed_tokens():
    settings = Settings(DEMO_PASSWORD="correct-password", DEMO_TOKEN_SECRET="x" * 32)
    payload_part = _base64url_encode(b"{")
    invalid_json_token = f"{TOKEN_PREFIX}{payload_part}.{_sign(payload_part, settings)}"

    with pytest.raises(HTTPException) as bad_prefix:
        _decode_token("not-a-demo-token", settings)
    with pytest.raises(HTTPException) as missing_signature:
        _decode_token(f"{TOKEN_PREFIX}missing-signature", settings)
    with pytest.raises(HTTPException) as invalid_payload:
        _decode_token(invalid_json_token, settings)

    assert bad_prefix.value.detail == "Invalid demo token"
    assert missing_signature.value.detail == "Invalid demo token"
    assert invalid_payload.value.detail == "Invalid demo token"


def test_login_attempt_limiter_tracks_failures_with_window():
    limiter = LoginAttemptLimiter(max_attempts=2, window_seconds=60)

    assert limiter.retry_after_seconds("client", now=0) is None
    limiter.record_failure("client", now=0)
    limiter.record_failure("client", now=10)
    assert limiter.retry_after_seconds("client", now=20) == 40
    assert limiter.retry_after_seconds("client", now=61) is None
    limiter.record_failure("client", now=62)
    limiter.clear("client")
    assert limiter.retry_after_seconds("client", now=63) is None


def test_login_endpoint_throttles_repeated_failures(monkeypatch):
    settings = Settings(
        DEMO_PASSWORD="correct-password",
        DEMO_AUTH_ATTEMPT_LIMIT=1,
        DEMO_AUTH_WINDOW_SECONDS=60,
        DEMO_PRESIGN_IMAGE_URLS=False,
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    throttled_app = main_module.create_app()

    with TestClient(throttled_app) as client:
        first = client.post("/auth/login", json={"password": "wrong"})
        second = client.post("/auth/login", json={"password": "wrong"})

    assert first.status_code == 401
    assert second.status_code == 429
    assert second.headers["retry-after"]
