import { Activity, AlertCircle, LogOut } from "lucide-react";
import type { DemoStatus } from "../api";
import type { AudienceKey } from "../data/content";
import { audiences } from "../data/content";
import { activityLabel, personaShortLabel } from "../data/sceneEvidence";
import type { SceneActivity } from "./IsometricScene";

type SceneHeaderProps = {
  audience: AudienceKey;
  activity: SceneActivity;
  status: DemoStatus | null;
  onAudienceChange: (audience: AudienceKey) => void;
  onSignOut: () => void;
};

export function SceneHeader({
  audience,
  activity,
  status,
  onAudienceChange,
  onSignOut
}: SceneHeaderProps) {
  return (
    <header className="scene-header">
      <div className="scene-brand">
        <strong>iNat x INQUIRE</strong>
        <span>{activityLabel[activity]}</span>
      </div>
      <div className="persona-switcher" aria-label="Persona lens">
        {audiences.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={item.key === audience ? "persona-button active" : "persona-button"}
              onClick={() => onAudienceChange(item.key)}
            >
              <Icon size={18} />
              <span className="persona-full-label">{item.label}</span>
              <span className="persona-short-label">{personaShortLabel[item.key]}</span>
            </button>
          );
        })}
      </div>
      <div className="scene-status">
        {status?.pipeline_online ? <Activity size={18} /> : <AlertCircle size={18} />}
        <span>{status?.pipeline_online ? "live" : "offline"}</span>
      </div>
      <button className="icon-button" type="button" aria-label="Sign out" onClick={onSignOut}>
        <LogOut size={19} />
      </button>
    </header>
  );
}
