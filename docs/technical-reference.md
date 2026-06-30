# Technical Reference

This reference keeps the system architecture, evidence sources, UI direction,
and RSE inspection path in one place.

## Runtime Model

```text
Batch script
    |
    +-- samples gt-csse HF rows
    +-- resolves iNaturalist Open Data image URLs
    +-- uploads images to local MinIO
    |
    v
Existing inquire-vector-search API
    |
    +-- Ray image ingestion job
    +-- CLIP / Infinity embedding service
    +-- Qdrant vector database
    +-- Prometheus metrics
    |
    v
Browser Portal -> Demo Backend-for-Frontend -> /search/images
```

The demo backend is a backend-for-frontend. It adapts existing source-pipeline
endpoints into presentation-friendly shapes; it does not replace the source API.

## Audience Depth

| Audience | Review Depth | Technical Evidence |
| --- | --- | --- |
| Director / Sponsor | 2-3 min | One live before/after search, throughput/latency, benchmark/readiness, cost assumption, CSSE links. |
| PI / Researcher | 10-20 min | Source metadata, representative slice, ingestion flow, embeddings, index, traceability, retrieval quality. |
| RSE / Architect | 30 min to 1 day | Service boundaries, OpenAPI contracts, scripts, metrics, tests, runtime artifacts, deployment path, limitations. |

CSSE Director and CSSE Engineer are internal/meta users of the artifact package,
not runtime modes.

## Live Workflow

1. `./scripts/live-pipeline-up.sh` starts the local stack, resets
   `inat-demo-live`, seeds batch 1, runs Ray ingestion, verifies search, and
   prints elapsed time, throughput, vector-count delta, storage bytes, and cost
   assumptions.
2. `./scripts/local-live.sh` starts the demo backend and portal.
3. The portal calls `POST /demo/search`.
4. The demo backend authenticates the request, calls pipeline
   `GET /search/images`, measures request latency, normalizes result payloads,
   and builds browser-visible MinIO image URLs.
5. `./scripts/live-ingest-batch.sh 2` samples a later HF row slice, uploads the
   image bytes under a new MinIO prefix, and appends vectors to the same Qdrant
   collection.
6. The presenter reruns the same query and shows the changed searchable corpus.

## Backend Boundary

The demo backend is responsible for:

- Password-gated access with expiring bearer tokens and failed-login throttling.
- Stable request validation before reaching the live pipeline.
- Upstream health, metrics, and search timeouts.
- Stable `503` responses for unavailable upstream services.
- Stable `502` responses for malformed upstream payloads.
- Presigned image URL normalization for browser display.
- Runtime evidence loading from `data/runtime/` when available.
- Hosted-production startup checks for password, token secret, and hosted HTTPS
  CORS origins.

For hosted events, use HTTPS, rotate `DEMO_PASSWORD`, set
`DEMO_TOKEN_SECRET`, restrict CORS, keep the source pipeline on a private
network path, and add edge rate limiting when the service is internet-accessible.

## Evidence Sources

| Evidence | Source | Used By |
| --- | --- | --- |
| Live search result | `POST /demo/search` through pipeline `/search/images` | All audiences |
| Search latency | Demo backend request timing and pipeline metrics | Director, PI, RSE |
| Batch seed metadata | `data/runtime/hf-live-seed-batch-*.json` | PI, RSE |
| Ingestion throughput | `data/runtime/live-ingest-batch-*-summary.json` | Director, RSE |
| Benchmark summary | `data/evidence/benchmark-summary.json` | Director, PI, RSE |
| Production readiness | `data/evidence/production-readiness.json` and `/demo/production-readiness` | Director, RSE |
| Runtime metrics | Pipeline `/metrics` and `/demo/status` | RSE |
| Contracts | `http://localhost:8088/docs` | RSE |
| Source implementation | `portal/`, `server/`, `scripts/`, source pipeline repo | RSE |

## UI Direction

The portal should present evidence, not just navigation. The selected design is
Scene Cockpit with a lower evidence panel:

- The 3D scene shows source, ingest, index, search, and review stages.
- The selected-stage evidence panel sits below the scene so it does not obscure
  the view.
- Stage resources vary by audience and stage.
- The Director path stays compact and outcome-oriented.
- The PI / Researcher path exposes workflow and result traceability.
- The RSE / Architect path emphasizes contracts, run commands, metrics, tests,
  deployment files, and limitations.

Fallback design:

- Evidence Board: result cards, metrics, benchmark/readiness, and links carry
  the story if 3D rendering fails or distracts.

Guided RSE refinement:

- A checklist or inspection path can be layered onto the RSE view when a
  technical reviewer wants reproducibility over narrative.

## Scale And Operating Path

The local demo proves the workflow on a bounded laptop-scale slice. The scale-up
discussion should connect that proof to managed operation:

```text
Operator / Scheduler
    |
    v
Managed Ingestion Control Plane
    |
    +-- run state and audit log
    +-- batch manifests and cost records
    +-- durable queue and worker orchestration
    +-- quality gate runner
    +-- collection promotion and rollback
    |
    v
Candidate Collection Version -> Validation -> Alias Promotion -> Live Search
```

Operating evidence to show:

- Runtime manifests for source data, object keys, elapsed time, throughput, and
  cost assumptions.
- Prometheus metrics and status evidence.
- Quality gates based on benchmark data, smoke search, latency, and metadata
  completeness.
- Candidate collection promotion and rollback pattern.
- Checkpoints, DLQ replay, retries, rate limits, and provider abstraction as
  scale-up discussion points.

## Benchmark Capture

For a final large-run capture, run from the source pipeline repo:

```bash
uv run inq bench run \
  --dataset bench/datasets/inquire/inquire-val-subset.json \
  --provider qdrant \
  --limit 10 \
  --format both \
  --output ../inat-inquire-demo/recordings/metadata/benchmark/recorded-run-summary.json
```

Then update:

- `data/evidence/benchmark-summary.json`
- `data/evidence/metrics-highlight.json`
- Final slide metrics or recorded fallback evidence

If final large-run evidence is not available, placeholder values must be labeled
clearly.

## RSE Inspection Path

| Area | Files Or Endpoints | What To Verify |
| --- | --- | --- |
| Portal contract | `portal/src/api.ts`, `portal/src/App.tsx`, `portal/src/data/content.ts` | Auth expiry behavior, audience routing, normalized types, stage evidence, external links. |
| Backend contract | `server/app/main.py`, `server/app/models.py`, `server/app/pipeline.py` | Request validation, timeouts, response normalization, metric parsing, stable errors. |
| Runtime artifacts | `data/evidence/*.json`, local `data/runtime/*.json` | Benchmark source, production-readiness evidence, batch metadata, cost assumptions. |
| Operations scripts | `scripts/live-pipeline-up.sh`, `scripts/live-ingest-batch.sh`, `scripts/live-pipeline-down.sh` | Stack startup, batch seeding, Ray job polling, Qdrant checks, cache handling, teardown. |
| Deployment path | `Dockerfile`, `docker-compose.demo.yml`, `.env.example` | Health checks, environment contract, production settings, pipeline URL routing. |
| Release checks | `scripts/validate.sh`, `.github/workflows/validate.yml`, `server/tests/test_app.py` | JSON validation, shell syntax, Ruff, backend tests, portal type checks, CI parity. |

## Known Constraints

- The demo does not change source-pipeline public endpoints.
- The local run is a representative image/data slice, not a full-corpus claim.
- Runtime image files and search-result fixtures are not committed.
- Hosted events require production environment settings and credential rotation.
- The framework extracted from this project is artifact-based, not a reusable UI
  or software platform.
