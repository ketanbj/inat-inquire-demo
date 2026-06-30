# Operations Runbook

Use this runbook to present the local live demo: batch 1 ingestion, live search,
batch 2 append, same-query search, and evidence review.

## Prerequisites

- Docker Desktop is running.
- `git`, `uv`, `python3`, `npm`, and `curl` are available.
- The demo and source pipeline repos use the default sibling layout, or
  `INQUIRE_VECTOR_SEARCH_PATH` is set in `.env`.

```text
inat-inquire-workspace/
  Inquire-vector-search/
  inat-inquire-demo/
```

Fresh setup:

```bash
mkdir inat-inquire-workspace
cd inat-inquire-workspace
git clone https://github.com/inaturalist/Inquire-vector-search.git
git clone https://github.com/ketanbj/inat-inquire-demo.git
cd inat-inquire-demo
```

## Start

Bootstrap the demo repo:

```bash
[ -f .env ] || cp .env.example .env
./scripts/bootstrap.sh
```

Start the source pipeline stack, reset `inat-demo-live`, seed batch 1, ingest it,
and verify search:

```bash
./scripts/live-pipeline-up.sh
```

Start the portal against the live pipeline:

```bash
./scripts/local-live.sh
```

Open:

| Surface | Location |
| --- | --- |
| Portal | `http://localhost:5173` |
| Demo API docs | `http://localhost:8088/docs` |
| Password | `inat-demo` |

## Live Demo Flow

1. Select the audience view for the room.
2. Run one rehearsed query.
3. Point out ranked images, scores, source metadata, object keys, dimensions,
   and the latency chip.
4. Append batch 2 while the portal stays open:

```bash
./scripts/live-ingest-batch.sh 2
```

5. Rerun the same query.
6. Point out the changed result set and the metric/readiness evidence.
7. Use the evidence panel and RSE links only as deeply as the audience needs.

If the live path is unavailable or the result change is too subtle, use
[Fallback Evidence](./fallback-evidence.md) instead of improvising a new proof
path.

Recommended query:

| Query | Use |
| --- | --- |
| `nudibranch` | Default before/after query. Batch 2 moves nudibranch and marine invertebrate images upward. |

Backup queries:

| Query | Use |
| --- | --- |
| `sea anemone` | Batch 2 adds stronger marine invertebrate images. |
| `desert shrub` | Batch 2 adds desert shrub and rocky habitat images. |
| `pink wildflower` | Batch 2 adds stronger flower matches. |
| `harbor seals` | Batch 2 adds seal images after a weak baseline. |
| `small bird in grass` | Batch 2 adds bird-in-grass images. |
| `sea lions on rocks` | Useful when the room expects the earlier query wording. |

Avoid these same-query choices with the current slices:

- `orange nudibranch`
- `flowering plant`
- `shell on sand`

They were weak or batch-1-heavy during rehearsal.

## Presenter Tracks

Use the same live setup for every audience. Change the depth, panel order, and
closing ask.

| Audience | Time | Path | Emphasis |
| --- | --- | --- | --- |
| Director / Sponsor | 2-3 min | One query, before/after result, quality/latency/cost readout, CSSE links. | Outcome, credibility, resource investment, next funding or partnership decision. |
| PI / Researcher | 10-20 min | Search, source metadata, ingestion flow, embedding/index/search path, retrieval evidence. | Problem understanding, workflow complexity, representative image/data slice, solution architecture. |
| RSE / Architect | 30 min to 1 day | RSE view, API docs, repos, scripts, runtime summaries, metrics, tests, deployment path. | Reproducibility, contracts, observability, recovery, validation, and scale options. |

CSSE Director and CSSE Engineer are internal/meta users of the artifact package,
not portal presenter tracks.

## Short Scripts

Director / Sponsor:

1. State the outcome: CSSE turned a complex scientific image workflow into a
   searchable, measurable, inspectable system.
2. Run `nudibranch`.
3. Show the before/after result change or the prepared evidence from a rehearsal.
4. Show latency, throughput, benchmark/readiness, and CSSE people/portfolio
   links.
5. Close on the investment decision needed for the next increment.

PI / Researcher:

1. Name the scientific workflow: biodiversity images need to become searchable
   with metadata and measurable retrieval quality.
2. Show the source image metadata and batch-specific ingestion.
3. Explain storage, embedding, Qdrant indexing, search, and traceability.
4. Run the before/after query.
5. State the boundary: the local run is a representative slice, not a full
   corpus claim.

RSE / Architect:

1. Start in the RSE view.
2. Inspect `POST /demo/search`, `/demo/status`, benchmark evidence, runtime
   manifests, and production-readiness evidence.
3. Review `server/`, `portal/`, `scripts/`, `Dockerfile`,
   `docker-compose.demo.yml`, and `scripts/validate.sh`.
4. Use [Technical Reference](./technical-reference.md) as the self-guided
   inspection route.

## Manual Health Checks

Use these if a presenter wants to verify the stack manually:

```bash
curl -fsS http://localhost:8010/healthz
curl -fsS http://localhost:6333/collections/inat-demo-live
curl -fsS 'http://localhost:8010/search/images?q=nudibranch&limit=5&collection=inat-demo-live'
curl -fsS http://localhost:8088/healthz
TOKEN="$(curl -fsS -X POST http://localhost:8088/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"inat-demo"}' \
  | python3 -c 'import json, sys; print(json.load(sys.stdin)["token"])')"
curl -fsS -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:8088/demo/production-readiness
```

Expected:

- Pipeline health returns `{"status":"ok"}`.
- Qdrant `points_count` is greater than `0`.
- Search returns provider/model data and at least one result.
- Demo backend health returns `{"status":"ok"}`.
- Production-readiness evidence includes operating controls, versioning,
  observability, quality gates, and resilience evidence.

## Runtime Evidence

The local demo writes runtime evidence under `data/runtime/`:

| Artifact | Purpose |
| --- | --- |
| `hf-live-seed-batch-*.json` | HF datasets, iNaturalist photo IDs, source URLs, object keys, dimensions, byte sizes. |
| `live-ingest-batch-*-summary.json` | Uploaded image count, byte count, vector-count delta, elapsed time, throughput, verification query, estimated cost. |

`data/runtime/` is intentionally ignored by git. Do not commit static images or
saved search-result fixtures.

## Common Configuration

Set these in `.env` before running `./scripts/live-pipeline-up.sh` when needed:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DEMO_PASSWORD` | `inat-demo` | Local password gate. Rotate for hosted events. |
| `DEMO_ENV` | `local` | Set to `production` for hosted demos. |
| `DEMO_TOKEN_SECRET` | unset | Required in production mode. Use at least 32 random characters. |
| `DEMO_AUTH_ATTEMPT_LIMIT` | `10` | Failed password attempts allowed per app-process client window. |
| `DEMO_AUTH_WINDOW_SECONDS` | `300` | Window for the in-process failed-login throttle. |
| `DEMO_CORS_ORIGINS` | local portal origins | Use hosted HTTPS origins in production, or leave empty for same-origin serving. |
| `INQUIRE_VECTOR_SEARCH_PATH` | `../Inquire-vector-search` | Source pipeline repo path. |
| `PIPELINE_API_URL` | `http://localhost:8010` | Host URL for the pipeline API. |
| `DEMO_LIVE_COLLECTION` | `inat-demo-live` | Qdrant collection searched by the portal. |
| `DEMO_VERIFY_QUERY` | `nudibranch` | Query used by setup scripts for verification. |
| `DEMO_SEMANTIC_CACHE_ENABLED` | `false` | Keeps same-query before/after searches from using stale cache. |
| `DEMO_HF_IMAGES_PER_DATASET` | `8` | Number of resolved images to seed from each HF dataset. |
| `DEMO_COST_PER_1K_IMAGES_USD` | `0` | Optional cost assumption. |
| `DEMO_COST_PER_COMPUTE_HOUR_USD` | `0` | Optional compute-hour assumption. |
| `DEMO_REMOVE_VOLUMES` | `0` | Set to `1` before teardown to remove Docker volumes. |

## Fallbacks

| Failure | Action |
| --- | --- |
| Pipeline unavailable | Run `./scripts/live-pipeline-up.sh` before starting the portal. |
| Batch 2 result change is subtle | Use `nudibranch` or another rehearsed backup query; confirm semantic cache is disabled. |
| Image URL fails | Check MinIO at `http://localhost:9000` and rerun live setup. |
| Live metrics are unavailable | Use [Fallback Evidence](./fallback-evidence.md) and state that the values are captured demo evidence, not fresh live metrics. |
| 3D scene distracts or fails | Use the evidence panel, result cards, and RSE links as the primary proof path. |

## Stop

Stop the portal with `Ctrl-C`, then stop the pipeline stack:

```bash
./scripts/live-pipeline-down.sh
```

Run validation before delivery:

```bash
./scripts/validate.sh
```
