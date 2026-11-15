import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map();

function loadGltf(url) {
  if (!cache.has(url)) {
    cache.set(url, new Promise((resolve, reject) => {
      loader.load(url, resolve, undefined, () => reject(new Error(`Could not load ${url}`)));
    }));
  }
  return cache.get(url);
}

const boxOf = (object) => new THREE.Box3().setFromObject(object);

// Fit an imported model into the space the procedural part occupied, so a Blender export
// lines up with the rest of the build no matter what scale or origin it was authored at.
function fitInto(root, target, rotationDeg) {
  const pivot = new THREE.Group();
  const model = root.clone(true);
  if (rotationDeg) model.rotation.set(...rotationDeg.map((d) => (d * Math.PI) / 180));
  model.updateMatrixWorld(true);
  const source = boxOf(model).getSize(new THREE.Vector3());
  const targetSize = target.getSize(new THREE.Vector3());
  const ratios = ['x', 'y', 'z'].map((axis) => (source[axis] > 0 ? targetSize[axis] / source[axis] : 1));
  const scale = ratios.reduce((a, b) => a + b, 0) / 3;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const fitted = boxOf(model);
  const targetCenter = target.getCenter(new THREE.Vector3());
  const fittedCenter = fitted.getCenter(new THREE.Vector3());
  model.position.add(targetCenter.sub(fittedCenter));
  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  pivot.add(model);
  return pivot;
}

// parts: [{ part, box }] — each has a model_url pointing at a .glb/.gltf of that exact product
export async function loadImportedModels(parts) {
  const group = new THREE.Group();
  const loaded = await Promise.allSettled(parts.map(async ({ part, box }) => {
    const gltf = await loadGltf(part.model_url);
    const rotation = Array.isArray(part.model_rotation) ? part.model_rotation : part.model_rotation ? [0, part.model_rotation, 0] : [0, 0, 0];
    return fitInto(gltf.scene, box, rotation);
  }));
  loaded.forEach((entry) => { if (entry.status === 'fulfilled') group.add(entry.value); });
  return group;
}