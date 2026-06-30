# Fallback Evidence

Use this evidence board when live search, batch ingestion, network links, or the
3D scene are not reliable during a presentation. It supports the same audience
claims as the live demo without requiring a fresh run.

## Before / After Ingestion

| Evidence | Captured Value |
| --- | --- |
| Collection | `inat-demo-live` |
| Batch 1 points after ingest | `24` |
| Batch 2 points after ingest | `48` |
| Added vectors from batch 2 | `24` |
| Verification query | `nudibranch` |
| Batch 1 first result key | `hf-inat/batch-1/gt-csse__iNat24-vit-b-16/30.jpg` |
| Batch 2 first result key | `hf-inat/batch-2/gt-csse__iNat24-vit-b-16-test/516.jpg` |

Claim supported: new source images can be appended to the searchable collection
and inspected through the same query path.

## Presentation Metrics

| Metric | Captured Value | Source |
| --- | --- | --- |
| Indexed vectors | `20,000` | `data/evidence/metrics-highlight.json` |
| Large-run ingest rate | `37.8 images/sec` | `data/evidence/metrics-highlight.json` |
| Search p95 latency | `418 ms` | `data/evidence/benchmark-summary.json` |
| Precision@10 | `0.72` | `data/evidence/benchmark-summary.json` |
| Recall@10 | `0.64` | `data/evidence/benchmark-summary.json` |
| NDCG@10 | `0.81` | `data/evidence/benchmark-summary.json` |

Claim supported: the demo has measurable throughput, latency, and retrieval
quality evidence. Present these as captured demo evidence, not as a production
SLO claim.

## Readiness Evidence

| Evidence | Source |
| --- | --- |
| Quality gates for precision, recall, NDCG, MRR, and p95 latency | `data/evidence/production-readiness.json` |
| Versioned collection and alias promotion path | `data/evidence/production-readiness.json` |
| Observability signals and dashboards | `data/evidence/production-readiness.json` |
| Resilience and scale patterns | `data/evidence/production-readiness.json` |
| RSE inspection route | `docs/technical-reference.md` |
| Presenter run path | `docs/operations-runbook.md` |

Claim supported: the work is inspectable, reproducible, and has a path from
local proof to managed operation.

## Fallback Presenter Path

1. State that the live path normally runs batch 1, search, batch 2 append, and
   same-query search.
2. Show the before/after table above.
3. Show the selected benchmark and readiness metrics.
4. Open the technical reference or runbook only if the room needs more detail.
5. Be explicit that this fallback proves the demo evidence path, not a fresh
   live ingestion during the current call.

## Optional Screenshot Artifacts

Generated visual-check screenshots can be stored under
`recordings/exports/fallback/`. That directory is ignored by git because the
images are presentation artifacts, not source files.
