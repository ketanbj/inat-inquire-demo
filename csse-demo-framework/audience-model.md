# Audience Model

## Generic Definition

An audience model defines who the demo is for, what each audience needs to
decide, and what evidence will let them trust the work. It prevents a demo from
becoming a generic feature tour by forcing every surface, metric, script, and
document to serve a specific review need.

An audience model should answer:

- Who is the real delivery audience?
- What question is that audience trying to answer?
- What proof will be credible to them?
- How much time and technical depth do they need?
- What should be omitted for that audience?
- What artifact lets the audience continue reviewing after the live session?

Audience models can include internal or meta users, but those users should not
automatically become product personas or UI modes. Internal users help shape
the package; delivery audiences receive the demo.

## Generic Template

| Audience | Primary Question | Demo Answer | Depth | Evidence Required | Success Criteria |
| --- | --- | --- | --- | --- | --- |
| Sponsor / decision maker | Why should we invest? | The team can turn a hard scientific software problem into a measurable result. | Short, outcome-focused. | Live outcome, metrics, impact, cost/readiness. | The sponsor sees the next investment decision clearly. |
| Research lead | Does the team understand my scientific workflow? | The demo represents the scientific problem and preserves evidence quality. | Medium, workflow-focused. | Source data, metadata, pipeline, traceability, evaluation. | The researcher trusts that the solution maps to their research program. |
| Technical reviewer | Is this engineered responsibly? | The system exposes boundaries, contracts, operations, validation, and failure paths. | Deep, inspection-focused. | Architecture, APIs, scripts, tests, metrics, runbook, limitations. | The reviewer can reproduce, extend, or critique the system independently. |
| Internal demo owner | Can I reuse and maintain this package? | The artifacts separate reusable method from project-specific implementation. | Practical, handoff-focused. | Artifact checklist, readiness criteria, fallback path, extraction notes. | Another team can adapt the framework without copying the stack. |

## Design Rules

- Keep one core claim across audiences, then vary depth and emphasis.
- Do not invent audiences just because a UI can support more modes.
- Define success criteria as audience decisions, not as feature completion.
- Show less to senior decision makers and more to technical reviewers.
- Make the fallback path audience-aware; a sponsor fallback should be brief,
  while an RSE fallback should be inspectable.
- Treat "internal framework user" as a packaging role, not as a demo persona.

## iNAT Demo Audience Model

The iNat x INQUIRE demo serves three real delivery audiences and two internal
meta users.

| Audience | Primary Question | Demo Answer | Depth | Evidence Required | Success Criteria |
| --- | --- | --- | --- | --- | --- |
| Director / Sponsor | Why should we fund, partner with, or continue investing in CSSE? | CSSE can turn a complex scientific software challenge into a well-architected solution with measurable outcomes. | 2-3 minutes. | Live before/after result change, ingestion throughput, search latency, benchmark summary, cost/readiness estimate, CSSE people and portfolio links. | The Director sees CSSE as a high-value strategic investment and understands the next funding or partnership decision. |
| PI / Researcher | Can CSSE understand my problem and help architect a solution? | The visible demo is a representative slice of a larger workflow: source data, ingestion, embeddings, indexing, search, traceability, and evaluation. | 10-20 minutes. | Source image metadata, batch ingestion flow, embedding/index/search path, result traceability, retrieval quality evidence, and representative-slice framing. | The PI believes CSSE can help solve challenges in their own research program. |
| RSE / Architect | Is this engineered professionally, and can I reproduce, extend, or operate it? | This is a real software system with boundaries, contracts, operational evidence, and reproducible engineering practices. | 30 minutes to 1 day. | Architecture docs, OpenAPI contracts, repo links, scripts, runtime summaries, Prometheus metrics, benchmark artifacts, tests, runbook, deployment path, and limitations. | The RSE sees the system as trustworthy, reproducible, extensible, and suitable for real-world review. |

## iNAT Internal Meta Users

| Internal User | User Story | Success Criteria | Boundary |
| --- | --- | --- | --- |
| CSSE Director | As a CSSE Director, I want to quickly show the kinds of projects CSSE undertakes and delivers so that I can communicate CSSE value in sponsor, partner, and leadership conversations. | The package has a concise audience story, outcome evidence, and links that can be reused in leadership conversations. | Shapes the highlight deck and framework, but is not a portal audience mode. |
| CSSE Engineer | As a CSSE Engineer, I want a compact artifact framework with audience stories, evidence requirements, runbooks, and fallback paths so that I can build and maintain credible demos for my engagement. | Future teams can adapt the artifact structure without adopting this demo's UI or software architecture. | Shapes the reusable framework, but is not a runtime persona. |

## iNAT Audience Evidence Paths

| Audience | Live Surface | Supporting Artifact | Omit Or Defer |
| --- | --- | --- | --- |
| Director / Sponsor | One `nudibranch` query, batch append, same-query rerun, metric chips, 7-slide highlight deck. | [Fallback Evidence](../docs/fallback-evidence.md), [metrics highlight JSON](../data/evidence/metrics-highlight.json), [benchmark summary](../data/evidence/benchmark-summary.json). | Full API walkthrough, implementation internals, every query option. |
| PI / Researcher | Source metadata, image result cards, ingestion flow, embedding/index/search explanation, traceability fields. | [Technical Reference](../docs/technical-reference.md), runtime seed JSON under `data/runtime/`, benchmark summary. | Deployment hardening details unless asked. |
| RSE / Architect | RSE portal view, API docs, scripts, runtime summaries, metrics, tests, deployment files. | [Operations Runbook](../docs/operations-runbook.md), [Technical Reference](../docs/technical-reference.md), `scripts/validate.sh`, `.github/workflows/validate.yml`. | Sponsor framing unless needed for context. |

