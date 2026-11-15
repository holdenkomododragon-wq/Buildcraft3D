import { box, ring, tube, rgbMat, metalMat, placeFan } from '../kit';
import { partHex, accentHex, shade } from '../finish';
import { modularPanel } from './hardware';

// ── memory ───────────────────────────────────────────────────────────────────
export function addRam(g, ctx, F, list) {
  const m = ctx.m;
  const { board } = F;
  const { xRear, y0, z, kx, ky } = board;
  const sticks = [];
  list.forEach((it) => {
    const n = (it.part.specs?.modules || 1) * (it.qty || 1);
    for (let i = 0; i < n; i++) sticks.push(it);
  });
  const order = sticks.length <= 1 ? [1] : sticks.length === 2 ? [1, 3] : [0, 1, 2, 3];
  sticks.slice(0, 4).forEach((it, i) => {
    // heatspreader in the kit's real finish (black, silver, white…)
    const spreader = metalMat(ctx.colors?.ram || partHex(it.part, 0x2b2f36), { roughness: 0.38 });
    const x = xRear + (132 + (order[i] ?? i) * 8.7) * kx;
    const y = y0 + 178 * ky;
    const tall = 128 * ky;
    g.add(box(3.6, tall, 30, m.pcb, x, y, z + 15));
    g.add(box(6.2, tall - 6, 32, m.darkMetal, x, y, z + 16));
    g.add(box(6.6, 26 * ky, 33, spreader, x, y + tall / 2 - 16 * ky, z + 16.5));
    g.add(box(6.6, 22 * ky, 33, spreader, x, y - tall / 2 + 14 * ky, z + 16.5));
    g.add(box(5, 7, 31, it.part.specs?.rgb ? rgbMat(ctx, 2) : m.label, x, y + tall / 2 + 3, z + 16));
    g.add(box(4, 8, 26, m.gold, x, y - tall / 2 - 3, z + 15));
    // slot latches top and bottom, the tabs that click the stick into place
    [-1, 1].forEach((sgn) => g.add(box(9, 6, 10, m.slotAlt, x, y + sgn * (tall / 2 + 4), z + 5)));
  });
}

// ── NVMe drives under the heatsinks / SATA drives in the basement ────────────
export function addStorage(g, ctx, F, list) {
  const m = ctx.m;
  const { board, Y0, w } = F;
  const { xRear, y0, z, kx, ky } = board;
  let nv = 0;
  let sata = 0;
  list.forEach((it) => {
    const t = it.part.specs?.type;
    if (t === 'nvme') {
      const x = xRear + (168 + nv * 84) * kx;
      if (nv < 2) {
        g.add(box(72, 21, 5, m.pcb, x, y0 + 122 * ky, z + 3));
        g.add(box(74, 23, 4, m.metal, x, y0 + 122 * ky, z + 7));
        g.add(box(4, 16, 3, m.gold, x - 38, y0 + 122 * ky, z + 2));
      }
      nv += 1;
    } else {
      const big = t === 'hdd';
      g.add(box(big ? 147 : 100, big ? 26 : 8, big ? 101 : 70, m.darkMetal,
        -board.xRear * 0 + (F.x0 + 120 + sata * 46), Y0 + 60 + (big ? 20 : 6), -40 + sata * 12));
      sata += 1;
    }
  });
}

// ── power supply, exposed at the rear of the basement ────────────────────────
export function addPsu(g, ctx, F, item) {
  const m = ctx.m;
  const { x0, Y0 } = F;
  const pl = Math.min(item.part.specs?.length_mm || 160, 200);
  const px = x0 + 20 + pl / 2;
  const py = Y0 + 4 + 43;
  // painted steel housing with the fan grille and modular socket block at the rear
  const shell = metalMat(partHex(item.part, 0x23272e), { roughness: 0.4 });
  const shellDark = metalMat(shade(partHex(item.part, 0x23272e), 0.72), { roughness: 0.52 });
  g.add(box(pl, 86, 150, shell, px, py, 0));
  g.add(box(3, 62, 122, shellDark, px + pl / 2, py, 0));
  const modularX = px + pl / 2 + 1.5;
  const outputs = modularPanel(g, m, { x: modularX, y: py, z: 0 });
  g.add(box(pl * 0.58, 16, 2, m.label, px, py + 32, 75.5));
  placeFan(g, 108, ctx, { frame: false, depth: 14, frameColor: m.darkMetal, bladeColor: m.blade }, px, py - 22, 83, 'z');
  g.add(ring(55, 1.4, m.metal, px, py - 22, 91));
  g.add(tube([[px - 49, py - 71, 91.5], [px + 49, py + 27, 91.5]], m.metal, 1.1));
  g.add(tube([[px - 49, py + 27, 91.5], [px + 49, py - 71, 91.5]], m.metal, 1.1));
  [[-49, -49], [-49, 49], [49, -49], [49, 49]].forEach(([dx, dy]) =>
    g.add(ring(3, 1, m.metal, px + dx, py - 22 + dy, 91.5, 'z', 12)));
  g.add(box(2, 26, 34, m.darkMetal, x0 + 19, py + 14, 38));
  g.add(box(2, 13, 13, m.metal, x0 + 19, py - 26, 44));
  return { x: px, y: py, z: 0, outputs, front: modularX };
}

// ── sleeved cables from actual PSU outputs to the component plug exits ───────
export function addCables(g, ctx, F, psu, gpuPower = []) {
  const m = ctx.m;
  const { board, power } = F;
  if (!psu) return;
  const route = (source, target, radius) => {
    const trayZ = Math.min(source.z, target.z, board.z - 18);
    const path = [
      [source.x, source.y, source.z],
      [source.x + 28, source.y + 12, trayZ],
      [target.x - 26, target.y + 24, trayZ],
      [target.x, target.y, target.z],
    ];
    const strandCount = radius >= 4 ? 12 : 8;
    const wireMaterials = [m.sleeve, m.darkMetal, m.sleeve, m.wireAccent];
    for (let i = 0; i < strandCount; i++) {
      const angle = (i / strandCount) * Math.PI * 2;
      const offsetX = Math.cos(angle) * radius * 0.64;
      const offsetZ = Math.sin(angle) * radius * 0.64;
      const points = path.map(([x, y, z], index) => {
        const taper = index === 0 || index === path.length - 1 ? 0.18 : 1;
        return [x + offsetX * taper, y, z + offsetZ * taper];
      });
      g.add(tube(points, wireMaterials[i % wireMaterials.length], 0.72, 22));
    }
  };
  if (power?.atx24 && psu.outputs[0]) route(psu.outputs[0], power.atx24, 4);
  if (power?.eps8 && psu.outputs[1]) route(psu.outputs[1], power.eps8, 3.5);
  gpuPower.forEach((target, i) => {
    const source = psu.outputs[2 + Math.min(i, 1)];
    if (source) route(source, target, 3.5);
  });
}