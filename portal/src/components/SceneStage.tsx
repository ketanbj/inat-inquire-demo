import { BarChart3, Database, Eye, ExternalLink, Plus, Search as SearchIcon } from "lucide-react";
import type { AudienceKey, PersonaResource, SceneNodeKey } from "../data/content";
import { sceneNodes } from "../data/content";
import type { StageEvidence } from "../data/sceneEvidence";
import { personaResourceTitle } from "../data/sceneEvidence";
import { IsometricScene, type SceneActivity, type SceneAnchorMap } from "./IsometricScene";

type SceneStageProps = {
  audience: AudienceKey;
  selectedNode: SceneNodeKey;
  activity: SceneActivity;
  anchors: SceneAnchorMap;
  nodeEvidence: Record<SceneNodeKey, StageEvidence>;
  selectedArtifactResources: PersonaResource[];
  onSelectNode: (node: SceneNodeKey) => void;
  onAnchorsChange: (anchors: SceneAnchorMap) => void;
};

const nodeIcon = {
  source: Eye,
  ingest: Plus,
  index: Database,
  search: SearchIcon,
  decision: BarChart3
} satisfies Record<SceneNodeKey, typeof Eye>;

export function SceneStage({
  audience,
  selectedNode,
  activity,
  anchors,
  nodeEvidence,
  selectedArtifactResources,
  onSelectNode,
  onAnchorsChange
}: SceneStageProps) {
  const selectedSceneNode = sceneNodes.find((node) => node.key === selectedNode) || sceneNodes[0];

  return (
    <div className="scene-main-stage">
      <div className="scene-theater">
        <IsometricScene
          audience={audience}
          selectedNode={selectedNode}
          activity={activity}
          onSelectNode={onSelectNode}
          onAnchorsChange={onAnchorsChange}
        />
        <div className="scene-hotspots" aria-label="Scene nodes">
          {sceneNodes.map((node) => {
            const anchor = anchors[node.key];
            const Icon = nodeIcon[node.key];
            return anchor ? (
              <button
                key={node.key}
                type="button"
                className={node.key === selectedNode ? "hotspot-button active" : "hotspot-button"}
                style={{ left: `${anchor.x}px`, top: `${anchor.y}px` }}
                onClick={() => onSelectNode(node.key)}
                aria-label={node.label}
              >
                <Icon size={15} />
              </button>
            ) : null;
          })}
        </div>
      </div>
      <article className="stage-evidence-panel" aria-label={`${selectedSceneNode.shortLabel} evidence`}>
        <div className="stage-evidence-header">
          <div className="node-popover-title">
            <span>{selectedSceneNode.shortLabel}</span>
            <strong>{selectedSceneNode.label}</strong>
          </div>
          <p>{selectedSceneNode.stat}</p>
        </div>
        <p className="stage-takeaway">{nodeEvidence[selectedNode].takeaway}</p>
        <div className="stage-signal-list" aria-label={`${selectedSceneNode.shortLabel} signals`}>
          {nodeEvidence[selectedNode].signals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
        <details className="stage-artifact-drawer" open>
          <summary>
            <span>Artifacts</span>
            <small>
              {personaResourceTitle[audience]} · {selectedSceneNode.shortLabel}
            </small>
          </summary>
          <div className="stage-artifact-links">
            {selectedArtifactResources.map((resource) => (
              <a
                key={`${resource.label}-${resource.href}`}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>
                  <strong>{resource.label}</strong>
                  <small>{resource.note}</small>
                </span>
                <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </details>
      </article>
    </div>
  );
}
