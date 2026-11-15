import * as THREE from 'three';
import { box, cyl, mm, rgbMat } from './pcBuilders';
import { partHex, accentHex, shade } from './finish';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.6, ...o });
const DESK_Y = 740;

export function buildSetup(r, s) {
  const ctx = { rgb: [], rgbColor: s.rgbColor || '#ff2a85' };
  const m = {
    ghost: std(0x7c889a, { transparent: true, opacity: 0.45 }),
    dark: std(0x343a44),
    metal: std(0xbfc5d0, { metalness: 0.8, roughness: 0.35 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b1320, emissive: new THREE.Color(0x2b5099), emissiveIntensity: 1.05, roughness: 0.18 }),
    wall: std(0x1c1f26, { roughness: 1, metalness: 0 }),
  };
  const g = new THREE.Group();
  const deskItem = r.desk?.[0];
  const dw = deskItem?.part.specs.width_mm || 1400;
  const dd = deskItem?.part.specs.depth_mm || 700;
  // the desk's real surface finish, with edge banding a shade darker
  const deskMat = deskItem ? std(partHex(deskItem.part, 0x6b5136), { roughness: 0.56, metalness: 0.04 }) : m.ghost;
  const deskEdge = deskItem ? std(shade(partHex(deskItem.part, 0x6b5136), 0.82), { roughness: 0.62, metalness: 0.04 }) : m.ghost;
  g.add(box(dw, 26, dd, deskMat, 0, DESK_Y - 13, 0));
  g.add(box(dw, 4, dd, deskEdge, 0, DESK_Y - 27, 0));
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => g.add(box(40, DESK_Y - 30, 40, deskItem ? m.dark : m.ghost, a * (dw / 2 - 60), (DESK_Y - 30) / 2, b * (dd / 2 - 60))));

  const wall = box(6000, 3000, 20, m.wall, 0, 1500, -dd / 2 - 450);
  wall.castShadow = false;
  wall.userData.noFit = true; // backdrop, not part of the framing
  g.add(wall);

  // monitors: panel size from the real diagonal and aspect ratio
  const mons = (r.monitor || []).flatMap((it) => Array.from({ length: it.qty || 1 }, () => it.part));
  const dims = mons.map((part) => {
    const sp = part.specs || {};
    const ratio = sp.aspect || 16 / 9;
    const wd = (sp.diag_in || 27) * 25.4 * ratio / Math.sqrt(ratio * ratio + 1);
    return { w: wd, h: wd / ratio, part };
  });
  const total = dims.reduce((a, d) => a + d.w + 20, -20);
  let cursor = -total / 2;
  const mz = -dd / 2 + 280;
  dims.forEach((d) => {
    const paint = partHex(d.part, 0x24272c);
    const body = std(paint, { metalness: 0.24, roughness: 0.54 });
    const bodyDark = std(shade(paint, 0.7), { metalness: 0.32, roughness: 0.48 });
    const cx = cursor + d.w / 2;
    const cy = DESK_Y + 124 + d.h / 2;
    // housing ~42mm deep with a slim bezel, screen recessed slightly
    g.add(box(d.w, d.h, 42, body, cx, cy, mz));
    g.add(box(d.w - 14, d.h - 14, 2, m.screen, cx, cy, mz + 21.5));
    g.add(box(d.w * 0.42, 20, 12, bodyDark, cx, cy - d.h / 2 + 2, mz - 24));
    // stand: neck on a flat foot plate, both in the same finish
    g.add(box(74, 122, 22, bodyDark, cx, DESK_Y + 61, mz - 32));
    g.add(box(240, 9, 180, body, cx, DESK_Y + 4.5, mz - 36));
    cursor += d.w + 20;
  });
  const topY = dims.length ? DESK_Y + 124 + Math.max(...dims.map((d) => d.h)) : DESK_Y + 400;

  // keyboard / mouse / pad at their real footprints
  const kbItem = r.keyboard?.[0];
  const kb = kbItem?.part.specs;
  const kz = dd / 2 - 200;
  const pad = r.mousepad?.[0]?.part;
  if (pad) {
    g.add(box(pad.specs.width_mm || 900, 3, pad.specs.depth_mm || 400, std(partHex(pad, 0x17191d), { roughness: 0.94, metalness: 0 }), 0, DESK_Y + 1.5, kz));
  }
  const kx = -70;
  if (kb) {
    const kw = kb.w || 360;
    const kd = kb.d || 130;
    const kh = kb.height_mm || 30;
    const body = std(partHex(kbItem.part, 0x25282e), { metalness: 0.38, roughness: 0.46 });
    const cap = std(accentHex(kbItem.part, 0x1b1d22), { metalness: 0.08, roughness: 0.7 });
    g.add(box(kw, kh, kd, body, kx, DESK_Y + kh / 2, kz));
    // full keycap field in six sculpted rows
    const rows = 6;
    const cols = Math.round((kw - 18) / 19);
    const cw = (kw - 18) / cols;
    const cd = (kd - 16) / rows;
    for (let ri = 0; ri < rows; ri++) {
      for (let ci = 0; ci < cols; ci++) {
        g.add(box(cw * 0.86, 5, cd * 0.8, cap,
          kx - (kw - 18) / 2 + cw * (ci + 0.5), DESK_Y + kh + 2.5, kz - (kd - 16) / 2 + cd * (ri + 0.5)));
      }
    }
    g.add(box(kw - 14, 1.2, kd - 14, rgbMat(ctx, 0.55), kx, DESK_Y + kh + 5.4, kz));
  }
  const msItem = r.mouse?.[0];
  if (msItem) {
    const sp = msItem.part.specs || {};
    const mw = sp.w || 64;
    const md = sp.d || 122;
    const mh = sp.height_mm || 40;
    const body = std(partHex(msItem.part, 0x1c1e22), { metalness: 0.22, roughness: 0.48 });
    const mx = kx + (kb?.w || 360) / 2 + 130;
    g.add(box(mw, mh * 0.55, md, body, mx, DESK_Y + mh * 0.28, kz));
    g.add(box(mw * 0.9, mh * 0.5, md * 0.62, body, mx, DESK_Y + mh * 0.58, kz - md * 0.1));
    g.add(box(7, 9, 20, m.metal, mx, DESK_Y + mh * 0.6, kz + md * 0.18));
  }

  // headphones on the desk
  const hpItem = r.headphones?.[0];
  if (hpItem) {
    const hpMat = std(partHex(hpItem.part, 0x2a2d33), { metalness: 0.22, roughness: 0.55 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(mm(85), mm(8), 12, 40, Math.PI), hpMat);
    band.position.set(mm(-dw / 2 + 160), mm(DESK_Y + 88), mm(kz - 40));
    g.add(band);
    g.add(cyl(55, 35, hpMat, -dw / 2 + 160 - 85, DESK_Y + 58, kz - 40, 'x'), cyl(55, 35, hpMat, -dw / 2 + 160 + 85, DESK_Y + 58, kz - 40, 'x'));
  }

  // chair behind the desk
  const chairItem = r.chair?.[0];
  if (chairItem) {
    const sp = chairItem.part.specs || {};
    const fabric = std(partHex(chairItem.part, 0x424855), { roughness: 0.88, metalness: sp.mesh_back ? 0.15 : 0.02 });
    const trim = std(accentHex(chairItem.part, 0x2b2e34), { metalness: 0.45, roughness: 0.45 });
    const cz = dd / 2 + 440;
    g.add(box(500, 70, 480, fabric, 0, 470, cz));
    g.add(box(480, 720, 70, fabric, 0, 880, cz + 240));
    g.add(box(440, 26, 60, trim, 0, 1230, cz + 250));
    g.add(cyl(30, 380, trim, 0, 230, cz));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const arm = box(280, 25, 30, trim, Math.cos(a) * 140, 50, cz + Math.sin(a) * 140);
      arm.rotation.y = -a;
      g.add(arm);
    }
  }

  // lights and extras
  expand(r.lamp).forEach((it, i) => {
    const x = dw / 2 - 120 - i * 140;
    const barMat = std(partHex(it.part, 0x202329), { metalness: 0.35, roughness: 0.45 });
    g.add(cyl(70, 14, barMat, x, DESK_Y + 7, -dd / 2 + 120), cyl(8, 380, m.metal, x, DESK_Y + 200, -dd / 2 + 120));
    g.add(box(220, 14, 40, rgbMat(ctx), x, DESK_Y + 395, -dd / 2 + 130));
  });
  expand(r.speaker).forEach((it, i) => {
    const sx = (i % 2 ? 1 : -1) * (total / 2 + 190);
    const sp = it.part.specs || {};
    const cab = std(partHex(it.part, 0x23262b), { metalness: 0.12, roughness: 0.66 });
    g.add(box(sp.w || 110, sp.h || 190, sp.d || 140, cab, sx, DESK_Y + (sp.h || 190) / 2, mz + 40));
    g.add(cyl(35, 6, m.metal, sx, DESK_Y + 66, mz + 112, 'z'));
  });
  const micItem = r.microphone?.[0];
  if (micItem) {
    const micMat = std(partHex(micItem.part, 0xcfd3da), { metalness: 0.55, roughness: 0.4 });
    g.add(cyl(40, 12, m.dark, dw / 2 - 220, DESK_Y + 6, kz - 60), cyl(6, 300, m.metal, dw / 2 - 220, DESK_Y + 150, kz - 60), cyl(28, 140, micMat, dw / 2 - 220, DESK_Y + 330, kz - 60));
  }
  const webcamItem = r.webcam?.[0];
  if (webcamItem && dims.length) {
    g.add(box(90, 30, 30, std(partHex(webcamItem.part, 0x1c1e22), { roughness: 0.5 }), 0, topY + 15, mz + 5));
  }

  return { group: g, rgb: ctx.rgb, pcOffset: [mm(dw / 2 + 380), mm(-dd / 2 + 260)] };
}

function expand(list = []) {
  return list.flatMap((it) => Array.from({ length: it.qty || 1 }, () => it));
}