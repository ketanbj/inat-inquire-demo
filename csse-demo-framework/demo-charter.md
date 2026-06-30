# Demo Charter

## Generic Definition

A demo charter defines why the demo exists, what decision it supports, what it
will and will not prove, and what artifacts must be ready for delivery. It is
the first document to write because it keeps the team from confusing a demo
with a product roadmap, a benchmark report, or a general-purpose platform.

A good demo charter should answer:

- What decision should the demo help someone make?
- What is the one-sentence value claim?
- Who are the delivery audiences?
- What live journey will make the claim visible?
- What evidence must back the claim?
- What is explicitly out of scope?
- What is the collaboration ask?
- What fallback path preserves credibility if live delivery fails?
- What readiness criteria must be met before the demo is used?

## Generic Charter Template

| Charter Field | Definition |
| --- | --- |
| Objective | The decision-support purpose of the demo. |
| Core question | The question the demo must answer for the audience. |
| Value claim | The concise statement of why the work matters. |
| Audiences | The real delivery audiences and any internal framework users. |
| Demo journey | The smallest live path that makes the value claim visible. |
| Evidence requirements | The facts, metrics, traces, and artifacts needed to support the claim. |
| Non-goals | Boundaries that prevent overbuilding or overclaiming. |
| Fallback strategy | The static or recorded path used when live systems fail. |
| Collaboration ask | The decision or next increment requested from the audience. |
| Readiness criteria | The checks that must pass before delivery. |

## iNAT Demo Charter

### Objective

Deliver the iNat x INQUIRE demo as a credible answer to one question:

```text
Why should someone trust CSSE with their scientific software challenge?
```

### Value Claim

CSSE can turn a complex scientific image-search workflow into a working,
measurable, inspectable system with a credible path from local proof to managed
operation.

### Outputs

| Output | Scope |
| --- | --- |
| iNat x INQUIRE demo | A working, evidence-backed demo for Director / Sponsor, PI / Researcher, and RSE / Architect audiences. |
| Artifact framework | A reusable package of planning, evidence, presentation, runbook, readiness, and fallback artifacts for future CSSE demos. |

### Delivery Audiences

| Audience | What The Demo Must Prove |
| --- | --- |
| Director / Sponsor | CSSE can create visible outcomes, measurable evidence, and an investment-ready path in 2-3 minutes. |
| PI / Researcher | CSSE understands the scientific workflow from source data to searchable, traceable results. |
| RSE / Architect | The implementation is inspectable, reproducible, extensible, and operationally coherent. |

### Live Journey

The smallest credible live journey is:

```text
Start stack -> ingest batch 1 -> search -> append batch 2 -> rerun same query -> review evidence
```

For the current iNAT slice:

- Primary query: `nudibranch`
- Live collection: `inat-demo-live`
- Batch 1 captured collection size: `24` vectors
- Batch 2 captured collection size: `48` vectors
- Captured first result after append:
  `hf-inat/batch-2/gt-csse__iNat24-vit-b-16-test/516.jpg`

### Evidence Requirements

| Evidence Type | iNAT Evidence |
| --- | --- |
| Source data | iNaturalist Open Data image URLs, Hugging Face dataset IDs, photo IDs, dimensions, license/source metadata. |
| Ingestion | `live-pipeline-up.sh`, `live-ingest-batch.sh`, MinIO object keys, elapsed time, uploaded image count, byte count. |
| Embeddings and index | Existing `inquire-vector-search` ingestion path, provider/model metadata, Qdrant collection, vector-count deltas. |
| Search | Query, ranked images, scores, latency, source URL, object key, dimensions. |
| Review | Runtime summaries, benchmark summary, production-readiness JSON, runbook, technical reference. |
| Operation | `/demo/status`, `/demo/production-readiness`, validation script, CI workflow, fallback path. |

### Non-Goals

- Do not build a general-purpose production search portal.
- Do not build a reusable demo software platform.
- Do not change the public API of `inquire-vector-search`.
- Do not commit downloaded image binaries or saved search-result fixtures.
- Do not require a large live cloud run during every presentation.
- Do not add CSSE Engineer or CSSE Director as real portal audience modes.

### Collaboration Ask

Bring CSSE in when research ambition depends on software that must scale,
measure up, and survive inspection.

For the next increment, decide:

- The next scientific dataset and quality gates.
- The operating target: local proof, hosted pilot, or managed service.
- The investment boundary around ingestion scale, evaluation, and operations.

### Fallback Strategy

If live search, batch ingestion, network links, or rendering fail, use
[Fallback Evidence](../docs/fallback-evidence.md). The fallback path should be
presented as captured demo evidence, not as a fresh live ingestion during the
current call.

The fallback board supports the same core claims with:

- Batch 1 and batch 2 point counts.
- Added-vector count.
- Primary verification query.
- Before/after first-result keys.
- Benchmark and readiness metrics.
- Links to the runbook and technical reference.

### Readiness Criteria

The demo is ready for delivery when:

- The Director path works in 2-3 minutes.
- The PI / Researcher path works in 10-20 minutes.
- The RSE / Architect path supports self-guided inspection.
- The live path works from a fresh checkout or the fallback path is selected
  deliberately.
- Runtime evidence, benchmark evidence, and fallback evidence support the same
  audience claims.
- The 7-slide Director deck matches the project story.
- The runbook and technical reference are current.
- `./scripts/validate.sh` passes before delivery.

### Current iNAT Readiness Notes

- The portal, backend, scripts, evidence JSON, fallback board, runbook,
  technical reference, and 7-slide deck exist.
- Validation currently passes locally.
- Runtime summaries exist for batch 1 and batch 2.
- A fresh final rehearsal should still confirm the strongest same-query
  before/after sequence before delivery.
- Optional recording remains a handoff improvement, not a blocker for fallback
  credibility.

