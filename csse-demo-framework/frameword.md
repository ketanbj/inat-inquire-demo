# CSSE Demo Framework

This folder contains the reusable CSSE demo framework extracted from the iNat x
INQUIRE demo. The framework is an artifact framework, not a reusable software
platform. Future teams should reuse the way this package defines audiences,
claims, evidence, artifact readiness, and delivery fallback paths without
copying the iNAT portal, vector-search stack, or visual design.

The framework exists to help a CSSE team answer one sponsor-facing question:

```text
Why should someone trust CSSE with their scientific software challenge?
```

## Package Map

| File | Generic Purpose | iNAT Demo Evidence Included |
| --- | --- | --- |
| [Demo Charter](./demo-charter.md) | Defines the project decision, scope, non-goals, claims, journey, collaboration ask, and readiness criteria. | The iNat x INQUIRE objective, live before/after journey, non-goals, evidence-backed claims, and delivery status. |
| [Audience Model](./audience-model.md) | Defines who the demo serves, what each audience must believe, and how deeply each group should inspect the system. | Director / Sponsor, PI / Researcher, RSE / Architect, plus internal CSSE Director and CSSE Engineer users. |
| [Evidence Matrix](./evidence-matrix.md) | Connects each claim to live proof, recorded proof, fallback artifacts, and evidence quality expectations. | Source, ingest, embed, index, search, review, and operate evidence from the local iNAT workflow. |
| [Demo Artifact Matrix](./demo-artifact-matrix.md) | Lists the artifacts needed to deliver, recover, review, and reuse the demo package. | Portal, backend, scripts, runbook, technical reference, 7-slide deck, fallback board, runtime JSON, benchmark JSON, and validation. |

## Reusable Framework Contract

A CSSE demo package should contain four reusable decisions:

1. The charter says what decision the demo should support.
2. The audience model says who needs what proof and at what depth.
3. The evidence matrix says which claims are backed by hard evidence.
4. The artifact matrix says what files, scripts, decks, and fallback materials
   make the demo deliverable by someone other than the original builder.

The framework is complete only when these decisions are inspectable in plain
text and backed by runnable or reviewable artifacts.

## What Is Reusable

| Reusable Pattern | Why It Reuses Well |
| --- | --- |
| Audience-first delivery | Different rooms need different proof depth, but the same core claim should remain stable. |
| Evidence matrix | Claims become credible when each one has a live surface, an artifact, and a fallback path. |
| Artifact checklist | Future presenters need decks, scripts, runbooks, validation, fallback material, and handoff notes. |
| Readiness criteria | Demo quality should be judged by reproducibility, evidence freshness, and audience fit, not polish alone. |
| Fallback path | A scientific software demo should remain credible when a live dependency fails. |
| Reusable-vs-specific split | Teams should generalize methods, not accidentally standardize project-specific technology choices. |

## What Is iNAT-Specific

| iNAT-Specific Detail | Do Not Generalize As |
| --- | --- |
| iNaturalist Open Data image URLs and `gt-csse` Hugging Face datasets | A required data source for future demos. |
| `inquire-vector-search`, Ray, MinIO, Qdrant, and CLIP / Infinity embeddings | A required architecture for future demos. |
| `nudibranch` as the primary before/after query | A required demo query pattern. |
| `inat-demo-live` as the live collection name | A reusable collection naming standard. |
| The React portal and 3D scene | A reusable CSSE portal platform. |
| The exact benchmark and metric values | Production service-level objectives. |

## Readiness Criteria

A future CSSE demo package is ready when:

- The main claim and non-goals are written down.
- Each audience has a primary question, proof path, timebox, and success
  criteria.
- Each major workflow claim has evidence that can be inspected.
- A presenter can run the live path or switch to a fallback path cleanly.
- Metrics are labeled by source and freshness.
- A technical reviewer can reproduce or inspect the system without a guided
  tour.
- The package identifies what is project-specific and what is reusable.

## How To Adapt This Framework

1. Start with [Demo Charter](./demo-charter.md) and write the decision the demo
   must support.
2. Fill out [Audience Model](./audience-model.md) before designing UI or slides.
3. Build [Evidence Matrix](./evidence-matrix.md) from claims, not from available
   screenshots.
4. Use [Demo Artifact Matrix](./demo-artifact-matrix.md) to package the demo for
   live delivery, fallback delivery, technical review, and future reuse.
5. Revisit this index and mark what is reusable versus project-specific before
   handoff.

