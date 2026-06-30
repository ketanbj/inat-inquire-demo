import type { BenchmarkSummary, ProductionReadiness, SearchResponse } from "../api";
import {
  formatCount,
  metricValue,
  runText,
  runValue,
  topBenchmarkMetric
} from "../lib/demoFormat";
import type { SceneActivity } from "../scene/isometricTypes";
import type { AudienceKey, PersonaResource, SceneNodeKey } from "./content";
import { personaResources } from "./content";

type RuntimeRun = ProductionReadiness["runtime_runs"][number];

export type StageEvidence = {
  takeaway: string;
  signals: string[];
};

export type BatchDelta = {
  fromBatch: string;
  toBatch: string;
  fromPoints: string;
  toPoints: string;
  addedVectors: string;
  verifyQuery: string;
  firstResultKey: string;
};

export type NodeEvidenceContext = {
  audience: AudienceKey;
  benchmark: BenchmarkSummary | null;
  collection: string;
  latestRun: RuntimeRun | undefined;
  metrics: Record<string, string | number>;
  passingGates: number;
  qualityGateCount: number;
  response: SearchResponse | null;
};

export const activityLabel: Record<SceneActivity, string> = {
  idle: "ready",
  searching: "query running",
  ingesting: "records moving",
  comparing: "delta view",
  reviewing: "reviewing"
};

export const personaShortLabel: Record<AudienceKey, string> = {
  director: "Director",
  researcher: "PI",
  rse: "RSE"
};

export const personaResourceTitle: Record<AudienceKey, string> = {
  director: "People & Portfolio",
  researcher: "Pipeline Stack",
  rse: "Docs & Runbook"
};

const artifactLabelsByNode: Record<AudienceKey, Record<SceneNodeKey, string[]>> = {
  director: {
    source: ["CSSE Engineering Team", "CSSE Showcase"],
    ingest: ["Benchmark Evidence", "Readiness Evidence"],
    index: ["Benchmark Evidence", "CSSE Showcase"],
    search: ["Benchmark Evidence", "CSSE Showcase"],
    decision: ["Readiness Evidence", "Benchmark Evidence", "CSSE Showcase"]
  },
  researcher: {
    source: ["Ray Data"],
    ingest: ["Ray Data", "Ray RAG"],
    index: ["Qdrant"],
    search: ["Ray RAG", "FastAPI"],
    decision: ["Qdrant", "FastAPI"]
  },
  rse: {
    source: ["INQUIRE Repo", "Configs"],
    ingest: ["Run This Demo", "Developer Guide", "Configs"],
    index: ["Architecture Charts", "Configs", "INQUIRE Repo"],
    search: ["Demo API Docs", "Developer Guide"],
    decision: ["Demo Runbook", "Benchmarks", "Known Limits"]
  }
};

export function artifactResourcesForNode(
  audience: AudienceKey,
  selectedNode: SceneNodeKey
): PersonaResource[] {
  const labels = artifactLabelsByNode[audience][selectedNode];
  return personaResources[audience].filter((resource) => labels.includes(resource.label));
}

export function buildBatchDelta(runtimeRuns: RuntimeRun[]): BatchDelta | null {
  const completedRuns = runtimeRuns.filter((run) => runValue(run, "batch") !== null);
  if (completedRuns.length < 2) {
    return null;
  }

  const firstRun = completedRuns[0];
  const finalRun = completedRuns[completedRuns.length - 1];
  const fromPoints = runValue(firstRun, "points_after");
  const toPoints = runValue(finalRun, "points_after");
  const added = fromPoints !== null && toPoints !== null
    ? toPoints - fromPoints
    : runValue(finalRun, "added_vectors");

  return {
    fromBatch: formatCount(runValue(firstRun, "batch") || 1),
    toBatch: formatCount(runValue(finalRun, "batch") || completedRuns.length),
    fromPoints: fromPoints !== null ? formatCount(fromPoints) : "captured",
    toPoints: toPoints !== null ? formatCount(toPoints) : "captured",
    addedVectors: added !== null ? formatCount(added) : "captured",
    verifyQuery: runText(finalRun, "verify_query") || runText(firstRun, "verify_query") || "same query",
    firstResultKey: runText(finalRun, "first_result_key") || "result key captured"
  };
}

export function buildNodeEvidence(context: NodeEvidenceContext): Record<SceneNodeKey, StageEvidence> {
  const {
    audience,
    benchmark,
    collection,
    latestRun,
    metrics,
    passingGates,
    qualityGateCount,
    response
  } = context;
  const vectors = metricValue(metrics, "collection_size", "0");
  const processed = metricValue(metrics, "ingested_success_total", "0");
  const recovered = metricValue(metrics, "failed_items_recovered_from_dlq", "0");
  const latency = response?.latency_ms ? `Live ${Math.round(response.latency_ms)} ms` : "pending";
  const results = response ? formatCount(response.total) : "pending";
  const provider = response?.provider || benchmark?.provider || "pending";
  const preview = response?.results[0]?.title || "waiting";
  const gates = qualityGateCount ? `${passingGates}/${qualityGateCount}` : "pending";
  const latestCollection = latestRun?.collection ? String(latestRun.collection) : "pending";
  const benchmarkQueries = benchmark?.query_count
    ? `${formatCount(benchmark.query_count)} queries`
    : "pending";

  if (audience === "director") {
    return {
      source: {
        takeaway: "Real iNaturalist image data enters the workflow with traceable metadata.",
        signals: ["image URL", "license", "dimensions"]
      },
      ingest: {
        takeaway: "New source images can be added without rebuilding the demo.",
        signals: [`${processed} processed`, "batch append workflow", "runtime summary"]
      },
      index: {
        takeaway: "The searchable collection grows as image vectors are added.",
        signals: [collection, `${vectors} vectors`, "Qdrant collection"]
      },
      search: {
        takeaway: "The outcome is a live ranked result set, not a static screenshot.",
        signals: [response ? `${results} results` : "run query in console", latency, "ranked images"]
      },
      decision: {
        takeaway: "The next investment decision is grounded in benchmark and readiness evidence.",
        signals: [topBenchmarkMetric(benchmark), `${gates} gates`, "scale path"]
      }
    };
  }

  if (audience === "researcher") {
    return {
      source: {
        takeaway: "The representative image slice keeps source context attached to the scientific data.",
        signals: ["image metadata", preview, "source trace"]
      },
      ingest: {
        takeaway: "The workflow handles image movement, embedding, and indexing as separate steps.",
        signals: [`${processed} embedded`, "multi-stage ingestion", "batch context"]
      },
      index: {
        takeaway: "The architecture makes the search layer inspectable and replaceable.",
        signals: ["Qdrant collection", provider, collection]
      },
      search: {
        takeaway: "Retrieval behavior can be inspected through ranked results and latency.",
        signals: [`${results} top-k`, latency, "score + metadata"]
      },
      decision: {
        takeaway: "Scientific value is evaluated through benchmarks, not presentation alone.",
        signals: [benchmarkQueries, topBenchmarkMetric(benchmark), "quality loop"]
      }
    };
  }

  return {
    source: {
      takeaway: "Search payloads keep the fields needed for traceability and debugging.",
      signals: ["SearchResult", "URL / key / license", preview]
    },
    ingest: {
      takeaway: "The run path is reproducible through scripts, runtime summaries, and recovery signals.",
      signals: [`${processed} processed`, `${recovered} DLQ`, "Ray image job"]
    },
    index: {
      takeaway: "The vector index can be inspected by collection, point count, and provider.",
      signals: [collection, `${vectors} points`, provider]
    },
    search: {
      takeaway: "The API contract is narrow enough to test and operate independently.",
      signals: ["/search/images", latency, "query / limit / collection"]
    },
    decision: {
      takeaway: "Operational readiness is expressed through gates, runs, and documented limits.",
      signals: [`${gates} passing gates`, latestCollection || benchmarkQueries, "runbook"]
    }
  };
}
