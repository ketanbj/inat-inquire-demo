import type { AudienceKey, SceneNodeKey } from "../data/content";

export type SceneActivity = "idle" | "searching" | "ingesting" | "comparing" | "reviewing";

export type SceneAnchorMap = Partial<Record<SceneNodeKey, { x: number; y: number }>>;

export type IsometricSceneState = {
  audience: () => AudienceKey;
  selectedNode: () => SceneNodeKey;
  activity: () => SceneActivity;
  selectNode: (node: SceneNodeKey) => void;
  anchorsChanged: () => ((anchors: SceneAnchorMap) => void) | undefined;
};

export type IsometricSceneController = {
  render: () => void;
  dispose: () => void;
};
