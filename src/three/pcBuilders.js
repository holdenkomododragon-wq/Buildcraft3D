import * as THREE from 'three';
import { mm, box, std, metalMat, plasticMat, glassMat, placeFan, rgbMat } from './kit';
import { partHex, accentHex, shade } from './finish';
import { buildCaseShell } from './parts/caseShell';
import { addMotherboard } from './parts/motherboard';
import { addGpu } from './parts/gpu';
import { addCooler } from './parts/cooler';
import { addRam, addStorage, addPsu, addCables } from './parts/internals';

export { box, cyl, mm, rgbMat } from './kit';

const FORMS = { ATX: [305, 244], mATX: [244, 244], 'Micro-ATX': [244, 244], 'Mini-ITX': [170, 170], ITX: [170, 170], 'E-ATX': [330, 305] };
const first = (r, k) => r[k]?.[0];
const expand = (list = []) => list.flatMap((it) => Array.from({ length: it.qty || 1 }, () => it));

function caseMats(ghost, casePart) {
  const fade = ghost ? { transparent: true, depthWrite: false } : {};
  // the real chassis finish: painted steel panels, slightly darker frame, dark interior
  const base = partHex(casePart, 0x2c3138);
  const mid = shade(base, 0.8);
  const inner = shade(base, 0.55);
  const accent = accentHex(casePart);
  return {
    shell: metalMat(ghost ? 0x7f8b9c : base, { roughness: 0.42, ...fade, opacity: ghost ? 0.42 : 1 }),
    shellDark: metalMat(ghost ? 0x5d6878 : mid, { roughness: 0.5, ...fade, opacity: ghost ? 0.34 : 1 }),
    tray: metalMat(ghost ? 0x6c7788 : inner, { roughness: 0.62, brushed: false, ...fade, opacity: ghost ? 0.3 : 1 }),
    accent: accent == null ? null : plasticMat(accent, { roughness: 0.62, clearcoat: 0.3 }),
    grommet: std(0x0b0e11, { roughness: 0.94, metalness: 0 }),
    front: glassMat(0x93a0b1, { opacity: 0.14 }),
    glass: glassMat(),
    plastic: plasticMat(0x1c2026, { roughness: 0.64 }),
    psu: metalMat(0x23272e, { roughness: 0.38 }),
    sleeve: plasticMat(0x14171c, { roughness: 0.9, clearcoat: 0.12 }),
    label: plasticMat(0xd6dae2, { roughness: 0.7, clearcoat: 0.2 }),
    tube: plasticMat(0x0f1216, { roughness: 0.86 }),
    wireAccent: std(0x642b32, { roughness: 0.58, metalness: 0.08 }),
    fanFrame: plasticMat(0x1d2128, { roughness: 0.6 }),
    fanHub: plasticMat(0x13161b, { roughness: 0.55 }),
    fanCap: plasticMat(0x2a3039, { roughness: 0.5 }),
    blade: plasticMat(0x7c8694, { roughness: 0.45, clearcoat: 0.7 }),
    pcb: std(0x0b0e12, { roughness: 0.8, metalness: 0.05 }),
    darkMetal: metalMat(0x323844, { roughness: 0.34 }),
    metal: metalMat(0xc6ccd6, { roughness: 0.18, envMapIntensity: 1.6 }),
    aluminum: metalMat(0x9aa3b0, { roughness: 0.32 }),
    copper: metalMat(0xb9733a, { roughness: 0.28 }),
    gold: metalMat(0xd9b65e, { roughness: 0.22 }),
    slot: std(0x0f1216, { roughness: 0.75, metalness: 0.1 }),
    slotAlt: plasticMat(0x29303f, { roughness: 0.7 }),
    socket: std(0x1a1f26, { roughness: 0.7, metalness: 0.1 }),
    cap: metalMat(0x8b93a1, { roughness: 0.4 }),
    plug: plasticMat(0x14171c, { roughness: 0.72, clearcoat: 0.3 }),
    header: plasticMat(0xe7e9ee, { roughness: 0.62 }),
    port: metalMat(0x8b93a1, { roughness: 0.42 }),
    portInner: std(0x05060a, { roughness: 0.9, metalness: 0 }),
  };
}

export const IMPORTABLE = ['case', 'cpu', 'motherboard', 'gpu', 'cooler', 'psu'];

export function buildPC(r, s, opts = {}) {
  const skip = opts.skip || new Set();
  const ctx = {
    fans: [], rgb: [], rgbColor: s.rgbColor || '#00cc66',
    // user-picked 3D finishes; an empty string keeps the product's own colour
    colors: { gpu: '', cpu: '', ram: '', motherboard: '', ...(s.componentColors || {}) },
  };
  const boxes = {};
  const caseItem = first(r, 'case');
  const cs = caseItem?.part.specs || {};
  const ghost = !caseItem;
  const { l = 470, h = 470, w = 235 } = cs.dims_mm || {};
  const Y0 = 12;
  const m = caseMats(ghost, caseItem?.part);
  ctx.m = m;

  const g = new THREE.Group();
  const x0 = -l / 2;
  const x1 = l / 2;
  const z0 = -w / 2;
  const z1 = w / 2;

  // ── frame: board on the tray wall, everything grows toward the glass (+z)
  const mbItem = first(r, 'motherboard');
  const [bw, bh] = FORMS[mbItem?.part.specs?.form_factor] || FORMS.ATX;
  const kx = bw / 305;
  const ky = bh / 244;
  const xRear = x0 + 24;
  const zBoard = z0 + 30;
  const yBoard = Math.max(Y0 + 62, Math.min(Y0 + 116, Y0 + h - bh - 44));
  const board = { xRear, y0: yBoard, bw, bh, z: zBoard, kx, ky };
  const socket = { x: xRear + 90 * kx, y: yBoard + 175 * ky, z: zBoard };
  const power = {
    atx24: { x: xRear + 296 * kx, y: yBoard + 150 * ky, z: zBoard + 32.5 },
    eps8: { x: xRear + 87 * kx, y: yBoard + 263 * ky, z: zBoard + 7.5 },
  };
  const slotY = yBoard + 88 * ky;
  const gpuRearX = x0 + 18;

  const F = {
    l, h, w, Y0, ghost, m, x0, x1, z0, z1, board, socket, power, caseSpecs: cs, gpuRearX, slotY,
    shroudTop: Y0 + 108, shroudFront: x1 - 74, shroudBack: x0 + 190,
  };

  // every category that can be replaced by an imported model is built into its own group,
  // so the imported .glb can be fitted into exactly the space the provisional model occupies
  const section = (key, build) => {
    if (skip.has(key)) return null;
    const grp = new THREE.Group();
    g.add(grp);
    build(grp);
    const measure = new THREE.Box3().setFromObject(grp);
    if (!measure.isEmpty()) boxes[key] = measure;
    return grp;
  };

  let glass = null;
  section('case', (grp) => { glass = buildCaseShell(grp, ctx, F); });

  if (mbItem) section('motherboard', (grp) => addMotherboard(grp, ctx, F, mbItem));
  if (r.ram?.length) addRam(g, ctx, F, r.ram);
  let gpuPower = [];
  if (r.gpu?.length) section('gpu', (grp) => { gpuPower = addGpu(grp, ctx, F, first(r, 'gpu')); });
  let occ = { front: false, top: false };
  if (r.cooler?.length) section('cooler', (grp) => { occ = addCooler(grp, ctx, F, r.cooler[0]); });
  if (r.storage?.length) addStorage(g, ctx, F, r.storage);
  let psu = null;
  if (r.psu?.length) section('psu', (grp) => { psu = addPsu(grp, ctx, F, first(r, 'psu')); });
  addCables(g, ctx, F, psu, gpuPower);

  // rear exhaust fan above the card
  placeFan(g, 120, ctx, { rgb: false }, x0 + 24, Y0 + h - 104, 0, 'x');

  // user fans fill the free front and roof mounts
  const fanList = expand(r.fan);
  if (fanList.length) {
    const spots = [];
    if (!occ.front) [0, 1, 2].forEach((k) => spots.push({ x: x1 - 32, y: Y0 + h / 2 + (1 - k) * 122, z: 0, a: 'x' }));
    if (!occ.top) [0, 1].forEach((k) => spots.push({ x: socket.x + 50 + k * 122, y: Y0 + h - 30, z: 0, a: 'y' }));
    fanList.slice(0, spots.length).forEach((it, i) => {
      const sp = spots[i];
      placeFan(g, it.part.specs?.size_mm || 120, ctx, {
        rgb: !!it.part.specs?.rgb,
        frameColor: partHex(it.part, 0x1d2128),
        bladeColor: accentHex(it.part, partHex(it.part, 0x7c8694)),
      }, sp.x, sp.y, sp.z, sp.a);
    });
  }

  // interior light strip along the rail
  g.add(box(l * 0.46, 2, 3, rgbMat(ctx, 1.1), x0 + 170, Y0 + h - 15, z0 + 20));

  g.userData.caseDims = { l, h, w };
  return { group: g, fans: ctx.fans, rgb: ctx.rgb, glass, boxes, interiorY: Y0 + h * 0.52 };
}