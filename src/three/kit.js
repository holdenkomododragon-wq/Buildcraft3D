import * as THREE from 'three';

// millimetres -> scene units (metres)
export const mm = (v) => v / 1000;

export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.6, ...o });

// ── surface shaders ──────────────────────────────────────────────────────────
// Fine brushed streaks in the roughness channel: anodised aluminium and painted steel
// get a directional highlight instead of one flat gloss.
let brushedTex = null;
function brushedRoughness() {
  if (brushedTex) return brushedTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g2 = c.getContext('2d');
  g2.fillStyle = '#c9c9c9';
  g2.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const y = Math.random() * 256;
    const v = 150 + Math.random() * 90;
    g2.strokeStyle = `rgba(${v},${v},${v},0.55)`;
    g2.lineWidth = 1;
    g2.beginPath();
    g2.moveTo(0, y);
    g2.lineTo(256, y + (Math.random() * 2 - 1));
    g2.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  brushedTex = t;
  return t;
}

// metals: full metalness, low roughness, reflections from the scene environment
export const metalMat = (color, o = {}) => {
  const { brushed = true, ...rest } = o;
  return new THREE.MeshStandardMaterial({
    color, metalness: 1, roughness: 0.34, envMapIntensity: 1.35,
    roughnessMap: brushed ? brushedRoughness() : null, ...rest,
  });
};

// plastics: dielectric base with a clear lacquer coat on top
export const plasticMat = (color, o = {}) => new THREE.MeshPhysicalMaterial({
  color, metalness: 0, roughness: 0.56, clearcoat: 0.55, clearcoatRoughness: 0.42, envMapIntensity: 0.9, ...o,
});

// tempered glass: near-mirror reflections, barely any body tint
export const glassMat = (color = 0x9db4d0, o = {}) => new THREE.MeshPhysicalMaterial({
  color, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.1, ior: 1.52,
  clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.7, side: THREE.DoubleSide, depthWrite: false, ...o,
});

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(mm(w), mm(h), mm(d)), mat);
  m.position.set(mm(x), mm(y), mm(z));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cyl(r, h, mat, x = 0, y = 0, z = 0, axis = 'y', rt = r, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(mm(rt), mm(r), mm(h), seg), mat);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.position.set(mm(x), mm(y), mm(z));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function ring(r, thick, mat, x = 0, y = 0, z = 0, axis = 'z', seg = 40) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(mm(r), mm(thick), 6, seg), mat);
  if (axis === 'x') t.rotation.y = Math.PI / 2;
  if (axis === 'y') t.rotation.x = Math.PI / 2;
  t.position.set(mm(x), mm(y), mm(z));
  t.castShadow = true;
  return t;
}

export function plane(w, h, mat, x = 0, y = 0, z = 0, face = 'z') {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(mm(w), mm(h)), mat);
  if (face === 'x') p.rotation.y = Math.PI / 2;
  if (face === '-x') p.rotation.y = -Math.PI / 2;
  if (face === 'y') p.rotation.x = -Math.PI / 2;
  if (face === '-y') p.rotation.x = Math.PI / 2;
  p.position.set(mm(x), mm(y), mm(z));
  p.receiveShadow = true;
  return p;
}

// repeated thin plates (cooler fins, heatsink ridges) as one instanced draw
export function stack(mat, count, dims, gap, axis = 'y') {
  const [w, h, d] = dims;
  const geo = new THREE.BoxGeometry(mm(w), mm(h), mm(d));
  const im = new THREE.InstancedMesh(geo, mat, count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const p = mm(i * gap);
    o.position.set(axis === 'x' ? p : 0, axis === 'y' ? p : 0, axis === 'z' ? p : 0);
    o.updateMatrix();
    im.setMatrixAt(i, o.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  im.castShadow = true;
  im.receiveShadow = true;
  im.frustumCulled = false;
  return im;
}

export function tube(points, mat, r = 4, seg = 40) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(mm(p[0]), mm(p[1]), mm(p[2]))));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, mm(r), 8), mat);
  m.castShadow = true;
  return m;
}

export function rgbMat(ctx, intensity = 1.6) {
  const m = new THREE.MeshStandardMaterial({
    color: 0x060608, emissive: new THREE.Color(ctx.rgbColor), emissiveIntensity: intensity, roughness: 0.35,
  });
  ctx.rgb.push({ mat: m, phase: ctx.rgb.length * 0.07 });
  return m;
}

let meshTex = null;
function meshTexture() {
  if (meshTex) return meshTex;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g2 = c.getContext('2d');
  g2.strokeStyle = '#ffffff';
  g2.lineWidth = 4.6;
  g2.beginPath();
  for (let i = -32; i <= 64; i += 8) {
    g2.moveTo(i, 0);
    g2.lineTo(i + 32, 32);
    g2.moveTo(i, 32);
    g2.lineTo(i + 32, 0);
  }
  g2.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  meshTex = t;
  return t;
}

// perforated / dust-filter panel material
export function meshMat(color = 0x30373f, repeat = 22) {
  const tex = meshTexture();
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return new THREE.MeshStandardMaterial({
    color, map: t, alphaTest: 0.45, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide,
  });
}

// ── axial fan ────────────────────────────────────────────────────────────────
export function makeFan(size, ctx, opts = {}) {
  const { rgb = false, frame = true, depth = 25, frameColor, bladeColor } = opts;
  const m = ctx.m;
  const frameMat = frameColor == null ? m.fanFrame : std(frameColor, { roughness: 0.62 });
  const bladeMat = bladeColor == null ? m.blade : std(bladeColor, { metalness: 0.2, roughness: 0.5 });
  const g = new THREE.Group();
  const t = depth;
  if (frame) {
    const b = Math.max(4, size * 0.05);
    g.add(box(size, b, t, frameMat, 0, size / 2 - b / 2, 0));
    g.add(box(size, b, t, frameMat, 0, -size / 2 + b / 2, 0));
    g.add(box(b, size - 2 * b, t, frameMat, size / 2 - b / 2, 0, 0));
    g.add(box(b, size - 2 * b, t, frameMat, -size / 2 + b / 2, 0, 0));
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, c]) =>
      g.add(cyl(3.2, t + 0.8, frameMat, a * (size / 2 - 5.5), c * (size / 2 - 5.5), 0, 'z', 3.2, 10)));
    g.add(ring(size * 0.4, 1.6, frameMat, 0, 0, t / 2 - 2.4));
    g.add(ring(size * 0.4, 1.2, frameMat, 0, 0, -t / 2 + 2.4));
  }
  g.add(cyl(size * 0.19, t * 0.6, m.fanHub, 0, 0, 0, 'z', size * 0.19, 26));
  g.add(cyl(size * 0.16, 1.4, m.fanCap, 0, 0, t * 0.3, 'z', size * 0.16, 26));
  const blades = new THREE.Group();
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-mm(size * 0.065), mm(size * 0.12));
  bladeShape.bezierCurveTo(-mm(size * 0.04), mm(size * 0.22), mm(size * 0.005), mm(size * 0.37), mm(size * 0.105), mm(size * 0.43));
  bladeShape.bezierCurveTo(mm(size * 0.145), mm(size * 0.455), mm(size * 0.17), mm(size * 0.42), mm(size * 0.13), mm(size * 0.37));
  bladeShape.bezierCurveTo(mm(size * 0.075), mm(size * 0.29), mm(size * 0.035), mm(size * 0.19), mm(size * 0.018), mm(size * 0.12));
  bladeShape.bezierCurveTo(-mm(size * 0.008), mm(size * 0.08), -mm(size * 0.045), mm(size * 0.085), -mm(size * 0.065), mm(size * 0.12));
  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, { depth: mm(1.3), bevelEnabled: false, steps: 1 });
  for (let i = 0; i < 9; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / 9) * Math.PI * 2;
    const bl = new THREE.Mesh(bladeGeometry, bladeMat);
    bl.position.z = -mm(0.65);
    bl.castShadow = true;
    bl.receiveShadow = true;
    pivot.add(bl);
    blades.add(pivot);
  }
  g.add(blades);
  ctx.fans.push({ blades });
  if (rgb) g.add(ring(size * 0.435, 1.6, rgbMat(ctx, 2.1), 0, 0, t / 2 + 0.5));
  return g;
}

export function placeFan(parent, size, ctx, opts, x, y, z, axis = 'z') {
  const f = makeFan(size, ctx, opts);
  if (axis === 'x') f.rotation.y = Math.PI / 2;
  if (axis === '-x') f.rotation.y = -Math.PI / 2;
  if (axis === 'y') f.rotation.x = -Math.PI / 2;
  if (axis === '-y') f.rotation.x = Math.PI / 2;
  f.position.set(mm(x), mm(y), mm(z));
  parent.add(f);
  return f;
}