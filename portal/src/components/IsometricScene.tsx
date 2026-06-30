import { useEffect, useRef } from "react";
import type { AudienceKey, SceneNodeKey } from "../data/content";
import { createIsometricRenderer } from "../scene/isometricRenderer";
import type {
  IsometricSceneController,
  SceneActivity,
  SceneAnchorMap
} from "../scene/isometricTypes";

export type { SceneActivity, SceneAnchorMap } from "../scene/isometricTypes";

type IsometricSceneProps = {
  audience: AudienceKey;
  selectedNode: SceneNodeKey;
  activity?: SceneActivity;
  onSelectNode: (node: SceneNodeKey) => void;
  onAnchorsChange?: (anchors: SceneAnchorMap) => void;
};

export function IsometricScene({
  audience,
  selectedNode,
  activity = "idle",
  onSelectNode,
  onAnchorsChange
}: IsometricSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<IsometricSceneController | null>(null);
  const selectedRef = useRef(selectedNode);
  const audienceRef = useRef(audience);
  const activityRef = useRef(activity);
  const selectRef = useRef(onSelectNode);
  const anchorsRef = useRef(onAnchorsChange);

  useEffect(() => {
    selectedRef.current = selectedNode;
    controllerRef.current?.render();
  }, [selectedNode]);

  useEffect(() => {
    audienceRef.current = audience;
    controllerRef.current?.render();
  }, [audience]);

  useEffect(() => {
    activityRef.current = activity;
    controllerRef.current?.render();
  }, [activity]);

  useEffect(() => {
    selectRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    anchorsRef.current = onAnchorsChange;
    controllerRef.current?.render();
  }, [onAnchorsChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const controller = createIsometricRenderer(mount, {
      audience: () => audienceRef.current,
      selectedNode: () => selectedRef.current,
      activity: () => activityRef.current,
      selectNode: (node) => selectRef.current(node),
      anchorsChanged: () => anchorsRef.current
    });
    controllerRef.current = controller;

    return () => {
      controllerRef.current = null;
      controller.dispose();
    };
  }, []);

  return (
    <div className="isometric-stage" aria-label="Interactive iNaturalist to INQUIRE system map">
      <div className="scene-mount" ref={mountRef} />
    </div>
  );
}
