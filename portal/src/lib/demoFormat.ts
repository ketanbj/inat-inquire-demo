import type { BenchmarkSummary, SearchResult } from "../api";

type RuntimeRun = Record<string, string | number | boolean | null>;

export function displayText(value: unknown, fallback = "Pending evidence"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function displayList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

export function formatCount(value: unknown, fallback = "pending"): string {
  return typeof value === "number" ? Intl.NumberFormat("en-US").format(value) : fallback;
}

export function formatRounded(value: unknown, suffix = "", fallback = "n/a"): string {
  return typeof value === "number" ? `${Math.round(value * 100) / 100}${suffix}` : fallback;
}

export function metricValue(
  metrics: Record<string, string | number>,
  key: string,
  fallback = "pending"
): string {
  const value = metrics[key];
  if (typeof value === "number") {
    return formatCount(value);
  }
  return value ? String(value) : fallback;
}

export function hasMetric(metrics: Record<string, string | number>, key: string): boolean {
  const value = metrics[key];
  return value !== undefined && value !== null && value !== "";
}

export function signalChipLabel(online: boolean | undefined, available: boolean): string {
  if (!online) {
    return "Offline";
  }
  return available ? "Live" : "Pending";
}

export function signalChipClass(online: boolean | undefined, available: boolean): string {
  if (!online) {
    return "metric-chip offline";
  }
  return available ? "metric-chip live" : "metric-chip pending";
}

export function runValue(run: RuntimeRun | undefined, key: string): number | null {
  const value = run?.[key];
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function runText(run: RuntimeRun | undefined, key: string): string {
  const value = run?.[key];
  return typeof value === "string" && value.trim() ? value : "";
}

export function topBenchmarkMetric(benchmark: BenchmarkSummary | null): string {
  const firstMetric = Object.entries(benchmark?.metrics || {})[0];
  return firstMetric ? `${firstMetric[0]} ${firstMetric[1].toFixed(2)}` : "pending";
}

export function compactUrl(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function resultDimensions(result: SearchResult | null): string {
  return result?.width && result.height ? `${result.width} x ${result.height}` : "unavailable";
}
