import { Activity, BarChart3 } from "lucide-react";
import type { BenchmarkSummary } from "../api";
import { SectionHeading, type PanelIntro } from "./SectionHeading";

type BenchmarkPanelProps = PanelIntro & {
  benchmark: BenchmarkSummary | null;
};

export function BenchmarkPanel({ benchmark, eyebrow, title, context }: BenchmarkPanelProps) {
  if (!benchmark) {
    return null;
  }

  const metricEntries = Object.entries(benchmark.metrics);
  const latencyEntries = Object.entries(benchmark.latency_ms);

  return (
    <section className="benchmark-section" aria-label="Benchmark evidence">
      <SectionHeading eyebrow={eyebrow} title={title} context={context} />
      <div className="source-strip">
        <b className="metric-chip benchmark">Benchmark</b>
        <span>Evidence artifact</span>
        <strong>{benchmark.source}</strong>
        {benchmark.source_artifact ? <code>{benchmark.source_artifact}</code> : null}
      </div>
      <div className="benchmark-layout">
        <article className="chart-panel">
          <div className="panel-title">
            <BarChart3 size={20} />
            <strong>Benchmark retrieval quality</strong>
          </div>
          <div className="bar-list">
            {metricEntries.map(([name, value]) => (
              <div className="bar-row" key={name}>
                <span>{name}</span>
                <div className="bar-track">
                  <div style={{ width: `${Math.min(value * 100, 100)}%` }} />
                </div>
                <b>{value.toFixed(2)}</b>
              </div>
            ))}
          </div>
        </article>
        <article className="chart-panel">
          <div className="panel-title">
            <Activity size={20} />
            <strong>Benchmark latency, milliseconds</strong>
          </div>
          <div className="latency-grid">
            {latencyEntries.map(([name, value]) => (
              <div key={name}>
                <span>{name}</span>
                <strong>
                  {Math.round(value)}
                  <small>ms</small>
                </strong>
              </div>
            ))}
          </div>
          <p>{benchmark.narrative}</p>
        </article>
      </div>
    </section>
  );
}
