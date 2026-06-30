# Demo Artifact Matrix

## Generic Definition

A demo artifact matrix lists the files, surfaces, scripts, and evidence records
needed to deliver the demo, recover from failures, support technical review,
and hand the package to another presenter. It is the operational counterpart to
the audience model and evidence matrix.

The artifact matrix should answer:

- What artifact exists?
- Which audience or delivery moment uses it?
- What claim or evidence does it support?
- Is it live, static, generated, recorded, or target-state evidence?
- What makes it ready?
- What should future teams reuse, and what is specific to this project?

## Generic Artifact Categories

| Artifact Category | Purpose | Required For |
| --- | --- | --- |
| Demo charter | Defines objective, decision, non-goals, claims, and collaboration ask. | All demo packages. |
| Audience model | Connects audiences to proof depth and success criteria. | All demo packages. |
| Evidence matrix | Connects claims to live and fallback evidence. | All evidence-backed demos. |
| Director highlight deck | Gives sponsors a concise project story. | Sponsor or leadership delivery. |
| Working demo surface | Shows the live or simulated workflow. | Any claim of working software. |
| Operations runbook | Lets a presenter start, validate, troubleshoot, and stop the demo. | Live delivery and handoff. |
| Technical reference | Lets technical reviewers inspect architecture and boundaries. | RSE / Architect review. |
| Fallback evidence | Preserves credibility when live systems fail. | Any live demo with external dependencies. |
| Runtime evidence | Captures run-specific counts, timings, and IDs. | Evidence freshness and reproducibility. |
| Validation gate | Gives maintainers a repeatable readiness check. | Handoff and CI. |
| Recording metadata | Plans optional walkthrough or teaser capture. | Async review and presenter handoff. |

## Generic Readiness Checklist

| Artifact | Ready When |
| --- | --- |
| Charter | The decision, audience, claims, non-goals, and collaboration ask are explicit. |
| Audience model | Each audience has a question, proof path, timebox, and success criteria. |
| Evidence matrix | Every major claim has live evidence, durable evidence, and fallback evidence. |
| Highlight deck | The story fits the target timebox and does not become a technical tour. |
| Demo surface | The expected path can be run or safely replaced by fallback evidence. |
| Runbook | A presenter can start, present, validate, troubleshoot, and stop the demo. |
| Technical reference | A reviewer can inspect architecture, contracts, metrics, tests, and limitations. |
| Fallback board | It supports the same claims without pretending to be a fresh live run. |
| Runtime artifacts | Counts, timings, source IDs, and result keys are captured with source labels. |
| Validation | The validation command runs locally and in CI or has documented gaps. |

## iNAT Demo Artifact Matrix

| Artifact / Surface | Role In Delivery | Audience | iNAT Evidence | Files |
| --- | --- | --- | --- | --- |
| Working portal | Shows source, ingest, index, search, review, metrics, and audience-specific evidence. | Director / Sponsor, PI / Researcher, RSE / Architect. | Live search results, traceability fields, batch proof, status and metrics panels. | `portal/`, `server/` |
| Live ingestion scripts | Run batch 1, append batch 2, verify search, and summarize runtime evidence. | Presenter, RSE / Architect. | `24` vectors after batch 1, `48` after batch 2, same `nudibranch` verification query. | [live-pipeline-up.sh](../scripts/live-pipeline-up.sh), [live-ingest-batch.sh](../scripts/live-ingest-batch.sh), [live-pipeline-down.sh](../scripts/live-pipeline-down.sh) |
| Director highlight deck | Tells the project story in no more than 7 slides. | Director / Sponsor, CSSE Director. | Problem, CSSE approach, demo outcome, evidence, metrics, impact, collaboration ask. | [slides/inat-inquire-demo.marp.md](../slides/inat-inquire-demo.marp.md) |
| PI / Researcher documentation | Explains scientific workflow and evidence quality. | PI / Researcher. | Source data, ingestion, embeddings, indexing, search, traceability, benchmark context. | [Technical Reference](../docs/technical-reference.md), [Docs Index](../docs/README.md) |
| RSE / Architect runbook | Supports setup, validation, review, troubleshooting, and reproducibility. | RSE / Architect, presenter. | Setup commands, live flow, manual health checks, scripts, metrics, fallback, teardown. | [Operations Runbook](../docs/operations-runbook.md), [validate.yml](../.github/workflows/validate.yml), [validate.sh](../scripts/validate.sh) |
| Fallback evidence board | Carries the same claims when live search, ingest, network links, or rendering fail. | All audiences. | Before/after counts, first result keys, benchmark metrics, readiness evidence. | [Fallback Evidence](../docs/fallback-evidence.md) |
| Runtime summaries | Preserve run-specific source and ingestion facts. | PI / Researcher, RSE / Architect, presenter. | Seeded source images, object keys, dimensions, uploaded counts, bytes, elapsed time, vector deltas. | `data/runtime/hf-live-seed-batch-*.json`, `data/runtime/live-ingest-batch-*-summary.json` |
| Checked-in evidence JSON | Provides static metric, benchmark, and readiness evidence. | Director / Sponsor, PI / Researcher, RSE / Architect. | Large-run ingest rate, p95 latency, precision, recall, NDCG, quality gates, operating controls. | [benchmark-summary.json](../data/evidence/benchmark-summary.json), [metrics-highlight.json](../data/evidence/metrics-highlight.json), [production-readiness.json](../data/evidence/production-readiness.json) |
| Recording metadata | Defines optional recording shots for async review and handoff. | Presenter, CSSE Director. | Long walkthrough and teaser cut sequence. | [shot-list.md](../recordings/metadata/shot-list.md), `recordings/exports/fallback/` |
| Framework package | Separates reusable method from iNAT-specific implementation. | CSSE Engineer, CSSE Director. | Charter, audience model, evidence matrix, artifact matrix, reusable-vs-specific notes. | `csse-demo-framework/` |

## iNAT Artifact Status

| Objective | Status | Evidence | Remaining Work |
| --- | --- | --- | --- |
| Working iNAT demo | Mostly ready. | Portal, backend, live scripts, runtime summaries, fallback board, validation. | Fresh end-to-end rehearsal and final query/result confirmation. |
| Static Director View / Highlight Deck | Ready as source. | 7-slide Marp deck maps to problem, approach, outcome, evidence, metrics, impact, and ask. | Export PDF if needed for delivery. |
| PI / Researcher documentation | Mostly ready. | Technical reference and docs index cover source data through evidence quality. | PI wording review. |
| RSE / Architect runbook | Strong / near complete. | Operations runbook, technical reference, validation command, CI workflow, tests, scripts. | Self-guided RSE review. |
| Reusable framework document | Extracted. | This folder contains the framework index and four framework artifacts. | Add final post-rehearsal lessons if the live path changes. |

## Reusable Versus iNAT-Specific Artifacts

| Reusable | iNAT-Specific |
| --- | --- |
| Charter structure and decision framing. | The biodiversity image-search problem and iNaturalist data source. |
| Audience model with sponsor, researcher, and RSE depths. | The exact Director, PI, and RSE wording for iNat x INQUIRE. |
| Evidence matrix pattern organized by workflow stage. | `nudibranch`, batch offsets, Qdrant collection names, and source image keys. |
| Runbook requirements: setup, live flow, validation, fallback, stop. | The local `inquire-vector-search`, Ray, MinIO, Qdrant, and FastAPI commands. |
| Highlight deck structure: problem, approach, outcome, evidence, metrics, impact, ask. | The exact metric values and iNAT screenshots or portal visuals. |
| Fallback board pattern. | The captured first-result keys and current benchmark values. |

