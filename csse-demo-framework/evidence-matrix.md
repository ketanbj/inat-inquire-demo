# Evidence Matrix

## Generic Definition

An evidence matrix maps each demo claim to proof that can be inspected. It is
the control that keeps a demo credible: every major claim should have a live
surface, a durable artifact, and a fallback path.

An evidence matrix should answer:

- What claim is being made?
- Where does the claim appear in the demo?
- What live evidence proves it?
- What checked-in or recorded artifact supports it if live systems fail?
- Which audience needs the evidence?
- How fresh is the evidence, and how should it be labeled?

## Evidence Quality Standard

Evidence should be:

- Traceable: a reviewer can connect the result to source data, scripts, or
  measured output.
- Repeatable: another presenter can rerun or inspect the proof path.
- Bounded: the claim says exactly what the evidence supports and avoids
  overclaiming.
- Audience-fit: the same evidence can be summarized for sponsors and inspected
  deeply by RSEs.
- Freshness-labeled: live, rehearsed, captured, placeholder, and target-state
  values are not mixed.
- Recoverable: a fallback artifact carries the claim if the live path fails.

## Generic Template

| Workflow Stage | Claim | Live Evidence | Durable Artifact | Fallback | Audience |
| --- | --- | --- | --- | --- | --- |
| Source | The demo starts from real scientific data. | Source records, metadata, identifiers, licenses. | Seed manifest, source references. | Static source table or manifest. | Researcher, RSE, Sponsor summary. |
| Ingest | Raw data can enter an operational pipeline. | Ingestion run, object keys, elapsed time, counts. | Run summary, logs, scripts. | Captured run summary. | All audiences. |
| Transform / Embed | Data becomes searchable or computable. | Model/provider metadata, job status, metrics. | Technical reference, benchmark notes. | Recorded model path and benchmark evidence. | Researcher, RSE. |
| Index | The searchable corpus changes. | Collection count, vector delta, collection version. | Runtime summaries, database inspection. | Before/after count table. | All audiences. |
| Search | Users can retrieve relevant results. | Query, ranked results, scores, latency. | Search API contract, result traceability. | Screenshot, fallback board, recorded proof. | All audiences. |
| Review | Results are scientifically and technically inspectable. | Metadata, provenance, quality metrics. | Benchmark artifact, source links. | Benchmark summary. | Researcher, RSE. |
| Operate | The proof can become managed software. | Status, metrics, deployment path, quality gates. | Runbook, readiness evidence. | Operating model board. | Sponsor, RSE. |

## iNAT Demo Evidence Matrix

| Workflow Stage | Claim | Live Evidence | Durable Artifact | Fallback | Audience |
| --- | --- | --- | --- | --- | --- |
| Source | The demo starts from real biodiversity image data. | iNaturalist Open Data image URLs resolved from `gt-csse` Hugging Face rows. | `data/runtime/hf-live-seed-batch-*.json` with dataset IDs, photo IDs, source URLs, dimensions, license/source metadata, object keys, and bytes. | Seed JSON under `data/runtime/`; source rows summarized in the PI and RSE paths. | PI / Researcher, RSE / Architect; Director summary. |
| Ingest | Raw image data can enter an operational pipeline. | `./scripts/live-pipeline-up.sh` ingests batch 1; `./scripts/live-ingest-batch.sh 2` appends batch 2. | `data/runtime/live-ingest-batch-*-summary.json` with uploaded count, byte count, elapsed time, vector-count delta, and estimated cost. | [Fallback Evidence](../docs/fallback-evidence.md) before/after table. | All audiences. |
| Embed | Images become searchable through model inference. | Existing `inquire-vector-search` pipeline runs image ingestion and embedding through the configured provider path. | [Technical Reference](../docs/technical-reference.md), backend status and metrics, benchmark summary. | Benchmark evidence in [benchmark-summary.json](../data/evidence/benchmark-summary.json). | PI / Researcher, RSE / Architect. |
| Index | The searchable collection changes after ingestion. | Qdrant collection `inat-demo-live` grows from batch 1 to batch 2. | Runtime summaries show `points_after` moving from `24` to `48` and `added_vectors` of `24` for batch 2. | Fallback board shows the same point-count delta. | All audiences. |
| Search | The same query can retrieve a changed result set after append. | Portal calls `POST /demo/search`, which proxies pipeline `/search/images`; presenter reruns `nudibranch`. | Runtime summaries record `verify_query` as `nudibranch`; result cards expose rank, score, source URL, object key, dimensions, and latency. | Fallback board records batch 1 first result `hf-inat/batch-1/gt-csse__iNat24-vit-b-16/30.jpg` and batch 2 first result `hf-inat/batch-2/gt-csse__iNat24-vit-b-16-test/516.jpg`. | All audiences. |
| Review | Results are traceable enough for scientific and technical review. | Result detail exposes score, dimensions, dataset, source URL, license, and object key. | [Technical Reference](../docs/technical-reference.md), [Operations Runbook](../docs/operations-runbook.md), benchmark summary. | Static benchmark and readiness evidence. | PI / Researcher, RSE / Architect. |
| Operate | The system has a path from local proof to managed operation. | `/demo/status`, `/demo/production-readiness`, Prometheus metrics, and RSE portal links. | [production-readiness.json](../data/evidence/production-readiness.json), [metrics-highlight.json](../data/evidence/metrics-highlight.json), deployment files, CI validation. | Runbook, technical reference, checked-in evidence JSON. | Director / Sponsor, RSE / Architect. |

## iNAT Captured Evidence Values

| Evidence | Captured Value | Source |
| --- | --- | --- |
| Primary query | `nudibranch` | [Operations Runbook](../docs/operations-runbook.md) |
| Batch 1 points after ingest | `24` | `data/runtime/live-ingest-batch-1-summary.json` |
| Batch 2 points after ingest | `48` | `data/runtime/live-ingest-batch-2-summary.json` |
| Added vectors from batch 2 | `24` | `data/runtime/live-ingest-batch-2-summary.json` |
| Large-run ingest rate | `37.8 images/sec` | [metrics-highlight.json](../data/evidence/metrics-highlight.json) |
| Search p95 latency | `418 ms` | [benchmark-summary.json](../data/evidence/benchmark-summary.json) |
| Precision@10 | `0.72` | [benchmark-summary.json](../data/evidence/benchmark-summary.json) |
| Recall@10 | `0.64` | [benchmark-summary.json](../data/evidence/benchmark-summary.json) |
| NDCG@10 | `0.81` | [benchmark-summary.json](../data/evidence/benchmark-summary.json) |

## Current Evidence Gaps

- A fresh final rehearsal should still confirm the strongest same-query
  before/after sequence immediately before delivery.
- Captured benchmark and metric values should be presented as demo evidence, not
  production SLO claims.
- Optional recording remains useful for handoff, but the fallback board already
  carries the core evidence path.

