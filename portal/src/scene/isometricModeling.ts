import * as THREE from "three";
import type { AudienceKey, SceneNodeKey } from "../data/content";

type VectorTuple = [number, number, number];

export type StageMaterials = {
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial;
  imageGreen: THREE.MeshStandardMaterial;
  imageBlue: THREE.MeshStandardMaterial;
  imageGold: THREE.MeshStandardMaterial;
  success: THREE.MeshStandardMaterial;
  warning: THREE.MeshStandardMaterial;
  line: THREE.LineBasicMaterial;
};

export const nodeLayout: Record<SceneNodeKey, { x: number; z: number; height: number }> = {
  source: { x: -3.15, z: -1.1, height: 0.66 },
  ingest: { x: -1.55, z: -0.62, height: 0.88 },
  index: { x: 0, z: -0.1, height: 1.1 },
  search: { x: 1.55, z: 0.42, height: 0.82 },
  decision: { x: 3.05, z: 0.92, height: 0.96 }
};

export const audiencePalette: Record<AudienceKey, { accent: string; secondary: string; glow: string }> = {
  director: { accent: "#f95e10", secondary: "#b3a369", glow: "#ffe0c2" },
  researcher: { accent: "#216e4e", secondary: "#3e8f64", glow: "#d8f2df" },
  rse: { accent: "#004f9f", secondary: "#6d5f35", glow: "#dcecff" }
};

export function makeLabelTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  context.strokeStyle = "rgba(0, 48, 87, 0.2)";
  context.lineWidth = 6;
  context.beginPath();
  context.roundRect(14, 18, 484, 124, 28);
  context.fill();
  context.stroke();
  context.fillStyle = "#003057";
  context.font = "700 46px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 256, 82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export function assignNodeKey(object: THREE.Object3D, nodeKey: SceneNodeKey) {
  object.userData.nodeKey = nodeKey;
  object.traverse((child) => {
    child.userData.nodeKey = nodeKey;
  });
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item) => {
    const materialWithMap = item as THREE.Material & { map?: THREE.Texture };
    materialWithMap.map?.dispose();
    item.dispose();
  });
}

export function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
      if ("geometry" in object && object.geometry) {
        object.geometry.dispose();
      }
      disposeMaterial(object.material);
    }
  });
}

export function addEdgeLines(mesh: THREE.Mesh, color = 0x8e9a9c) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 })
  );
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  edges.scale.copy(mesh.scale);
  mesh.parent?.add(edges);
}

function addBox(
  parent: THREE.Group,
  size: VectorTuple,
  position: VectorTuple,
  material: THREE.MeshStandardMaterial,
  edgeColor = 0x8e9a9c,
  rotation?: VectorTuple
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) {
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  addEdgeLines(mesh, edgeColor);
  return mesh;
}

function addCylinder(
  parent: THREE.Group,
  geometry: THREE.BufferGeometry,
  position: VectorTuple,
  material: THREE.MeshStandardMaterial,
  rotation?: VectorTuple
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) {
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addLine(parent: THREE.Group, points: VectorTuple[], material: THREE.LineBasicMaterial) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((point) => new THREE.Vector3(point[0], point[1], point[2]))
  );
  const line = new THREE.Line(geometry, material);
  parent.add(line);
  return line;
}

export function addArrowHead(
  parent: THREE.Group,
  curve: THREE.CatmullRomCurve3,
  material: THREE.MeshStandardMaterial
) {
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.28, 24), material);
  const position = curve.getPoint(0.9);
  const tangent = curve.getTangent(0.9).normalize();
  arrow.position.copy(position);
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  arrow.castShadow = true;
  parent.add(arrow);
  return arrow;
}

function addPhotoCard(
  parent: THREE.Group,
  position: VectorTuple,
  rotationY: number,
  imageMaterial: THREE.MeshStandardMaterial,
  materials: StageMaterials
) {
  const card = new THREE.Group();
  card.position.set(position[0], position[1], position[2]);
  card.rotation.y = rotationY;
  parent.add(card);

  addBox(card, [0.78, 0.04, 0.52], [0, 0, 0], materials.paper, 0xaeb9b6);
  addBox(card, [0.56, 0.045, 0.28], [-0.05, 0.028, -0.04], imageMaterial, 0x8e9a9c);
  addBox(card, [0.16, 0.048, 0.08], [0.24, 0.031, 0.16], materials.accent, 0x8e9a9c);
  addBox(card, [0.28, 0.048, 0.045], [-0.2, 0.031, 0.18], materials.dark, 0x8e9a9c);
}

function addSourceStage(parent: THREE.Group, materials: StageMaterials) {
  addPhotoCard(parent, [-0.18, 0.34, -0.08], -0.18, materials.imageGreen, materials);
  addPhotoCard(parent, [0.02, 0.43, -0.2], -0.1, materials.imageBlue, materials);
  addPhotoCard(parent, [0.2, 0.52, -0.32], 0.04, materials.imageGold, materials);
  addBox(parent, [0.58, 0.06, 0.18], [-0.16, 0.34, 0.34], materials.dark, 0x5f6b6d);
  addCylinder(parent, new THREE.CylinderGeometry(0.08, 0.08, 0.04, 24), [0.3, 0.37, 0.34], materials.accent);
}

function addIngestStage(parent: THREE.Group, materials: StageMaterials) {
  addBox(parent, [1.2, 0.08, 0.4], [0, 0.36, 0], materials.dark, 0x5f6b6d);
  addBox(parent, [1.08, 0.05, 0.3], [0.04, 0.43, 0], materials.accent, 0x6f7b7c);
  [-0.42, 0, 0.42].forEach((x) => {
    addCylinder(
      parent,
      new THREE.CylinderGeometry(0.045, 0.045, 0.46, 18),
      [x, 0.48, 0],
      materials.paper,
      [Math.PI / 2, 0, 0]
    );
  });
  addCylinder(
    parent,
    new THREE.CylinderGeometry(0.38, 0.18, 0.36, 4),
    [-0.42, 0.8, 0],
    materials.glass,
    [0, Math.PI / 4, 0]
  );
  [-0.24, 0.08, 0.36].forEach((x, index) => {
    addBox(parent, [0.18, 0.18, 0.18], [x, 0.62, index === 1 ? -0.02 : 0.03], materials.paper, 0x9aa6a7);
  });
  addBox(parent, [0.4, 0.035, 0.06], [0.24, 0.56, -0.18], materials.warning, 0x9c8338);
  addCylinder(
    parent,
    new THREE.ConeGeometry(0.08, 0.2, 18),
    [0.52, 0.56, -0.18],
    materials.warning,
    [0, 0, -Math.PI / 2]
  );
}

function addIndexStage(parent: THREE.Group, materials: StageMaterials) {
  [0, 1, 2, 3].forEach((index) => {
    addCylinder(
      parent,
      new THREE.CylinderGeometry(0.38, 0.43, 0.13, 42),
      [-0.22, 0.36 + index * 0.16, -0.02],
      index === 3 ? materials.accent : materials.glass
    );
  });
  addBox(parent, [0.12, 0.58, 0.12], [-0.72, 0.62, -0.02], materials.dark, 0x5f6b6d);
  addBox(parent, [0.12, 0.58, 0.12], [0.28, 0.62, -0.02], materials.dark, 0x5f6b6d);

  const nodePositions: VectorTuple[] = [
    [0.32, 0.46, -0.32],
    [0.55, 0.6, -0.14],
    [0.42, 0.78, 0.1],
    [0.7, 0.92, 0.28],
    [0.18, 0.82, 0.32]
  ];
  addLine(parent, [nodePositions[0], nodePositions[1], nodePositions[2], nodePositions[3]], materials.line);
  addLine(parent, [nodePositions[0], nodePositions[4], nodePositions[2]], materials.line);
  nodePositions.forEach((position, index) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(index === 3 ? 0.075 : 0.06, 20, 14),
      index === 3 ? materials.accent : materials.paper
    );
    sphere.position.set(position[0], position[1], position[2]);
    sphere.castShadow = true;
    parent.add(sphere);
  });
}

function addSearchStage(parent: THREE.Group, materials: StageMaterials) {
  addBox(parent, [0.94, 0.66, 0.08], [-0.08, 0.72, 0], materials.glass, 0x8ea0a4, [-0.1, 0, 0]);
  addBox(parent, [0.62, 0.055, 0.045], [-0.2, 0.9, 0.08], materials.paper, 0xb9c1c2);
  [0.72, 0.61, 0.5].forEach((y, index) => {
    addBox(
      parent,
      [0.52 - index * 0.08, 0.035, 0.04],
      [-0.16, y, 0.09],
      index === 0 ? materials.accent : materials.paper,
      0xb9c1c2
    );
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.026, 16, 40), materials.accent);
  ring.position.set(0.28, 0.7, 0.13);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  parent.add(ring);
  addCylinder(
    parent,
    new THREE.CylinderGeometry(0.024, 0.024, 0.28, 14),
    [0.41, 0.56, 0.18],
    materials.accent,
    [0.78, 0, -0.72]
  );
  addBox(parent, [0.42, 0.06, 0.34], [-0.02, 0.34, 0.02], materials.dark, 0x5f6b6d);
}

function addReviewStage(parent: THREE.Group, materials: StageMaterials) {
  addBox(parent, [0.92, 0.72, 0.08], [-0.04, 0.76, 0], materials.glass, 0x8ea0a4, [-0.08, 0, 0]);
  [0.92, 0.76, 0.6].forEach((y, index) => {
    addBox(parent, [0.58, 0.045, 0.045], [-0.12, y, 0.09], materials.paper, 0xb9c1c2);
    addBox(
      parent,
      [0.09, 0.09, 0.045],
      [-0.48, y, 0.095],
      index === 2 ? materials.warning : materials.success,
      0x6a8c74
    );
  });
  addBox(parent, [0.12, 0.03, 0.045], [-0.49, 0.92, 0.14], materials.paper, 0x6a8c74, [0, 0, -0.6]);
  addBox(parent, [0.2, 0.03, 0.045], [-0.43, 0.96, 0.14], materials.paper, 0x6a8c74, [0, 0, 0.62]);
  addCylinder(parent, new THREE.TorusGeometry(0.2, 0.026, 16, 42), [0.32, 0.92, 0.1], materials.accent, [Math.PI / 2, 0, 0]);
  addBox(parent, [0.16, 0.42, 0.12], [-0.54, 0.44, -0.02], materials.dark, 0x5f6b6d);
  addBox(parent, [0.16, 0.42, 0.12], [0.46, 0.44, -0.02], materials.dark, 0x5f6b6d);
  addBox(parent, [1.08, 0.12, 0.14], [-0.04, 0.64, -0.02], materials.accent, 0x6f7b7c);
}

export function addStageModel(nodeKey: SceneNodeKey, parent: THREE.Group, materials: StageMaterials) {
  if (nodeKey === "source") {
    addSourceStage(parent, materials);
    return;
  }
  if (nodeKey === "ingest") {
    addIngestStage(parent, materials);
    return;
  }
  if (nodeKey === "index") {
    addIndexStage(parent, materials);
    return;
  }
  if (nodeKey === "search") {
    addSearchStage(parent, materials);
    return;
  }
  addReviewStage(parent, materials);
}

export function createStageMaterials(accentMaterial: THREE.MeshStandardMaterial): StageMaterials {
  return {
    accent: accentMaterial,
    glass: new THREE.MeshStandardMaterial({
      color: 0xdcecff,
      transparent: true,
      opacity: 0.68,
      roughness: 0.2,
      metalness: 0.05
    }),
    dark: new THREE.MeshStandardMaterial({ color: 0x003057, roughness: 0.5, metalness: 0.08 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf7f8f4, roughness: 0.64, metalness: 0.04 }),
    imageGreen: new THREE.MeshStandardMaterial({ color: 0x2f8f64, roughness: 0.5, metalness: 0.03 }),
    imageBlue: new THREE.MeshStandardMaterial({ color: 0x5ba6d8, roughness: 0.48, metalness: 0.04 }),
    imageGold: new THREE.MeshStandardMaterial({ color: 0xe5b85c, roughness: 0.5, metalness: 0.03 }),
    success: new THREE.MeshStandardMaterial({ color: 0x2f8f64, roughness: 0.42, metalness: 0.04 }),
    warning: new THREE.MeshStandardMaterial({ color: 0xf3c04d, roughness: 0.44, metalness: 0.04 }),
    line: new THREE.LineBasicMaterial({ color: 0x5f6b6d, transparent: true, opacity: 0.78 })
  };
}

export function createFlowCurves(): THREE.CatmullRomCurve3[] {
  return [
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(nodeLayout.source.x, 0.34, nodeLayout.source.z),
      new THREE.Vector3(-2.35, 0.64, -0.9),
      new THREE.Vector3(nodeLayout.ingest.x, 0.46, nodeLayout.ingest.z)
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(nodeLayout.ingest.x, 0.54, nodeLayout.ingest.z),
      new THREE.Vector3(-0.78, 0.76, -0.36),
      new THREE.Vector3(nodeLayout.index.x, 0.54, nodeLayout.index.z)
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(nodeLayout.index.x, 0.58, nodeLayout.index.z),
      new THREE.Vector3(0.78, 0.72, 0.14),
      new THREE.Vector3(nodeLayout.search.x, 0.52, nodeLayout.search.z)
    ]),
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(nodeLayout.search.x, 0.55, nodeLayout.search.z),
      new THREE.Vector3(2.32, 0.82, 0.68),
      new THREE.Vector3(nodeLayout.decision.x, 0.6, nodeLayout.decision.z)
    ])
  ];
}
