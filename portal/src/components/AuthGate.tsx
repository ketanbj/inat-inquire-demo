import { LockKeyhole, LogIn } from "lucide-react";
import { FormEvent, useState } from "react";
import { login } from "../api";
import { SceneNodeKey } from "../data/content";
import { runAsyncAction } from "../lib/asyncAction";
import { IsometricScene } from "./IsometricScene";

type AuthGateProps = {
  onAuthenticated: (token: string) => void;
};

const AUTH_ERROR_MESSAGE = "Password did not match the private demo gate.";

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSceneNode, setSelectedSceneNode] = useState<SceneNodeKey>("source");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runAsyncAction({
      setLoading,
      setError,
      errorMessage: (error) => (error instanceof Error ? error.message : AUTH_ERROR_MESSAGE),
      action: () => login(password),
      onSuccess: (token) => {
        sessionStorage.setItem("inat-demo-token", token);
        onAuthenticated(token);
      }
    });
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <div className="brand-mark" aria-hidden="true">
            <LockKeyhole size={28} />
          </div>
          <h1>iNat x INQUIRE Demo</h1>
          <form className="auth-form" onSubmit={submit} aria-busy={loading}>
            <label htmlFor="password">Demo password</label>
            <div className="auth-row">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !password.trim()} aria-label="Enter demo">
                <LogIn size={18} />
              </button>
            </div>
            {error ? (
              <p className="error-text" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </div>
        <IsometricScene
          audience="researcher"
          selectedNode={selectedSceneNode}
          activity="idle"
          onSelectNode={setSelectedSceneNode}
        />
      </section>
    </main>
  );
}
