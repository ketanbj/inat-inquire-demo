export type DemoStatus = {
  mode: string;
  authenticated: boolean;
  pipeline_online: boolean;
  pipeline_url: string;
  metric_highlights: Record<string, string | number>;
  metric_source: string;
};

export type SearchResult = {
  id: string;
  rank: number;
  score: number;
  title: string;
  image_url: string;
  s3_key: string;
  s3_uri: string;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  source: string;
  dataset?: string | null;
  source_url?: string | null;
  license?: string | null;
  explanation: string;
};

export type SearchResponse = {
  query: string;
  mode: string;
  provider: string;
  model: string;
  collection: string;
  latency_ms?: number | null;
  total: number;
  results: SearchResult[];
};

export type BenchmarkSummary = {
  dataset: string;
  provider: string;
  query_count: number;
  metrics: Record<string, number>;
  latency_ms: Record<string, number>;
  narrative: string;
  source: string;
  source_command?: string | null;
  source_artifact?: string | null;
};

export type QualityGateResult = {
  metric: string;
  threshold: number;
  direction: string;
  current?: number | null;
  passed?: boolean | null;
  source: string;
};

export type ProductionReadiness = {
  source: string;
  updated_at: string;
  control_plane: Record<string, unknown>;
  collection_management: Record<string, unknown>;
  observability: Record<string, unknown>;
  quality_loop: Record<string, unknown>;
  resilience_scale: Record<string, unknown>;
  runtime_runs: Array<Record<string, string | number | boolean | null>>;
  quality_gate_results: QualityGateResult[];
};

const DEFAULT_API_URL = import.meta.env.DEV ? "http://localhost:8088" : "";
const API_URL = (import.meta.env.VITE_DEMO_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new ApiError(await errorMessage(response), response.status);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Check the demo backend and live search service.", 0);
    }
    throw new ApiError("Unable to reach the demo backend.", 0);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  return fetchJson<T>(path, {
    ...init,
    headers
  });
}

async function errorMessage(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return fallback;
  }
  const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  if (!payload || payload.detail === undefined) {
    return fallback;
  }
  if (typeof payload.detail === "string") {
    return payload.detail;
  }
  if (Array.isArray(payload.detail)) {
    return payload.detail
      .map((item) => {
        if (typeof item === "object" && item && "msg" in item) {
          return String(item.msg);
        }
        return String(item);
      })
      .join("; ");
  }
  return fallback;
}

async function loginRequest(password: string): Promise<{ token: string }> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  return fetchJson<{ token: string }>("/auth/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ password })
  });
}

export async function login(password: string): Promise<string> {
  const payload = await loginRequest(password);
  return payload.token;
}

export function getStatus(token: string): Promise<DemoStatus> {
  return request<DemoStatus>("/demo/status", token);
}

export function getBenchmark(token: string): Promise<BenchmarkSummary> {
  return request<BenchmarkSummary>("/demo/benchmark", token);
}

export function getProductionReadiness(token: string): Promise<ProductionReadiness> {
  return request<ProductionReadiness>("/demo/production-readiness", token);
}

export function search(
  token: string,
  query: string,
  limit: number,
  collection?: string
): Promise<SearchResponse> {
  const trimmedCollection = collection?.trim();
  return request<SearchResponse>("/demo/search", token, {
    method: "POST",
    body: JSON.stringify({
      query: query.trim(),
      limit,
      collection: trimmedCollection || undefined
    })
  });
}
