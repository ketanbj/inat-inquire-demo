import { Database, Gauge, Server, Wifi, WifiOff } from "lucide-react";
import type { DemoStatus } from "../api";

type StatusPanelProps = {
  status: DemoStatus | null;
};

export function StatusPanel({ status }: StatusPanelProps) {
  const online = Boolean(status?.pipeline_online);
  const metrics = status?.metric_highlights || {};
  const indexedVectors = metrics.collection_size
    ? `${metrics.collection_size} vectors`
    : `${metrics.ingested_success_total || 0} ingested`;
  const vectorP95 = metrics.p95_search_latency_ms || metrics.vector_query_p95_ms || "n/a";

  return (
    <aside className="status-panel" aria-label="Demo status">
      <div className="status-topline">
        {online ? <Wifi size={20} /> : <WifiOff size={20} />}
        <strong>{online ? "Live search path available" : "Live search path unavailable"}</strong>
      </div>
      <div className="source-pill">
        <b className="metric-chip live">Live metrics</b>
        <span>{status?.metric_source || "metrics pending"}</span>
      </div>
      <div className="metric-list">
        <div>
          <Database size={18} />
          <span className="metric-line">
            <b className="metric-chip live">Live</b>
            {indexedVectors}
          </span>
        </div>
        <div>
          <Gauge size={18} />
          <span className="metric-line">
            <b className="metric-chip live">Live</b>
            {vectorP95} ms vector p95
          </span>
        </div>
        <div>
          <Server size={18} />
          <span>{status?.pipeline_url || "search endpoint pending"}</span>
        </div>
      </div>
    </aside>
  );
}
