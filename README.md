# iNat x INQUIRE Demo

Polished partner demo package for the iNat x INQUIRE vector search work.

This repository is intentionally separate from `inquire-vector-search`. It wraps
the existing pipeline API without changing its public interface and provides:

- A password-protected interactive demo portal with audience-specific views.
- A FastAPI backend-for-frontend that proxies live search, status, and metrics.
- A two-pass local ingestion workflow: seed batch 1, search, append batch 2,
  search again, then discuss scale-up cost and complexity.
- Built-in operating controls for managed ingestion, collection versioning,
  observability, quality gates, and recovery/scaling paths.
- A compact docs packet, slide source, and recording metadata.
- Live local image assets sampled from `gt-csse` Hugging Face datasets,
  downloaded from iNaturalist Open Data, and served through MinIO.

## Quick Start

Prerequisites:

- [Docker Desktop](https://docs.docker.com/desktop/)
- [Git](https://git-scm.com/downloads/)
- [Node.js/npm](https://nodejs.org/en/download)
- [Python 3](https://www.python.org/downloads/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/)

Create a workspace, clone both repositories into it, then run the demo:

```bash
mkdir inat-inquire-workspace
cd inat-inquire-workspace
git clone https://github.com/inaturalist/Inquire-vector-search.git
git clone https://github.com/ketanbj/inat-inquire-demo.git
cd inat-inquire-demo
[ -f .env ] || cp .env.example .env
./scripts/bootstrap.sh
./scripts/live-pipeline-up.sh
./scripts/local-live.sh
```

If the pipeline repo already lives somewhere else, set
`INQUIRE_VECTOR_SEARCH_PATH` in `.env` before running
`./scripts/live-pipeline-up.sh`.

Then open:

- Portal: <http://localhost:5173>
- Demo server: <http://localhost:8088/docs>

Default local password: `inat-demo`

The default password is for laptop-only local use. Hosted demos run with
`DEMO_ENV=production`, an event-specific `DEMO_PASSWORD`, a random
`DEMO_TOKEN_SECRET` with at least 32 characters, and explicit HTTPS portal
origins in `DEMO_CORS_ORIGINS`.

## Audience Tracks

The same live system is presented at three depths. Pick the track that matches
the room before starting the walkthrough.

| Audience | Primary question | Demo answer | Time |
| --- | --- | --- | --- |
| Director | Why should we fund or partner with CSSE? | CSSE delivers meaningful quality outcomes and makes resource investment concrete. | 2-3 min |
| PI / Researcher | Can CSSE understand my problem and help architect a solution? | The demo shows the research problem, workflow complexity, and a representative slice becoming searchable. | 10-20 min |
| RSE / Architect | Is this engineered professionally? | The architecture exposes layers, abstractions, observability, recovery paths, and scale options. | 30 min self-guided to 1 day |

The demo is live-only. Start the local pipeline before opening the portal.
After the first search, run `./scripts/live-ingest-batch.sh 2` in a second
terminal and repeat the same query to show newly ingested images.
Use `nudibranch` for the clearest same-query update; `sea anemone`,
`desert shrub`, `harbor seals`, `pink wildflower`, `small bird in grass`, and
`sea lions on rocks` also match the current seeded slices.
Use the RSE view to connect the live loop to managed runs, promotion gates,
rollback, metrics, and recovery paths. The RSE path also includes a
self-guided run option through the Quick Start and operations runbook so an
architect can reproduce the demo locally.

## Local Live Demo

Prerequisites: Docker Desktop, Git, Node.js/npm, Python 3, and `uv`.

Use this local layout:

```text
inat-inquire-workspace/
  Inquire-vector-search/
  inat-inquire-demo/
```

1. Create a workspace and clone both repositories:

   ```bash
   mkdir inat-inquire-workspace
   cd inat-inquire-workspace
   git clone https://github.com/inaturalist/Inquire-vector-search.git
   git clone https://github.com/ketanbj/inat-inquire-demo.git
   cd inat-inquire-demo
   ```

2. Bootstrap the demo repo and, if needed, point `.env` at a different
   pipeline checkout:

   ```bash
   [ -f .env ] || cp .env.example .env
   # Optional when not using ../Inquire-vector-search:
   # edit INQUIRE_VECTOR_SEARCH_PATH in .env
   ./scripts/bootstrap.sh
   ```

3. Start the live pipeline and ingest batch 1:

   ```bash
   ./scripts/live-pipeline-up.sh
   ```

   This starts the source pipeline from `../Inquire-vector-search`, exposes the
   pipeline API on `http://localhost:8010`, samples the first image batch from
   the `gt-csse` Hugging Face datasets, uploads it to MinIO, ingests it with
   Ray, prints ingestion metrics and a configurable cost estimate, and verifies
   Qdrant search.

4. Start the portal:

   ```bash
   ./scripts/local-live.sh
   ```

5. Open the portal:

   - Portal: <http://localhost:5173>
   - Demo server docs: <http://localhost:8088/docs>
   - Password: `inat-demo`

6. Run a rehearsed query, then append the second image batch:

   Use one of the portal suggestions that matches the current HF slices:
   `nudibranch` is the primary path, with `sea anemone`, `desert shrub`,
   `harbor seals`, `pink wildflower`, `small bird in grass`, and
   `sea lions on rocks` as backups.

   ```bash
   ./scripts/live-ingest-batch.sh 2
   ```

   Run the same query again. The new batch is seeded under a different MinIO
   prefix and ingested into the same Qdrant collection, so newly added images
   can appear in the live result set. Call out result object keys that begin
   with `hf-inat/batch-2/`.

7. Stop the portal with `Ctrl-C`. Stop the pipeline stack when finished:

   ```bash
   ./scripts/live-pipeline-down.sh
   ```

## Repository Layout

```text
portal/              React/Vite audience-mode portal
server/              FastAPI backend-for-frontend
docs/                Brief, runbook, architecture, and benchmark docs
csse-demo-framework/ Reusable CSSE demo framework extracted from this package
slides/              Marp presentation source and exported PDFs
data/evidence/       Benchmark and metric summary artifacts
recordings/metadata/ Shot lists, benchmark outputs, screenshots metadata
infra/local/         Local pipeline compose overrides
scripts/             Bootstrap, live demo, validation, export helpers
```

See [scripts/README.md](scripts/README.md) for the script catalog, normal
operator flow, and common environment overrides.

## Demo Modes

- **Live local**: Uses the existing pipeline stack, HF-sampled iNaturalist
  images in MinIO, Ray ingestion, Qdrant, and `/search/images`. The default
  presentation path runs batch 1, searches, appends batch 2, and searches again.
- **Operating model**: Uses the RSE view, runtime summaries, benchmark evidence,
  and `/demo/production-readiness` to show how managed runs, collection
  promotion, SLOs, quality gates, and recovery controls fit into the same
  workflow.
- **Large-run evidence**: Uses benchmark and scale evidence for presentation
  context without adding saved search-result fixtures.

## Source System

The demo expects the pipeline repo at `../Inquire-vector-search` by default.
Override that path in `.env` when the checkout lives elsewhere:

```dotenv
INQUIRE_VECTOR_SEARCH_PATH=<relative-or-absolute-path-to-Inquire-vector-search>
```

The backend reads the live pipeline at `PIPELINE_API_URL`. The checked-in local
demo default is `http://localhost:8010` because port `8000` is often occupied by
other development tools.

The optional Dockerized demo service uses `DEMO_CONTAINER_PIPELINE_API_URL`
instead, defaulting to `http://host.docker.internal:8010` so the container can
reach the host pipeline while local scripts keep using `localhost`.

The helper scripts use `DEMO_LIVE_COLLECTION=inat-demo-live` and
`DEMO_HF_IMAGES_PER_DATASET=8` by default. Adjust those values in `.env` when
you need a larger laptop-scale run. Set `DEMO_COST_PER_1K_IMAGES_USD` and
`DEMO_COST_PER_COMPUTE_HOUR_USD` when you want the script output to include a
non-zero cost estimate for the recorded run.

The local compose override disables the source pipeline semantic cache with
`DEMO_SEMANTIC_CACHE_ENABLED=false` so a same-query before/after search reads
the updated Qdrant collection. `live-ingest-batch.sh` also calls the pipeline
cache invalidation endpoint after ingestion when that endpoint is available.

## Validation

Run the same checks used by CI:

```bash
./scripts/validate.sh
```

The validation script checks evidence JSON, Python syntax, every shell script,
backend Ruff lint, backend tests with per-file coverage gating, the portal
TypeScript check, the portal production build, and the Playwright visual smoke
check when `portal/node_modules` is installed.

The default dataset mix is intentionally kept to the three tested `gt-csse`
tables that resolve cleanly to iNaturalist Open Data images:

- `gt-csse/iNat24-vit-b-16-test`
- `gt-csse/iNat24-vit-b-16`
- `gt-csse/inat-open-data-embeddings`

Batch 1 starts at HF row offset `0`; batch 2 starts at offset `500`. With the
current slices, use `nudibranch`, `sea anemone`, `desert shrub`,
`harbor seals`, `pink wildflower`, `small bird in grass`, or
`sea lions on rocks` to show the second ingestion changing the live result set.
