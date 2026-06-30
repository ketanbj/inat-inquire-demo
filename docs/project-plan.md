# Project Plan

## Objective

Deliver the iNat x INQUIRE demo as a credible answer to one question:

```text
Why should someone trust CSSE with their scientific software challenge?
```

The project has two outputs:

| Output | Scope |
| --- | --- |
| iNat x INQUIRE demo | A working, evidence-backed demo for Director / Sponsor, PI / Researcher, and RSE / Architect audiences. |
| Artifact framework | A reusable package of planning, evidence, presentation, runbook, readiness, and fallback artifacts for future CSSE demos. |

## Out Of Scope

- Do not build a general-purpose production search portal.
- Do not build a reusable demo software platform.
- Do not change the public API of `inquire-vector-search`.
- Do not commit downloaded image binaries or saved search-result fixtures.
- Do not require a large live cloud run during every presentation.
- Do not add CSSE Engineer or CSSE Director as real portal audience modes.

## Delivery Audiences

The detailed reusable audience model now lives in
[`csse-demo-framework/audience-model.md`](../csse-demo-framework/audience-model.md).
For delivery planning, the active audiences remain:

| Audience | Delivery Role | Primary Proof |
| --- | --- | --- |
| Director / Sponsor | 2-3 minute investment story. | Live before/after search result, throughput, latency, benchmark/readiness evidence, and collaboration ask. |
| PI / Researcher | 10-20 minute scientific workflow review. | Source data, ingestion, embeddings, indexing, search, traceability, and retrieval quality evidence. |
| RSE / Architect | 30 minute to 1 day technical inspection path. | Architecture docs, OpenAPI contracts, scripts, runtime summaries, metrics, tests, runbook, deployment path, and limitations. |

CSSE Director and CSSE Engineer remain internal framework users, not portal
audience modes.

## Evidence Summary

The detailed reusable evidence matrix now lives in
[`csse-demo-framework/evidence-matrix.md`](../csse-demo-framework/evidence-matrix.md).
For delivery planning, the core proof path is:

| Evidence Area | Delivery Proof | Primary Artifact |
| --- | --- | --- |
| Source | Real iNaturalist / Hugging Face image data with metadata. | Runtime seed JSON under `data/runtime/`. |
| Ingest and index | Batch 1 and batch 2 add vectors to `inat-demo-live`. | Runtime ingest summaries and live scripts. |
| Search and review | Same-query rerun shows changed ranked results with traceable metadata. | Portal result cards, fallback board, benchmark summary. |
| Operate | The local proof has readiness, validation, metrics, and recovery paths. | Runbook, technical reference, evidence JSON, validation script. |

## Framework Boundary

The reusable framework is based on artifacts:

| Artifact | Purpose |
| --- | --- |
| [Demo charter](../csse-demo-framework/demo-charter.md) | Define objective, audience questions, claims, non-goals, live journey, collaboration ask, fallback strategy, and readiness criteria. |
| [Audience model](../csse-demo-framework/audience-model.md) | Define the real delivery audiences, internal meta users, proof depth, evidence requirements, and success criteria. |
| [Evidence matrix](../csse-demo-framework/evidence-matrix.md) | Tie each claim to hard evidence, live surfaces, durable artifacts, fallback artifacts, and evidence quality rules. |
| [Demo artifact matrix](../csse-demo-framework/demo-artifact-matrix.md) | Inventory the working demo, deck, docs, runbooks, fallback material, runtime evidence, validation, recording metadata, and reuse boundary. |
| [Framework index](../csse-demo-framework/frameword.md) | Explain how the artifacts fit together and what is reusable versus iNAT-specific. |

The framework package now lives under `csse-demo-framework/`. The documents in
`docs/` remain the iNAT delivery packet: runbook, technical reference, fallback
board, and project status.

## Planning Baseline

The workbook `INQUIRE_Demo_Framework.xlsx` is the planning baseline. It already
defines the audience matrix, evidence matrix, artifact matrix, and reusable
4-step framework:

| Workbook Sheet | Planning Decision Already Made |
| --- | --- |
| `iNAT Audience Matrix` | Director, PI, and RSE are the real delivery audiences; CSSE Engineer is the reusable-framework user. |
| `iNAT Evidence Matrix` | Each audience has a supporting message, evidence category, evidence item, demo surface, and artifact. |
| `iNAT Artifact Matrix` | The demo journey is Search Batch 1, Ingest Batch 2, Pipeline View, Metrics View, Repo View, plus fallback. |
| `Reusable Demo Framework` | The reusable framework is the artifact set: Audience Matrix, Evidence Matrix, Demo Artifact Matrix, and Demo Charter / journeys / runbooks. |
| `Project Plan & Status` | Remaining work is execution, review, validation, fallback capture, and framework packaging. |

Because the audience and evidence definition work is already captured in the
workbook, the project plan below focuses on the remaining two weeks of delivery.

## Delivery Tasks

The remaining work is organized as five concrete tasks with named deliverables.
Tasks 1-3 are Week 1 delivery-readiness work. Tasks 4-5 are Week 2 packaging
and framework-extraction work.

| Task | Deliverable | Mapped User Stories | Status / Next Step |
| --- | --- | --- | --- |
| 1. Confirm delivery path and presentation-safe metrics | Delivery brief with first audience, timebox, default portal path, collaboration ask, and approved metric set. | As a presenter, I want the first delivery path confirmed so that rehearsal matches the real call. As a Director / Sponsor, I want concise outcome metrics so that the value is concrete. | 60%. Workbook defines audiences and success criteria; portal supports all three views; metric labels distinguish live, pending, and offline signals. Next: confirm the real room, ask, and metric values. |
| 2. Rehearse live before/after demo path | Rehearsed live run record with selected query, batch 1 search, batch 2 append, same-query rerun, and observed result change. | As a presenter, I want a reliable live before/after path so that I can show new images changing the searchable result set. As a project team member, I want validation and visual checks to pass so that the demo is technically safe to deliver. | 55%. Scripts, runtime summary loading, before/after UI proof, and runbook steps exist. Next: run a fresh end-to-end rehearsal and record the strongest query/result sequence. |
| 3. Complete audience evidence review | Reviewed portal evidence path for Director, PI / Researcher, and RSE / Architect. | As a Director / Sponsor, I want concise outcome metrics so that the value is concrete. As a PI / Researcher, I want traceable source and pipeline evidence so that I can judge whether the workflow maps to scientific work. As an RSE / Architect, I want inspectable technical evidence so that I can verify the implementation independently. | 80%. Portal uses takeaway/signals/artifacts; result detail exposes traceability; RSE artifacts link to docs, API, repo, configs, benchmarks, scripts, tests, runbook, and limits. Next: get PI-style wording feedback and self-guided RSE review. |
| 4. Package delivery and fallback evidence | Delivery package containing docs index, runbook, technical reference, fallback evidence board, generated screenshots, evidence JSON, scripts, and validation command. | As a presenter, I want fallback evidence so that the demo remains credible if live search, ingest, links, or rendering fail. As a CSSE Director, I want a concise delivery package so that the demo can be used in sponsor, partner, and leadership conversations. As a demo maintainer, I want a final readiness handoff so that the demo can be rerun and maintained after delivery. | 80%. Static fallback board, benchmark/readiness JSON, docs, generated screenshots, scripts, portal, backend, and validation command exist. Next: optional recording, final sign-off notes, and minimum handoff confirmation. |
| 5. Extract reusable CSSE demo framework | Framework extraction notes separating reusable artifacts from iNat-specific implementation details. | As a CSSE Engineer, I want the framework package to be artifact-based so that future demos can reuse the method without inheriting this UI or stack. As a project team member, I want rehearsal feedback and lessons learned captured so that future demos avoid unnecessary complexity. | 80%. `csse-demo-framework/` now contains the framework index, demo charter, audience model, evidence matrix, and demo artifact matrix. Next: add final post-rehearsal lessons if the live path changes. |

Exit criteria:

- Delivery brief is agreed.
- Live before/after path is rehearsed or fallback path is ready.
- Director, PI / Researcher, and RSE / Architect evidence paths are reviewed.
- Delivery package can be used by another presenter.
- Framework extraction notes separate reusable practice from iNat-specific
  details.

## Two-Week Timeline: 10 Working Days

| Time | Focus | Deliverable | Exit Check |
| --- | --- | --- | --- |
| Workdays 1-2 | Confirm delivery path and metrics. | Delivery brief with audience, timebox, default portal path, collaboration ask, and approved metrics. | Team agrees what will be shown, what will be omitted, and what the ask is. |
| Workdays 3-5 | Rehearse live before/after demo path. | Rehearsed run record with selected query, batch 1 search, batch 2 append, same-query rerun, and observed result change. | Presenter can run the live path from the runbook or switch to fallback cleanly. |
| Workdays 6-7 | Complete audience evidence review. | Reviewed Director, PI, and RSE evidence paths. | Director metrics are clear; PI wording is acceptable; RSE links are self-sufficient. |
| Workdays 8-9 | Package delivery and fallback evidence. | Delivery package with docs index, runbook, technical reference, fallback board, screenshots, evidence JSON, scripts, and validation command. | Another presenter can deliver or recover the demo using the package. |
| Workday 10 | Extract reusable CSSE demo framework and close delivery. | Extraction notes separating reusable artifacts from iNat-specific implementation details, plus final readiness notes. | Framework explains what to reuse, what not to generalize, and how future CSSE demos should adapt the structure. |

Critical path: the live before/after rehearsal should be resolved by Workday 5.
If it is weak, use the fallback evidence board as the primary proof path and
keep live ingestion as optional.

## Readiness Checklist

| Check | Status | Evidence | Remaining Work |
| --- | --- | --- | --- |
| Workbook audience, evidence, artifact, and framework definitions are accepted as baseline. | Done | `INQUIRE_Demo_Framework.xlsx` contains the matrices and 4-step framework. | Keep repo docs aligned with the workbook. |
| First delivery audience and timebox are confirmed. | Pending | Audience paths and timebox targets are defined. | Choose the actual first delivery room and duration. |
| Main claim, collaboration ask, and non-goals are agreed. | Partial | Claim and non-goals are documented. | Finalize the collaboration ask. |
| Live pipeline setup completes. | Partial | `live-pipeline-up.sh` and runbook steps exist. | Run a fresh rehearsal from setup. |
| Batch 2 appends without resetting `inat-demo-live`. | Partial | `live-ingest-batch.sh 2` and append workflow exist. | Verify in a successful rehearsal. |
| Same-query before/after result change is visible with a rehearsed query. | Pending | Runbook has query guidance. | Pick and prove the strongest query. |
| Director, PI / Researcher, and RSE / Architect views render. | Done | Portal implements all three audience modes. | Keep CSSE Engineer out of portal personas. |
| RSE path links to contracts, repos, scripts, metrics, tests, runbook, and deployment evidence. | Mostly done | RSE stage artifacts and technical reference link to these evidence types. | Run self-guided RSE review. |
| Runtime summaries exist for batch 1 and batch 2. | Partial | Runtime summary loading and ignored `data/runtime/` path exist. | Generate fresh batch 1 and batch 2 runtime summaries. |
| Fallback evidence exists for search, metrics, and architecture. | Mostly done | Static fallback evidence board, checked-in benchmark/readiness JSON, and generated screenshots under `recordings/exports/fallback/` exist. | Capture optional recording after final rehearsal. |
| Framework extraction notes separate reusable artifacts from iNat specifics. | Mostly done | `csse-demo-framework/` defines reusable framework artifacts and names what is iNAT-specific versus reusable. | Add final post-rehearsal lessons if the live path changes. |
| `./scripts/validate.sh` passes. | Done | Validation passes locally. | Re-run immediately before delivery. |
