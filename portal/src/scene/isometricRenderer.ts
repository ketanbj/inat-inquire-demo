import * as THREE from "three";
import type { SceneNodeKey } from "../data/content";
import { sceneNodes } from "../data/content";
import {
  addArrowHead,
  addEdgeLines,
  addStageModel,
  assignNodeKey,
  audiencePalette,
  createFlowCurves,
  createStageMaterials,
  disposeScene,
  makeLabelTexture,
  nodeLayout
} from "./isometricModeling";
import type { IsometricSceneController, IsometricSceneState, SceneAnchorMap } from "./isometricTypes";

type NodeRecord = {
  group: THREE.Group;
  platformMaterial: THREE.MeshStandardMaterial;
  accentMaterial: THREE.MeshStandardMaterial;
};

export function createIsometricRenderer(
  mountElement: HTMLDivElement,
  state: IsometricSceneState
): IsometricSceneController {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mountElement.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(7.5, 6.6, 8.2);
  camera.lookAt(0, 0.35, 0.4);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(3, 7, 4);
  keyLight.castShadow = true;
  scene.add(ambient, keyLight);

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xf7f8f4,
    roughness: 0.72,
    metalness: 0.06
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.22, 6.7), baseMaterial);
  base.position.y = -0.13;
  base.receiveShadow = true;
  root.add(base);
  addEdgeLines(base, 0xaeb9b6);

  const grid = new THREE.GridHelper(9.2, 9, 0xb3a369, 0xd6dbd4);
  grid.position.y = 0.01;
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  root.add(grid);

  const hitTargets: THREE.Object3D[] = [];
  const nodeRecords = new Map<SceneNodeKey, NodeRecord>();

  sceneNodes.forEach((node) => {
    const layout = nodeLayout[node.key];
    const group = new THREE.Group();
    group.position.set(layout.x, 0.08, layout.z);
    assignNodeKey(group, node.key);

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.58,
      metalness: 0.08
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: audiencePalette[state.audience()].secondary,
      roughness: 0.42,
      metalness: 0.14
    });
    const stageMaterials = createStageMaterials(accentMaterial);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.18, 1.04), platformMaterial);
    platform.position.y = 0.08;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);
    addEdgeLines(platform, 0xb5bfbd);

    addStageModel(node.key, group, stageMaterials);

    const markerHeight = Math.min(layout.height, 0.36);
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, markerHeight, 24),
      accentMaterial
    );
    marker.position.set(0.46, 0.28 + markerHeight / 2, -0.36);
    marker.castShadow = true;
    group.add(marker);

    const labelTexture = makeLabelTexture(node.shortLabel);
    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthTest: false })
    );
    label.position.set(0, 1.28, 0);
    label.scale.set(1.14, 0.36, 1);
    group.add(label);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 1.6, 1.24),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitbox.position.y = 0.74;
    assignNodeKey(hitbox, node.key);
    group.add(hitbox);
    hitTargets.push(hitbox);

    root.add(group);
    nodeRecords.set(node.key, { group, platformMaterial, accentMaterial });
  });

  const figure = new THREE.Group();
  figure.position.set(-0.58, 0.14, 0.38);
  const figureMaterial = new THREE.MeshStandardMaterial({
    color: audiencePalette[state.audience()].accent,
    roughness: 0.36,
    metalness: 0.12
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x003057, roughness: 0.44 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 20), darkMaterial);
  head.position.y = 1.13;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.58, 28), figureMaterial);
  body.position.y = 0.72;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.58, 12), darkMaterial);
  arm.position.set(0.26, 0.76, -0.08);
  arm.rotation.z = 1.08;
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.04), darkMaterial);
  tablet.position.set(0.48, 0.77, -0.14);
  tablet.rotation.y = -0.55;
  figure.add(head, body, arm, tablet);
  root.add(figure);

  const curves = createFlowCurves();
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: audiencePalette[state.audience()].accent,
    emissive: audiencePalette[state.audience()].glow,
    emissiveIntensity: 0.18,
    roughness: 0.52
  });
  curves.forEach((curve) => {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 34, 0.025, 10, false), pathMaterial);
    tube.castShadow = false;
    root.add(tube);
    addArrowHead(root, curve, pathMaterial);
  });

  const particleMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: audiencePalette[state.audience()].accent,
    emissiveIntensity: 0.55,
    roughness: 0.28
  });
  const particles = curves.flatMap((curve, curveIndex) =>
    [0, 0.34, 0.68].map((offset) => {
      const particle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 12), particleMaterial);
      particle.userData.curveIndex = curveIndex;
      particle.userData.offset = offset;
      root.add(particle);
      return particle;
    })
  );

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hoverRef = { current: null as SceneNodeKey | null };
  const activeColor = new THREE.Color();
  const secondaryColor = new THREE.Color();
  const neutralColor = new THREE.Color(0xffffff);
  const anchorVector = new THREE.Vector3();

  function updateAnchors() {
    const onAnchorsChange = state.anchorsChanged();
    if (!onAnchorsChange) {
      return;
    }

    const canvasRect = renderer.domElement.getBoundingClientRect();
    const mountRect = mountElement.getBoundingClientRect();
    const anchors: SceneAnchorMap = {};
    nodeRecords.forEach((record, key) => {
      anchorVector.set(0, 1.48, 0);
      record.group.localToWorld(anchorVector);
      anchorVector.project(camera);
      anchors[key] = {
        x: (anchorVector.x * 0.5 + 0.5) * canvasRect.width + canvasRect.left - mountRect.left,
        y: (-anchorVector.y * 0.5 + 0.5) * canvasRect.height + canvasRect.top - mountRect.top
      };
    });
    onAnchorsChange(anchors);
  }

  function syncSceneState() {
    const palette = audiencePalette[state.audience()];
    activeColor.set(palette.accent);
    secondaryColor.set(palette.secondary);

    root.rotation.x = 0;
    root.rotation.y = Math.PI / 4;
    figure.position.y = 0.14;
    figureMaterial.color.copy(activeColor);
    pathMaterial.color.copy(activeColor);
    pathMaterial.emissive.set(palette.glow);
    particleMaterial.emissive.copy(activeColor);

    nodeRecords.forEach((record, key) => {
      const selected = state.selectedNode() === key;
      const hovered = hoverRef.current === key;
      const active =
        (state.activity() === "ingesting" && (key === "source" || key === "ingest" || key === "index")) ||
        (state.activity() === "searching" && (key === "index" || key === "search")) ||
        (state.activity() === "reviewing" && (key === "search" || key === "decision")) ||
        (state.activity() === "comparing" && key === "decision");
      const targetScale = selected ? 1.13 : hovered ? 1.07 : active ? 1.04 : 1;
      record.group.scale.setScalar(targetScale);
      record.platformMaterial.color.copy(selected ? activeColor : neutralColor);
      record.accentMaterial.color.copy(selected || hovered || active ? activeColor : secondaryColor);
    });

    particles.forEach((particle) => {
      const curve = curves[Number(particle.userData.curveIndex)];
      const offset = Number(particle.userData.offset);
      particle.position.copy(curve.getPoint(offset));
    });
  }

  function renderScene(updateAnchorPositions = true) {
    syncSceneState();
    renderer.render(scene, camera);
    if (updateAnchorPositions) {
      updateAnchors();
    }
  }

  function resize() {
    const width = Math.max(mountElement.clientWidth, 320);
    const height = Math.max(mountElement.clientHeight, 320);
    const aspect = width / height;
    const frustum = width < 480 ? 13.6 : width < 640 ? 10.8 : 7.8;
    camera.left = (-frustum * aspect) / 2;
    camera.right = (frustum * aspect) / 2;
    camera.top = frustum / 2;
    camera.bottom = -frustum / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderScene();
  }

  function intersectNode(event: PointerEvent): SceneNodeKey | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitTargets, false)[0];
    return (hit?.object.userData.nodeKey as SceneNodeKey | undefined) || null;
  }

  function handlePointerMove(event: PointerEvent) {
    const hoveredNode = intersectNode(event);
    if (hoverRef.current === hoveredNode) {
      return;
    }
    hoverRef.current = hoveredNode;
    renderer.domElement.style.cursor = hoverRef.current ? "pointer" : "default";
    renderScene(false);
  }

  function handlePointerLeave() {
    const hadHover = hoverRef.current !== null;
    hoverRef.current = null;
    renderer.domElement.style.cursor = "default";
    if (hadHover) {
      renderScene(false);
    }
  }

  function handlePointerDown(event: PointerEvent) {
    const node = intersectNode(event);
    if (node) {
      state.selectNode(node);
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mountElement);
  resize();

  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
  renderer.domElement.addEventListener("pointerdown", handlePointerDown);

  return {
    render: renderScene,
    dispose() {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
