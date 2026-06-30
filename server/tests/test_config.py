import pytest
from pydantic import ValidationError

from app.config import Settings
from tests.helpers import hosted_event_settings


def test_settings_normalize_and_validate_inputs():
    assert Settings(DEMO_TOKEN_SECRET="").demo_token_secret is None

    with pytest.raises(ValidationError, match="DEMO_PASSWORD must not be blank"):
        Settings(DEMO_PASSWORD="")
    with pytest.raises(ValidationError, match="URL must be absolute"):
        Settings(PIPELINE_API_URL="ftp://pipeline.test")


def test_production_config_rejects_local_security_defaults():
    settings = Settings(DEMO_ENV="production", DEMO_PASSWORD="inat-demo")

    with pytest.raises(RuntimeError, match="Unsafe production demo configuration"):
        settings.validate_security_posture()


def test_production_config_rejects_wildcard_cors():
    settings = Settings(
        DEMO_ENV="production",
        DEMO_PASSWORD="event-password",
        DEMO_TOKEN_SECRET="x" * 32,
        DEMO_CORS_ORIGINS="*",
    )

    with pytest.raises(RuntimeError, match="replace wildcard"):
        settings.validate_security_posture()


def test_production_config_rejects_insecure_cors_origins():
    settings = hosted_event_settings(DEMO_CORS_ORIGINS="http://demo.example,https://demo.example")

    with pytest.raises(RuntimeError, match="hosted HTTPS origins"):
        settings.validate_security_posture()


def test_production_config_accepts_hosted_https_origin():
    hosted_event_settings().validate_security_posture()
