import {
  Activity,
  BarChart3,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  Gauge,
  GitBranch,
  ShieldCheck
} from "lucide-react";
import type { ProductionReadiness } from "../api";
import { displayList, displayText, formatRounded } from "../lib/demoFormat";

type ProductionPanelProps = {
  readiness: ProductionReadiness | null;
};

function runSummary(run: Record<string, string | number | boolean | null>): string {
  return [
    `${formatRounded(run.added_vectors)} vectors`,
    `${formatRounded(run.elapsed_seconds, "s")}`,
    `${formatRounded(run.ingest_rate_per_second, " img/s")}`,
    `$${formatRounded(run.estimated_cost_usd)}`
  ].join(" / ");
}

export function ProductionPanel({ readiness }: ProductionPanelProps) {
  const controlPlane = readiness?.control_plane || {};
  const collections = readiness?.collection_management || {};
  const observability = readiness?.observability || {};
  const qualityLoop = readiness?.quality_loop || {};
  const resilience = readiness?.resilience_scale || {};
  const runtimeRuns = readiness?.runtime_runs || [];
  const latestRuns = runtimeRuns.slice(-2).reverse();

  const pillars = [
    {
      icon: Boxes,
      label: "Run control",
      value: displayText(controlPlane.status, "target"),
      copy: displayText(controlPlane.summary),
      detail: `${displayList(controlPlane.operator_actions).length} operator actions`
    },
    {
      icon: GitBranch,
      label: "Collection release",
      value: displayText(collections.active_alias, "inat-demo-live"),
      copy: displayText(collections.promotion_policy),
      detail: `${displayList(collections.required_gates).length} required gates`
    },
    {
      icon: Activity,
      label: "Observability",
      value: `${displayList(observability.alerts).length} alerts`,
      copy: "Dashboards and alerts connect image ingestion, retrieval quality, latency, and cost.",
      detail: `${displayList(observability.dashboards).length} dashboards`
    },
    {
      icon: BarChart3,
      label: "Quality review",
      value: `${readiness?.quality_gate_results.length || 0} gates`,
      copy: "Candidate image collections are benchmarked before they become the active search target.",
      detail: `${displayList(qualityLoop.workflow).length} workflow steps`
    },
    {
      icon: ShieldCheck,
      label: "Recovery and scale",
      value: `${displayList(resilience.patterns).length} patterns`,
      copy:
        "Queues, idempotent writes, checkpoints, replay, and autoscaling frame the path beyond the demo slice.",
      detail: `${displayList(resilience.scale_dimensions).length} scale dimensions`
    }
  ];

  return (
    <section className="production-section" aria-label="Managed operations">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operating path</p>
          <h2>From local slice to managed search service</h2>
        </div>
      </div>
      <p className="section-context">
        The local workflow becomes managed ingestion runs, versioned image collections, and promotion
        decisions based on retrieval evidence rather than ad hoc judgment.
      </p>

      <div className="control-list">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article className="control-row" key={pillar.label}>
              <div className="control-title">
                <Icon size={22} />
                <div>
                  <span>{pillar.label}</span>
                  <strong>{pillar.value}</strong>
                </div>
              </div>
              <p>{pillar.copy}</p>
              <small>{pillar.detail}</small>
            </article>
          );
        })}
      </div>

      <div className="production-split">
        <article className="production-panel-box">
          <div className="panel-title">
            <Database size={20} />
            <strong>Ingestion run records</strong>
          </div>
          {latestRuns.length ? (
            <div className="run-list">
              {latestRuns.map((run) => (
                <div className="run-row" key={`${run.batch}-${run.s3_prefix}`}>
                  <span>Batch {run.batch}</span>
                  <strong>{run.collection}</strong>
                  <small>{runSummary(run)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>Run records appear after the prepared ingestion workflow has completed.</p>
          )}
        </article>

        <article className="production-panel-box">
          <div className="panel-title">
            <Gauge size={20} />
            <strong>Promotion gates</strong>
          </div>
          <div className="gate-list">
            {(readiness?.quality_gate_results || []).map((gate) => (
              <div className="gate-row" key={gate.metric}>
                {gate.passed ? <CheckCircle2 size={18} /> : <Cloud size={18} />}
                <span>{gate.metric}</span>
                <strong>
                  {gate.current ?? "n/a"} {gate.direction === "max" ? "<=" : ">="} {gate.threshold}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
