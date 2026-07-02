# Demo Scripts

These scripts support a private clone-and-run demo. They are intentionally
shell-first so a presenter can run the system from a terminal without a hosted
deployment pipeline.

## Normal Operator Flow

```bash
./scripts/bootstrap.sh
./scripts/live-pipeline-up.sh
./scripts/local-live.sh
# After the first portal search:
./scripts/live-ingest-batch.sh 2
./scripts/live-pipeline-down.sh
```

Run validation before rehearsals or handoff:

```bash
./scripts/validate.sh
```

## Script Catalog

| Script | Purpose | Normal caller |
| --- | --- | --- |
| `bootstrap.sh` | Creates `.env` when missing, installs backend dependencies with `uv`, and installs portal dependencies with `npm`. | Human operator after a fresh clone. |
| `live-pipeline-up.sh` | Starts the source pipeline Docker stack, waits for API and MinIO readiness, resets the demo Qdrant collection by default, and ingests batch 1. | Human operator before opening the portal. |
| `local-live.sh` | Runs the FastAPI backend and Vite portal against the local live pipeline. | Human operator during the demo. |
| `live-ingest-batch.sh` | Seeds one HF-sampled iNaturalist image batch, submits the Ray ingestion job, verifies search, and writes runtime evidence. | `live-pipeline-up.sh` for batch 1; human operator for batch 2. |
| `live-pipeline-down.sh` | Stops the source pipeline Docker stack. | Human operator after the demo. |
| `validate.sh` | Checks JSON artifacts, Python and shell syntax, backend lint/tests/coverage, portal typecheck/build, and visual smoke when dependencies are installed. | Human operator and GitHub Actions. |
| `seed-hf-inat-sample.py` | Lower-level sampler/uploader used by `live-ingest-batch.sh`. Resolves image bytes from iNaturalist Open Data and uploads to MinIO. | `live-ingest-batch.sh`; direct use only for debugging seed data. |
| `check-coverage.py` | Fails validation when any covered backend source file falls below the configured coverage threshold. | `validate.sh`. |
| `export-slides.sh` | Exports the Marp slide source to `slides/exports/inat-inquire-demo.pdf`. | Human operator when updating slides. |
| `record-large.sh` | Optional large-run evidence capture: runs the source-pipeline benchmark and writes `recordings/metadata/benchmark/recorded-run-summary.json` for docs/slides/fallback evidence. | Human operator when refreshing benchmark evidence. |
| `lib/common.sh` | Shared helper library for `.env` loading, tool checks, source-pipeline path resolution, Docker checks, and readiness polling. | Sourced by shell scripts. |

## Important Environment Variables

The scripts load `.env` automatically through `lib/common.sh`. Existing
environment variables win over `.env` values so one-off overrides can be passed
inline.

| Variable | Used by | Meaning |
| --- | --- | --- |
| `INQUIRE_VECTOR_SEARCH_PATH` | Pipeline scripts, `record-large.sh` | Path to the source `Inquire-vector-search` checkout. Defaults to `../Inquire-vector-search`. |
| `PIPELINE_API_URL` | Pipeline and ingestion scripts | Host URL for the source pipeline API. Defaults to `http://localhost:8010`. |
| `QDRANT_API_URL` | `live-pipeline-up.sh`, `live-ingest-batch.sh` | Host URL for Qdrant. Defaults to `http://localhost:6333`. |
| `MINIO_PUBLIC_URL` | Pipeline, ingestion, and backend scripts | Host-visible MinIO URL. Defaults to `http://localhost:9000`. |
| `DEMO_LIVE_COLLECTION` | Pipeline and ingestion scripts | Qdrant collection used by the portal. Defaults to `inat-demo-live`. |
| `DEMO_RESET_COLLECTION` | `live-pipeline-up.sh` | Set to `0` to keep the existing collection when starting the stack. |
| `DEMO_REMOVE_VOLUMES` | `live-pipeline-down.sh` | Set to `1` to remove Docker volumes on teardown. |
| `DEMO_HF_IMAGES_PER_DATASET` | `live-ingest-batch.sh`, `seed-hf-inat-sample.py` | Number of resolved images to seed from each configured HF dataset. |
| `DEMO_VERIFY_QUERY` | `live-ingest-batch.sh` | Smoke-search query used after ingestion. Defaults to `nudibranch`. |
| `DEMO_SERVER_PORT` | `local-live.sh` | FastAPI backend port. Defaults to `8088`. |
| `PORTAL_PORT` | `local-live.sh` | Vite portal port. Defaults to `5173`. |

## Complexity Notes

- `live-ingest-batch.sh` is the main orchestration script. It stays in one file
  because the demo sequence is linear: seed images, ingest, verify, write
  evidence.
- `seed-hf-inat-sample.py` is the largest script because it owns network calls
  to Hugging Face, iNaturalist Open Data, and MinIO. Its functions are split by
  responsibility so the shell orchestration does not need to know those details.
- The shell scripts use Python for JSON parsing instead of requiring `jq`; this
  keeps the fresh-clone prerequisites aligned with the README.
- Runtime summaries are written under `data/runtime/`, which is intentionally
  ignored by git.
