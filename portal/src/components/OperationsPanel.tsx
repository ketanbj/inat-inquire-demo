import { Activity, Database, GitBranch, Server, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DemoStatus } from "../api";
import { SectionHeading } from "./SectionHeading";

type OperationsPanelProps = {
  status: DemoStatus | null;
};

type OperationsRow = {
  icon: LucideIcon;
  label: string;
  value: string;
  copy: string;
};

function OperationsRowCard({ row }: { row: OperationsRow }) {
  const RowIcon = row.icon;
  return (
    <article className="operations-row">
      <RowIcon size={22} />
      <div>
        <span>{row.label}</span>
        <strong>{row.value}</strong>
        <p>{row.copy}</p>
      </div>
    </article>
  );
}

export function OperationsPanel({ status }: OperationsPanelProps) {
  const metrics = status?.metric_highlights || {};
  const vectorP95 = metrics.p95_search_latency_ms || metrics.vector_query_p95_ms || "n/a";
  const rows: OperationsRow[] = [
    {
      icon: Server,
      label: "Search boundary",
      value: "/demo/search",
      copy:
        "Normalizes the retrieval response so score, image key, source URL, license, and measured latency stay together."
    },
    {
      icon: GitBranch,
      label: "New records",
      value: "First slice / later slice",
      copy:
        "A later image arrival is appended to the same collection, so before and after results reflect corpus change."
    },
    {
      icon: Database,
      label: "Vector payloads",
      value: `${metrics.collection_size || 0} vectors`,
      copy: `The search index carries embeddings with image keys, provenance, dimensions, and source metadata. Metric source: ${status?.metric_source || "loading"}.`
    },
    {
      icon: ShieldCheck,
      label: "Recovery trail",
      value: `${metrics.failed_items_recovered_from_dlq || 0} DLQ items`,
      copy: metrics.failed_items_recovered_from_dlq
        ? "Recovered ingestion items are reported through the live metrics path."
        : "Ingestion failures and checkpoint saves are visible through the metrics path."
    },
    {
      icon: Activity,
      label: "Live vector p95",
      value: `${vectorP95} ms`,
      copy:
        "Result cards show measured per-request latency; this row tracks the live vector query histogram during review."
    }
  ];

  return (
    <section className="operations-section" aria-label="Operations evidence">
      <SectionHeading eyebrow="Operational view" title="What an architect can inspect" />
      <div className="operations-list">
        {rows.map((row) => (
          <OperationsRowCard row={row} key={row.label} />
        ))}
      </div>
    </section>
  );
}
