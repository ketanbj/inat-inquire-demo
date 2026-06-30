import { Loader2, Play, Search as SearchIcon } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import type { SearchResponse } from "../api";
import { search } from "../api";
import { runAsyncAction } from "../lib/asyncAction";
import { SectionHeading, type PanelIntro } from "./SectionHeading";

type SearchPanelProps = PanelIntro & {
  token: string;
  suggestedQueries: string[];
  collection: string;
  limit?: number;
};

const SEARCH_UNAVAILABLE_MESSAGE =
  "Live search is unavailable. Start the prepared search environment before using the portal.";

export function SearchPanel({
  token,
  eyebrow,
  title,
  context,
  suggestedQueries,
  collection,
  limit = 6
}: SearchPanelProps) {
  const [query, setQuery] = useState(suggestedQueries[0]);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(suggestedQueries[0]);
    setResponse(null);
  }, [suggestedQueries]);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Enter a search query before running live search.");
      return;
    }
    await runAsyncAction({
      setLoading,
      setError,
      errorMessage: (error) => (error instanceof Error ? error.message : SEARCH_UNAVAILABLE_MESSAGE),
      action: () => search(token, trimmedQuery, limit, collection),
      onSuccess: setResponse
    });
  }

  return (
    <section className="search-section" aria-label="Search demo">
      <SectionHeading eyebrow={eyebrow} title={title} context={context} />
      <form className="search-form" onSubmit={runSearch} aria-busy={loading}>
        <SearchIcon size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search query"
        />
        <button type="submit" disabled={loading || !query.trim()} className="primary-action">
          {loading ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
          <span>Run</span>
        </button>
      </form>
      <div className="query-row" aria-label="Suggested queries">
        {suggestedQueries.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setQuery(item)}
            aria-pressed={query === item}
          >
            {item}
          </button>
        ))}
      </div>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
      {response ? (
        <>
          <div className="result-summary">
            <span className="metric-chip live">Live</span>
            {response.mode === "live" ? null : <span>{response.mode}</span>}
            <span>{response.model}</span>
            <span>{response.collection}</span>
            <span>{response.latency_ms ?? "n/a"} ms measured request</span>
          </div>
          {response.results.length === 0 ? (
            <p className="empty-state">No results returned for this query in the active image collection.</p>
          ) : null}
          <div className="results-grid" aria-live="polite">
            {response.results.map((result) => (
              <article className="result-card" key={result.id}>
                <div className="image-frame">
                  {result.image_url ? (
                    <img
                      src={result.image_url}
                      alt={result.title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="image-placeholder">Image preview appears when local object storage is reachable</div>
                  )}
                  <span className="rank">#{result.rank}</span>
                </div>
                <div className="result-body">
                  <div className="score-row">
                    <strong>{result.title}</strong>
                    <span>{Math.round(result.score * 1000) / 1000}</span>
                  </div>
                  <p>{result.explanation}</p>
                  <dl>
                    <div>
                      <dt>Image key</dt>
                      <dd>{result.s3_key || "Unavailable"}</dd>
                    </div>
                    <div>
                      <dt>Dimensions</dt>
                      <dd>
                        {result.width && result.height
                          ? `${result.width} x ${result.height}`
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Source set</dt>
                      <dd>{result.dataset || "Metadata unavailable"}</dd>
                    </div>
                    <div>
                      <dt>License</dt>
                      <dd>{result.license || "See source data"}</dd>
                    </div>
                  </dl>
                  {result.source_url ? (
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="source-link"
                    >
                      Open source image
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
