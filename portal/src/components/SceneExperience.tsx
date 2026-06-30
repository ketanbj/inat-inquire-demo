import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { BenchmarkSummary, DemoStatus, ProductionReadiness, SearchResponse, SearchResult } from "../api";
import { isUnauthorized, search } from "../api";
import { AudienceKey, SceneNodeKey, suggestedQueriesByAudience } from "../data/content";
import {
  artifactResourcesForNode,
  buildBatchDelta,
  buildNodeEvidence
} from "../data/sceneEvidence";
import { hasMetric } from "../lib/demoFormat";
import type { SceneActivity, SceneAnchorMap } from "./IsometricScene";
import { SceneConsole } from "./SceneConsole";
import { SceneHeader } from "./SceneHeader";
import { SceneStage } from "./SceneStage";

type SceneExperienceProps = {
  token: string;
  audience: AudienceKey;
  status: DemoStatus | null;
  benchmark: BenchmarkSummary | null;
  readiness: ProductionReadiness | null;
  collection: string;
  onAudienceChange: (audience: AudienceKey) => void;
  onSignOut: () => void;
  onUnauthorized: () => void;
};

export function SceneExperience({
  token,
  audience,
  status,
  benchmark,
  readiness,
  collection,
  onAudienceChange,
  onSignOut,
  onUnauthorized
}: SceneExperienceProps) {
  const suggestedQueries = suggestedQueriesByAudience[audience];
  const [selectedNode, setSelectedNode] = useState<SceneNodeKey>("source");
  const [activity, setActivity] = useState<SceneActivity>("idle");
  const [query, setQuery] = useState(suggestedQueries[0]);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [anchors, setAnchors] = useState<SceneAnchorMap>({});
  const [eventLog, setEventLog] = useState<string[]>(["scene ready"]);
  const timersRef = useRef<number[]>([]);

  const metrics = status?.metric_highlights || {};
  const qualityGates = readiness?.quality_gate_results || [];
  const passingGates = qualityGates.filter((gate) => gate.passed).length;
  const runtimeRuns = readiness?.runtime_runs || [];
  const latestRun = readiness?.runtime_runs?.slice(-1)[0];
  const selectedArtifactResources = artifactResourcesForNode(audience, selectedNode);
  const collectionMetricAvailable = hasMetric(metrics, "collection_size");
  const latencyMetricAvailable = hasMetric(metrics, "p95_search_latency_ms");
  const sourceMetricAvailable = Boolean(status?.metric_source && status.metric_source !== "live pipeline unavailable");
  const batchDelta = useMemo(() => buildBatchDelta(runtimeRuns), [runtimeRuns]);

  useEffect(() => {
    setQuery(suggestedQueries[0]);
    setSelectedResult(null);
  }, [suggestedQueries]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const pushEvent = (event: string) => {
    setEventLog((items) => [event, ...items].slice(0, 4));
  };

  const clearSceneTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const runSceneSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Enter a query.");
      return;
    }
    clearSceneTimers();
    setError("");
    setLoadingSearch(true);
    setSelectedNode("search");
    setActivity("searching");
    try {
      const payload = await search(token, trimmedQuery, audience === "rse" ? 4 : 6, collection);
      setResponse(payload);
      setSelectedResult(payload.results[0] || null);
      setActivity("reviewing");
      pushEvent(`${payload.total} result${payload.total === 1 ? "" : "s"} returned`);
      const timer = window.setTimeout(() => {
        setSelectedNode("decision");
        setActivity("idle");
      }, 1200);
      timersRef.current.push(timer);
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        onUnauthorized();
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Search unavailable.");
      setActivity("idle");
    } finally {
      setLoadingSearch(false);
    }
  };

  const nodeEvidence = useMemo(
    () =>
      buildNodeEvidence({
        audience,
        benchmark,
        collection,
        latestRun,
        metrics,
        passingGates,
        qualityGateCount: qualityGates.length,
        response
      }),
    [audience, benchmark, collection, latestRun, metrics, passingGates, qualityGates.length, response]
  );

  return (
    <section className="scene-experience" aria-label="iNat INQUIRE interactive scene">
      <SceneHeader
        audience={audience}
        activity={activity}
        status={status}
        onAudienceChange={onAudienceChange}
        onSignOut={onSignOut}
      />

      <div className="scene-workbench">
        <SceneStage
          audience={audience}
          selectedNode={selectedNode}
          activity={activity}
          anchors={anchors}
          nodeEvidence={nodeEvidence}
          selectedArtifactResources={selectedArtifactResources}
          onSelectNode={setSelectedNode}
          onAnchorsChange={setAnchors}
        />
        <SceneConsole
          status={status}
          metrics={metrics}
          query={query}
          suggestedQueries={suggestedQueries}
          error={error}
          loadingSearch={loadingSearch}
          collectionMetricAvailable={collectionMetricAvailable}
          latencyMetricAvailable={latencyMetricAvailable}
          sourceMetricAvailable={sourceMetricAvailable}
          batchDelta={batchDelta}
          response={response}
          selectedResult={selectedResult}
          eventLog={eventLog}
          onQueryChange={setQuery}
          onSuggestedQuery={(item) => {
            setQuery(item);
            setSelectedNode("search");
          }}
          onSubmitSearch={runSceneSearch}
          onResultSelect={(result) => {
            setSelectedResult(result);
            setSelectedNode("source");
            pushEvent(`rank ${result.rank} inspected`);
          }}
        />
      </div>
    </section>
  );
}
