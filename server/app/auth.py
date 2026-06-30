"""Password gate and signed bearer tokens for the private demo."""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import secrets
import time
from collections import defaultdict, deque
from typing import Any

from fastapi import Depends, Header, HTTPException, status

from .config import Settings, get_settings

TOKEN_PREFIX = "demo-v1."
_PROCESS_TOKEN_SECRET = secrets.token_bytes(32)


class LoginAttemptLimiter:
    """Small in-process throttle for the hosted-event password gate."""

    def __init__(self, *, max_attempts: int, window_seconds: int) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def retry_after_seconds(self, key: str, *, now: float | None = None) -> int | None:
        attempts = self._active_failures(key, now=now)
        if len(attempts) < self.max_attempts:
            return None
        current_time = now if now is not None else time.monotonic()
        return max(1, int(self.window_seconds - (current_time - attempts[0])))

    def record_failure(self, key: str, *, now: float | None = None) -> None:
        attempts = self._active_failures(key, now=now)
        attempts.append(now if now is not None else time.monotonic())

    def clear(self, key: str) -> None:
        self._failures.pop(key, None)

    def _active_failures(self, key: str, *, now: float | None = None) -> deque[float]:
        current_time = now if now is not None else time.monotonic()
        attempts = self._failures[key]
        while attempts and current_time - attempts[0] >= self.window_seconds:
            attempts.popleft()
        return attempts


def create_token(password: str, settings: Settings) -> str:
    """Return a signed, expiring token only when the configured password is valid."""
    if not secrets.compare_digest(password, settings.demo_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    now = int(time.time())
    payload = {
        "iat": now,
        "exp": now + settings.demo_token_ttl_seconds,
        "nonce": secrets.token_urlsafe(18),
    }
    payload_part = _base64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = _sign(payload_part, settings)
    return f"{TOKEN_PREFIX}{payload_part}.{signature}"


def require_demo_auth(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> bool:
    """Validate the bearer token used by the demo portal."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing demo token")

    token = authorization.removeprefix("Bearer ").strip()
    _decode_token(token, settings)
    return True


def _decode_token(token: str, settings: Settings, *, now: int | None = None) -> dict[str, Any]:
    if not token.startswith(TOKEN_PREFIX):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid demo token")

    token_body = token.removeprefix(TOKEN_PREFIX)
    try:
        payload_part, signature = token_body.split(".", 1)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo token",
        ) from exc

    expected_signature = _sign(payload_part, settings)
    if not secrets.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid demo token")

    try:
        payload = json.loads(_base64url_decode(payload_part))
    except (binascii.Error, json.JSONDecodeError, UnicodeDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo token",
        ) from exc

    expires_at = int(payload.get("exp", 0))
    if expires_at <= (now if now is not None else int(time.time())):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Demo token expired")

    return payload


def _sign(payload_part: str, settings: Settings) -> str:
    secret = (
        settings.demo_token_secret.encode("utf-8")
        if settings.demo_token_secret
        else _PROCESS_TOKEN_SECRET
    )
    digest = hmac.new(secret, payload_part.encode("ascii"), hashlib.sha256).digest()
    return _base64url_encode(digest)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> str:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
