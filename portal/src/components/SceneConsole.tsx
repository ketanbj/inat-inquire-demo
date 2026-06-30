import { Database, ExternalLink, Gauge, Layers3, Loader2, Play, Search, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import type { DemoStatus, SearchResponse, SearchResult } from "../api";
import type { BatchDelta } from "../data/sceneEvidence";
import {
  compactUrl,
  metricValue,
  resultDimensions,
  signalChipClass,
  signalChipLabel
} from "../lib/demoFormat";

type SceneConsoleProps = {
  status: DemoStatus | null;
  metrics: Record<string, string | number>;
  query: string;
  suggestedQueries: string[];
  error: string;
  loadingSearch: boolean;
  collectionMetricAvailable: boolean;
  latencyMetricAvailable: boolean;
  sourceMetricAvailable: boolean;
  batchDelta: BatchDelta | null;
  response: SearchResponse | null;
  selectedResult: SearchResult | null;
  eventLog: string[];
  onQueryChange: (query: string) => void;
  onSuggestedQuery: (query: string) => void;
  onSubmitSearch: (event: FormEvent) => void;
  onResultSelect: (result: SearchResult) => void;
};

export function SceneConsole({
  status,
  metrics,
  query,
  suggestedQueries,
  error,
  loadingSearch,
  collectionMetricAvailable,
  latencyMetricAvailable,
  sourceMetricAvailable,
  batchDelta,
  response,
  selectedResult,
  eventLog,
  onQueryChange,
  onSuggestedQuery,
  onSubmitSearch,
  onResultSelect
}: SceneConsoleProps) {
  return (
    <aside className="scene-console">
      <form className="scene-query" onSubmit={onSubmitSearch}>
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label="Search query"
        />
        <button type="submit" disabled={loadingSearch || !query.trim()} aria-label="Run query">
          {loadingSearch ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
        </button>
      </form>
      <div className="scene-query-chips" aria-label="Suggested queries">
        {suggestedQueries.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSuggestedQuery(item)}
            aria-pressed={query === item}
          >
            {item}
          </button>
        ))}
      </div>
      {error ? (
        <p className="scene-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="scene-signal-grid">
        <div>
          <Database size={17} />
          <span className="metric-line">
            <b className={signalChipClass(status?.pipeline_online, collectionMetricAvailable)}>
              {signalChipLabel(status?.pipeline_online, collectionMetricAvailable)}
            </b>
            <span>
              <strong>Indexed corpus</strong>
              <small>
                {collectionMetricAvailable
                  ? `${metricValue(metrics, "collection_size")} vectors`
                  : "waiting for live metrics"}
              </small>
            </span>
          </span>
        </div>
        <div>
          <Gauge size={17} />
          <span className="metric-line">
            <b className={signalChipClass(status?.pipeline_online, latencyMetricAvailable)}>
              {signalChipLabel(status?.pipeline_online, latencyMetricAvailable)}
            </b>
            <span>
              <strong>Search latency</strong>
              <small>
                {latencyMetricAvailable
                  ? `${metricValue(metrics, "p95_search_latency_ms")} ms p95`
                  : "run live query path"}
              </small>
            </span>
          </span>
        </div>
        <div>
          <Layers3 size={17} />
          <span className="metric-line">
            <b className={signalChipClass(status?.pipeline_online, sourceMetricAvailable)}>
              {signalChipLabel(status?.pipeline_online, sourceMetricAvailable)}
            </b>
            <span>
              <strong>Metrics source</strong>
              <small>{sourceMetricAvailable ? compactUrl(status?.metric_source || "") : "pipeline /metrics"}</small>
            </span>
          </span>
        </div>
      </div>
      {batchDelta ? (
        <article className="scene-batch-proof" aria-label="Before and after ingestion evidence">
          <span>Before / After</span>
          <strong>
            Batch {batchDelta.fromBatch}: {batchDelta.fromPoints} to batch {batchDelta.toBatch}: {batchDelta.toPoints}
          </strong>
          <small>
            +{batchDelta.addedVectors} vectors with "{batchDelta.verifyQuery}" · {batchDelta.firstResultKey}
          </small>
        </article>
      ) : null}
      <div className="scene-result-strip">
        {(response?.results || []).slice(0, 3).map((result) => (
          <button
            type="button"
            key={result.id}
            onClick={() => onResultSelect(result)}
            aria-pressed={selectedResult?.id === result.id}
          >
            {result.image_url ? (
              <img src={result.image_url} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
            ) : (
              <Sparkles size={20} />
            )}
            <span>#{result.rank}</span>
          </button>
        ))}
      </div>
      {selectedResult ? <SelectedResultCard result={selectedResult} /> : null}
      <div className="scene-feed" aria-label="Scene events">
        {eventLog.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </aside>
  );
}

function SelectedResultCard({ result }: { result: SearchResult }) {
  return (
    <article className="scene-result-detail" aria-label="Selected result evidence">
      <div className="scene-result-detail-header">
        <span>Selected Result</span>
        <strong>#{result.rank} / {Math.round(result.score * 1000) / 1000}</strong>
      </div>
      <dl>
        <div>
          <dt>Object key</dt>
          <dd>{result.s3_key || "unavailable"}</dd>
        </div>
        <div>
          <dt>Source set</dt>
          <dd>{result.dataset || "metadata unavailable"}</dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>{resultDimensions(result)}</dd>
        </div>
        <div>
          <dt>License</dt>
          <dd>{result.license || "see source data"}</dd>
        </div>
      </dl>
      {result.source_url ? (
        <a href={result.source_url} target="_blank" rel="noopener noreferrer">
          <span>Open source image</span>
          <ExternalLink size={14} />
        </a>
      ) : null}
    </article>
  );
}
