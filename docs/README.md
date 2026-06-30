# iNat x INQUIRE Demo Docs

This folder is the compact source of truth for delivering the iNat x INQUIRE
demo. The reusable CSSE demo framework extracted from this work now lives in
[`../csse-demo-framework/frameword.md`](../csse-demo-framework/frameword.md).

The core decision the demo must support is:

```text
Why should someone trust CSSE with their scientific software challenge?
```

## Documents

| Document | Use It For |
| --- | --- |
| [Project Plan](./project-plan.md) | Objective, scope, delivery audience summary, evidence summary, two-week plan, status, and readiness. |
| [Operations Runbook](./operations-runbook.md) | Starting, presenting, validating, troubleshooting, and stopping the live local demo. |
| [Technical Reference](./technical-reference.md) | Architecture, runtime workflow, evidence sources, UI direction, RSE inspection path, and scale/readiness notes. |
| [Fallback Evidence](./fallback-evidence.md) | Static before/after, metric, readiness, and inspection evidence for presentations when the live path is unavailable. |
| [CSSE Demo Framework](../csse-demo-framework/frameword.md) | Reusable charter, audience model, evidence matrix, artifact matrix, and reusable-vs-iNAT-specific extraction notes. |

## Repository Assumptions

- Commands in these docs run from the `inat-inquire-demo` repository root.
- The source pipeline is not vendored here.
- The default local layout is:

```text
inat-inquire-workspace/
  Inquire-vector-search/
  inat-inquire-demo/
```

- If your source pipeline checkout is elsewhere, set
  `INQUIRE_VECTOR_SEARCH_PATH=<relative-or-absolute-path-to-Inquire-vector-search>`
  in `.env` before running the live scripts.

## Documentation Boundary

The framework is an artifact framework, not a reusable software scaffold. The
reusable output is the way this project packages audience claims, evidence,
scripts, runbooks, readiness checks, and fallback material. The extracted
framework package is separate from these delivery docs so future CSSE demos can
reuse the method without copying this portal or pipeline.

The real portal audiences are:

- Director / Sponsor
- PI / Researcher
- RSE / Architect

CSSE Director and CSSE Engineer are internal/meta users of the artifact package.
They should not appear as portal audience modes.

## Review Standard

The demo is ready when:

- The Director path works in 2-3 minutes.
- The PI / Researcher path works in 10-20 minutes.
- The RSE / Architect path supports self-guided inspection.
- The live path works from a fresh checkout: batch 1 ingestion, search, batch 2
  ingestion, same-query search.
- Runtime evidence, benchmark evidence, and fallback evidence support the same
  audience claims.
- `./scripts/validate.sh` passes before delivery.
