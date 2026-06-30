---
marp: true
theme: default
paginate: true
title: iNat x INQUIRE Demo
description: Partner demo for iNat x INQUIRE semantic search and scalable ingestion
style: |
  :root {
    --font-roboto: "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
    --font-roboto-condensed: "Roboto Condensed", "Arial Narrow", Arial, sans-serif;
    --font-roboto-slab: "Roboto Slab", Georgia, "Times New Roman", serif;
    --ink: #18222d;
    --muted: #5d6875;
    --soft: #eef2ed;
    --surface: #ffffff;
    --surface-2: #f7f8f3;
    --line: #d9dfd5;
    --navy: #003057;
    --blue: #004f9f;
    --gold: #b3a369;
    --orange: #f95e10;
    --green: #216e4e;
    --rose: #9a1b39;
    --accent: var(--orange);
    --accent-soft: #fff0df;
    --shadow: 0 24px 70px rgba(0, 48, 87, 0.14);
    --shadow-soft: 0 12px 36px rgba(24, 34, 45, 0.08);
  }

  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    border: 1px solid rgba(0, 48, 87, 0.12);
    background:
      linear-gradient(90deg, var(--gold), var(--orange), var(--green), var(--blue)) top / 100% 6px no-repeat,
      linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 248, 243, 0.86)),
      linear-gradient(90deg, rgba(0, 48, 87, 0.04) 1px, transparent 1px),
      linear-gradient(0deg, rgba(0, 48, 87, 0.035) 1px, transparent 1px),
      var(--soft);
    background-size: 100% 6px, auto, 44px 44px, 44px 44px, auto;
    color: var(--ink);
    font-family: var(--font-roboto);
    padding: 66px 76px 58px;
  }

  section::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, var(--gold), var(--orange), var(--green), var(--blue));
  }

  h1,
  h2 {
    color: var(--navy);
    letter-spacing: 0;
  }

  h1 {
    max-width: 900px;
    margin: 0 0 20px;
    font-family: var(--font-roboto-slab);
    font-size: 66px;
    line-height: 1.02;
  }

  h2 {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    min-height: 58px;
    margin: 0 0 24px;
    border: 1px solid rgba(0, 48, 87, 0.12);
    border-left: 6px solid var(--accent);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: var(--shadow-soft);
    padding: 8px 22px 9px 18px;
    color: var(--navy);
    font-family: var(--font-roboto-condensed);
    font-size: 42px;
    line-height: 1.05;
    font-weight: 900;
  }

  h1 + p,
  h2 + p {
    max-width: 940px;
    color: var(--muted);
    font-size: 30px;
    font-weight: 680;
    line-height: 1.38;
  }

  p,
  li,
  td,
  th {
    font-size: 24px;
    line-height: 1.38;
  }

  p {
    margin: 0 0 22px;
  }

  ul {
    display: grid;
    gap: 12px;
    margin: 20px 0 0;
    padding: 0;
  }

  li {
    position: relative;
    list-style: none;
    min-height: 48px;
    border: 1px solid rgba(0, 48, 87, 0.12);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: var(--shadow-soft);
    padding: 11px 18px 11px 48px;
    color: var(--navy);
    font-weight: 760;
  }

  li::before {
    content: "";
    position: absolute;
    left: 18px;
    top: 21px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 6px var(--accent-soft);
  }

  strong {
    color: var(--navy);
  }

  code,
  pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }

  code {
    border: 1px solid rgba(0, 48, 87, 0.12);
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--navy);
    padding: 3px 9px;
    font-size: 0.82em;
    font-weight: 850;
  }

  pre {
    margin: 22px 0 22px;
    border: 1px solid rgba(0, 48, 87, 0.13);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: var(--shadow-soft);
    padding: 19px 22px;
    color: var(--navy);
  }

  pre code {
    display: block;
    border: 0;
    border-radius: 0;
    background: transparent;
    padding: 0;
    color: var(--navy);
    font-size: 26px;
    line-height: 1.35;
    font-weight: 820;
  }

  table {
    width: 100%;
    margin-top: 18px;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid rgba(0, 48, 87, 0.12);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: var(--shadow-soft);
    overflow: hidden;
  }

  th {
    background: var(--navy);
    color: var(--surface);
    font-size: 19px;
    font-weight: 900;
    text-transform: uppercase;
  }

  td {
    color: var(--navy);
    font-weight: 760;
  }

  th,
  td {
    border: 0;
    border-bottom: 1px solid rgba(0, 48, 87, 0.1);
    padding: 12px 16px;
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  td:first-child {
    color: var(--muted);
    font-size: 21px;
    font-weight: 850;
    text-transform: uppercase;
  }

  section:nth-of-type(2),
  section:nth-of-type(5) {
    --accent: var(--green);
    --accent-soft: #e7f5e8;
  }

  section:nth-of-type(3),
  section:nth-of-type(6) {
    --accent: var(--blue);
    --accent-soft: #e4f0ff;
  }

  section:nth-of-type(1) {
    justify-content: flex-start;
    padding-top: 104px;
  }

  section::after {
    content: attr(data-marpit-pagination) !important;
    position: absolute !important;
    inset: auto 42px 36px auto !important;
    min-width: 34px !important;
    height: 34px !important;
    display: inline-grid !important;
    place-items: center !important;
    border: 1px solid rgba(0, 48, 87, 0.12);
    border-radius: 999px !important;
    background: rgba(255, 255, 255, 0.74);
    color: var(--navy);
    padding: 0 !important;
    font-size: 16px !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }

  section::marker {
    color: var(--accent);
  }
---

# iNat x INQUIRE: Problem

Biodiversity image collections become useful only when source data, metadata,
embeddings, search behavior, and evidence stay connected.

- New scientific images need to become searchable without losing provenance.
- Research teams need a path from prototype search to operated infrastructure.
- Sponsors need proof that the approach is real, measurable, and reusable.

---

## CSSE Approach

CSSE built a representative slice that makes the scientific workflow inspectable.

```text
HF / iNaturalist -> MinIO -> Ray -> embeddings -> Qdrant -> portal
```

- Reuse the existing `inquire-vector-search` API rather than changing it.
- Add demo-safe scripts, backend adaptation, evidence loading, and validation.
- Present one system at Director, PI / Researcher, and RSE / Architect depths.

---

## Demo Outcome

The live path shows the searchable corpus changing during the presentation.

```text
Ingest batch 1 -> Search -> Append batch 2 -> Same-query rerun
```

| Proof point | Captured value |
| --- | --- |
| Query | `nudibranch` |
| Batch 1 collection size | `24` vectors |
| Batch 2 collection size | `48` vectors |
| First result after append | `hf-inat/batch-2/.../516.jpg` |

---

## Evidence

Every claim is tied to an artifact a reviewer can inspect.

| Claim | Evidence |
| --- | --- |
| Source data is real | HF dataset IDs, iNaturalist photo IDs, image URLs, licenses |
| Ingestion is operational | Batch scripts, MinIO keys, elapsed time, uploaded bytes |
| Search is traceable | Ranked results, scores, object keys, dimensions, source links |
| Delivery is reproducible | Runbook, technical reference, validation script, fallback board |

---

## Metrics

Use these as captured demo evidence, not production SLOs.

| Metric | Value | Source |
| --- | --- | --- |
| Added vectors in live append | `24` | runtime batch summaries |
| Large-run ingest rate | `37.8 images/sec` | metrics highlight |
| Search p95 latency | `418 ms` | benchmark summary |
| Precision@10 | `0.72` | benchmark summary |
| NDCG@10 | `0.81` | benchmark summary |

---

## Impact

The demo turns a complex research software challenge into an investment-ready
decision path.

- Directors see a working before/after outcome in 2-3 minutes.
- PIs see source data, ingestion, embeddings, indexing, and traceability.
- RSEs can inspect contracts, scripts, metrics, tests, and recovery paths.
- Future CSSE demos can reuse the artifact framework without inheriting this UI.

---

## Collaboration Ask

Bring CSSE in when research ambition depends on software that must scale,
measure up, and survive inspection.

- Select the next scientific dataset and quality gates.
- Decide the operating target: local proof, hosted pilot, or managed service.
- Fund the next increment around ingestion scale, evaluation, and operations.
