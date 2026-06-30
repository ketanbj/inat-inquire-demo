# Demo Backend

FastAPI backend-for-frontend for the iNat x INQUIRE portal.

## Responsibilities

- Enforce the private demo password gate with signed, expiring bearer tokens.
- Throttle repeated failed password attempts in-process for hosted-event safety.
- Proxy live searches to the existing pipeline `/search/images` endpoint.
- Normalize live search results for the portal.
- Attach measured pipeline-call latency to each search response.
- Serve benchmark summaries and live status highlights.
- Serve operating-model evidence and benchmark-evaluated quality gates.
- Return a clear error when the live pipeline is unavailable.
- Validate deployment configuration at startup.

## Run

```bash
uv sync --dev
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8088
```

## Environment

```bash
DEMO_ENV=local
DEMO_PASSWORD=inat-demo
DEMO_TOKEN_SECRET=
DEMO_TOKEN_TTL_SECONDS=43200
DEMO_AUTH_ATTEMPT_LIMIT=10
DEMO_AUTH_WINDOW_SECONDS=300
PIPELINE_API_URL=http://localhost:8010
MINIO_PUBLIC_URL=http://localhost:9000
DEMO_PRESIGN_IMAGE_URLS=true
DEMO_IMAGE_URL_TTL_SECONDS=3600
DEMO_S3_ACCESS_KEY_ID=minioadmin
DEMO_S3_SECRET_ACCESS_KEY=minioadmin
DEMO_S3_REGION=us-east-1
DEMO_CORS_ORIGINS=http://localhost:5173
PIPELINE_HEALTH_TIMEOUT_SECONDS=3
PIPELINE_METRICS_TIMEOUT_SECONDS=5
PIPELINE_REQUEST_TIMEOUT_SECONDS=30
```

## Runtime Contract

The default settings are for a local, private partner demo. In local mode, the
server signs tokens with a per-process random secret when `DEMO_TOKEN_SECRET` is
unset; restarting the backend invalidates outstanding browser sessions.

Hosted deployments use `DEMO_ENV=production`. Startup requires:

- An event-specific `DEMO_PASSWORD` with at least 12 characters.
- A `DEMO_TOKEN_SECRET` with at least 32 random characters.
- Hosted HTTPS `DEMO_CORS_ORIGINS`; leave it empty only for same-origin serving.

This backend is still intentionally a demo backend-for-frontend, not a
multi-user identity provider. Put it behind HTTPS, restrict network access to
the intended audience, and rotate `DEMO_PASSWORD` plus `DEMO_TOKEN_SECRET` for
each hosted event. The in-process login throttle is a guardrail; keep reverse
proxy or WAF rate limiting in front of the service for internet-accessible demos.

## Upstream Contract

`POST /demo/search` validates the request, calls the live pipeline
`GET /search/images`, measures backend-to-pipeline latency, and returns a
normalized result shape. It does not expose the raw upstream payload to the
browser. Runtime seed metadata is optional; corrupt or incomplete
`data/runtime/` files are skipped so an interrupted local ingestion run does not
break search.
