# Demo Labels And Links Review

This file lists the visible labels, review copy, suggested queries, and outbound
links used by the active portal path.

## Shared Entry Labels

These appear before an audience is selected.

| UI Area | Text |
| --- | --- |
| Auth title | `iNat x INQUIRE Demo` |
| Auth field label | `Demo password` |
| Auth placeholder | `Enter password` |
| Auth submit aria-label | `Enter demo` |
| Auth error | `Password did not match the private demo gate.` |

## Shared Scene Labels

These appear across audience modes.

| UI Area | Text |
| --- | --- |
| Brand | `iNat x INQUIRE` |
| Activity labels | `ready`, `query running`, `records moving`, `delta view`, `reviewing` |
| Status labels | `live`, `offline`, `Live`, `Pending`, `Offline` |
| Audience switcher aria-label | `Persona lens` |
| Sign out aria-label | `Sign out` |
| Scene aria-label | `iNat INQUIRE interactive scene` |
| Scene nodes aria-label | `Scene nodes` |
| Artifact drawer label | `Artifacts` |
| Search field aria-label | `Search query` |
| Search button aria-label | `Run query` |
| Suggested query group aria-label | `Suggested queries` |
| Empty query error | `Enter a query.` |
| Search unavailable error fallback | `Search unavailable.` |
| Metric label | `Indexed corpus` |
| Metric fallback | `waiting for live metrics` |
| Metric label | `Search latency` |
| Metric fallback | `run live query path` |
| Metric label | `Metrics source` |
| Metric fallback | `pipeline /metrics` |
| Batch proof label | `Before / After` |
| Result detail aria-label | `Selected result evidence` |
| Result detail label | `Selected Result` |
| Result detail field | `Object key` |
| Result detail fallback | `unavailable` |
| Result detail field | `Source set` |
| Result detail fallback | `metadata unavailable` |
| Result detail field | `Dimensions` |
| Result detail fallback | `unavailable` |
| Result detail field | `License` |
| Result detail fallback | `see source data` |
| Result link | `Open source image` |
| Event feed aria-label | `Scene events` |
| Initial event | `scene ready` |

## Shared Workflow Nodes

| Node Key | Short Label | Full Label | Stat Text |
| --- | --- | --- | --- |
| `source` | `Source` | `iNaturalist Source Images` | `image, license, dimensions` |
| `ingest` | `Ingest` | `INQUIRE Ingestion Path` | `bounded local slice` |
| `index` | `Index` | `Vector Collection` | `searchable embeddings` |
| `search` | `Search` | `Research Search Experience` | `query, score, latency` |
| `decision` | `Review` | `Review And Scale Decision` | `quality gates and cost` |

## Director / Sponsor

| Field | Text |
| --- | --- |
| Audience label | `Director` |
| Audience caption | `Resource view` |
| Short label | `Director` |
| Artifact group title | `People & Portfolio` |
| Suggested queries | `nudibranch`, `desert shrub`, `harbor seals`, `pink wildflower` |

### Director Stage Copy

| Stage | Takeaway | Signal Labels | Artifact Labels |
| --- | --- | --- | --- |
| Source | `Real iNaturalist image data enters the workflow with traceable metadata.` | `image URL`, `license`, `dimensions` | `CSSE Engineering Team`, `CSSE Showcase` |
| Ingest | `New source images can be added without rebuilding the demo.` | `{processed} processed`, `batch append workflow`, `runtime summary` | `Benchmark Evidence`, `Readiness Evidence` |
| Index | `The searchable collection grows as image vectors are added.` | `{collection}`, `{vectors} vectors`, `Qdrant collection` | `Benchmark Evidence`, `CSSE Showcase` |
| Search | `The outcome is a live ranked result set, not a static screenshot.` | `{results} results` or `run query in console`, `{latency}`, `ranked images` | `Benchmark Evidence`, `CSSE Showcase` |
| Review | `The next investment decision is grounded in benchmark and readiness evidence.` | `{topMetric}`, `{passingGates}/{totalGates} gates`, `scale path` | `Readiness Evidence`, `Benchmark Evidence`, `CSSE Showcase` |

### Director Links

| Label | Note | Link |
| --- | --- | --- |
| CSSE Engineering Team | `RSE staff` | https://ssecenter.cc.gatech.edu/people/ |
| CSSE Showcase | `Project portfolio` | https://gt-csse.github.io/project-showcase/ |
| Benchmark Evidence | `quality readout` | https://github.com/ketanbj/inat-inquire-demo/blob/main/data/evidence/benchmark-summary.json |
| Readiness Evidence | `scale path` | https://github.com/ketanbj/inat-inquire-demo/blob/main/data/evidence/production-readiness.json |

## PI / Researcher

| Field | Text |
| --- | --- |
| Audience label | `PI / Researcher` |
| Audience caption | `Research view` |
| Short label | `PI` |
| Artifact group title | `Pipeline Stack` |
| Suggested queries | `nudibranch`, `sea anemone`, `pink wildflower`, `small bird in grass` |

### PI / Researcher Stage Copy

| Stage | Takeaway | Signal Labels | Artifact Labels |
| --- | --- | --- | --- |
| Source | `The representative image slice keeps source context attached to the scientific data.` | `image metadata`, `{preview result title}` or `waiting`, `source trace` | `Ray Data` |
| Ingest | `The workflow handles image movement, embedding, and indexing as separate steps.` | `{processed} embedded`, `multi-stage ingestion`, `batch context` | `Ray Data`, `Ray RAG` |
| Index | `The architecture makes the search layer inspectable and replaceable.` | `Qdrant collection`, `{provider}`, `{collection}` | `Qdrant` |
| Search | `Retrieval behavior can be inspected through ranked results and latency.` | `{results} top-k`, `{latency}`, `score + metadata` | `Ray RAG`, `FastAPI` |
| Review | `Scientific value is evaluated through benchmarks, not presentation alone.` | `{benchmarkQueries} queries`, `{topMetric}`, `quality loop` | `Qdrant`, `FastAPI` |

### PI / Researcher Links

| Label | Note | Link |
| --- | --- | --- |
| Ray Data | `parallel ingest` | https://docs.ray.io/en/latest/data/data.html |
| Ray RAG | `distributed retrieval` | https://docs.ray.io/en/latest/ray-overview/examples/e2e-rag/notebooks/03_Deploy_LLM_with_Ray_Serve.html |
| Qdrant | `vector index` | https://qdrant.tech/documentation/ |
| FastAPI | `service boundary` | https://fastapi.tiangolo.com/ |

## RSE / Architect

| Field | Text |
| --- | --- |
| Audience label | `RSE / Architecture` |
| Audience caption | `System view` |
| Short label | `RSE` |
| Artifact group title | `Docs & Runbook` |
| Suggested queries | `nudibranch`, `desert shrub`, `harbor seals`, `sea lions on rocks` |

### RSE / Architect Stage Copy

| Stage | Takeaway | Signal Labels | Artifact Labels |
| --- | --- | --- | --- |
| Source | `Search payloads keep the fields needed for traceability and debugging.` | `SearchResult`, `URL / key / license`, `{preview result title}` or `waiting` | `INQUIRE Repo`, `Configs` |
| Ingest | `The run path is reproducible through scripts, runtime summaries, and recovery signals.` | `{processed} processed`, `{recovered} DLQ`, `Ray image job` | `Run This Demo`, `Developer Guide`, `Configs` |
| Index | `The vector index can be inspected by collection, point count, and provider.` | `{collection}`, `{vectors} points`, `{provider}` | `Architecture Charts`, `Configs`, `INQUIRE Repo` |
| Search | `The API contract is narrow enough to test and operate independently.` | `/search/images`, `{latency}`, `query / limit / collection` | `Demo API Docs`, `Developer Guide` |
| Review | `Operational readiness is expressed through gates, runs, and documented limits.` | `{passingGates} passing gates`, `{latestCollection}` or `{benchmarkQueries}`, `runbook` | `Demo Runbook`, `Benchmarks`, `Known Limits` |

### RSE / Architect Links

| Label | Note | Link |
| --- | --- | --- |
| Demo API Docs | `OpenAPI` | http://localhost:8088/docs |
| Run This Demo | `local quick start` | https://github.com/ketanbj/inat-inquire-demo#quick-start |
| Demo Runbook | `self-guided run` | https://github.com/ketanbj/inat-inquire-demo/blob/main/docs/operations-runbook.md |
| INQUIRE Repo | `source` | https://github.com/inaturalist/Inquire-vector-search |
| Developer Guide | `setup/API/bench` | https://github.com/inaturalist/Inquire-vector-search/blob/main/DEVELOPERS_GUIDE.md |
| Architecture Charts | `diagrams` | https://github.com/inaturalist/Inquire-vector-search/tree/main/charts |
| Configs | `environments` | https://github.com/inaturalist/Inquire-vector-search/tree/main/configs |
| Benchmarks | `evaluation` | https://github.com/inaturalist/Inquire-vector-search/tree/main/bench |
| Known Limits | `non-goals` | https://github.com/ketanbj/inat-inquire-demo/blob/main/docs/project-plan.md#out-of-scope |

## Dynamic Text Fields

These are populated from live or fallback API data and may vary by run.

| Field | Format |
| --- | --- |
| Search result event | `{total} result returned` or `{total} results returned` |
| Result inspection event | `rank {rank} inspected` |
| Indexed corpus value | `{collection_size} vectors` |
| Search latency value | `{p95_search_latency_ms} ms p95` |
| Metrics source value | Compact URL version of `status.metric_source` |
| Batch proof | `Batch {fromBatch}: {fromPoints} to batch {toBatch}: {toPoints}` |
| Batch proof detail | `+{addedVectors} vectors with "{verifyQuery}" · {firstResultKey}` |
| Selected result score | `#{rank} / {score}` |
| Source image link | Uses `selectedResult.source_url` from search results. |

