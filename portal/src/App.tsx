import { useEffect, useState } from "react";
import type { BenchmarkSummary, DemoStatus, ProductionReadiness } from "./api";
import { getBenchmark, getProductionReadiness, getStatus, isUnauthorized } from "./api";
import { AuthGate } from "./components/AuthGate";
import { SceneExperience } from "./components/SceneExperience";
import { AudienceKey } from "./data/content";

export function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("inat-demo-token") || "");
  const [selectedAudience, setSelectedAudience] = useState<AudienceKey>("director");
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkSummary | null>(null);
  const [readiness, setReadiness] = useState<ProductionReadiness | null>(null);

  const liveCollection = "inat-demo-live";
  const clearSession = () => {
    sessionStorage.removeItem("inat-demo-token");
    setToken("");
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    const handleRequestError = (error: unknown) => {
      if (!active) {
        return true;
      }
      if (isUnauthorized(error)) {
        clearSession();
        return true;
      }
      return false;
    };
    const refreshStatus = () => {
      getStatus(token)
        .then((payload) => {
          if (active) {
            setStatus(payload);
          }
        })
        .catch((error: unknown) => {
          if (!handleRequestError(error)) {
            setStatus(null);
          }
        });
    };
    const refreshReadiness = () => {
      getProductionReadiness(token)
        .then((payload) => {
          if (active) {
            setReadiness(payload);
          }
        })
        .catch((error: unknown) => {
          if (!handleRequestError(error)) {
            setReadiness(null);
          }
        });
    };
    refreshStatus();
    refreshReadiness();
    const statusTimer = window.setInterval(refreshStatus, 5000);
    const readinessTimer = window.setInterval(refreshReadiness, 10000);
    getBenchmark(token)
      .then((payload) => {
        if (active) {
          setBenchmark(payload);
        }
      })
      .catch((error: unknown) => {
        if (!handleRequestError(error)) {
          setBenchmark(null);
        }
      });

    return () => {
      active = false;
      window.clearInterval(statusTimer);
      window.clearInterval(readinessTimer);
    };
  }, [token]);

  if (!token) {
    return <AuthGate onAuthenticated={setToken} />;
  }

  return (
    <main className={`app-shell audience-${selectedAudience}`}>
      <SceneExperience
        token={token}
        audience={selectedAudience}
        status={status}
        benchmark={benchmark}
        readiness={readiness}
        collection={liveCollection}
        onAudienceChange={setSelectedAudience}
        onSignOut={clearSession}
        onUnauthorized={clearSession}
      />
    </main>
  );
}
