import { box, placeFan, rgbMat, metalMat, plasticMat } from '../kit';
import { partHex, accentHex, shade } from '../finish';
import { displayPorts, pciePower } from './hardware';

// Graphics card in its real mounting: PCB horizontal in slots, cooler and fans on the
// underside, backplate on top, bracket at the rear, branded side edge toward the glass.
export function addGpu(g, ctx, F, item) {
  const m = ctx.m;
  const gs = item.part.specs || {};
  // the card's own shroud colour, its real metal trim, and a darker inner frame
  const shroudHex = ctx.colors?.gpu || partHex(item.part, 0x1f2227);
  const shroud = plasticMat(shroudHex, { roughness: 0.44, clearcoat: 0.8 });
  const trim = metalMat(accentHex(item.part, 0x9aa2ae), { roughness: 0.3 });
  const inner = plasticMat(shade(shroudHex, 0.72), { roughness: 0.62, clearcoat: 0.3 });
  const { board, gpuRearX, slotY, x1, z1 } = F;
  const bz = board.z + 9;
  const len = Math.min(gs.length_mm || 300, x1 - 26 - (gpuRearX + 10));
  const depth = Math.min(gs.height_mm || 130, z1 - 14 - bz);
  const thick = Math.max(38, Math.min(gs.thickness_mm || 55, 68));
  const yTop = slotY + 7;
  const yMid = yTop - thick / 2;
  const cx = gpuRearX + 10 + len / 2;
  const cz = bz + depth / 2;
  const sideZ = bz + depth;

  // PCB + backplate
  g.add(box(len - 4, 2, depth - 18, m.pcb, cx, yTop - 7, cz));
  g.add(box(len - 6, 2.4, depth - 8, m.darkMetal, cx, yTop - 1.4, cz + 2));

  // shroud shell: painted plates with darker end caps, metal trim along the glass side
  g.add(box(len, 3, depth - 6, shroud, cx, yTop - 5.5, cz));
  g.add(box(len, 3, depth - 6, shroud, cx, yTop - thick + 1.5, cz));
  g.add(box(3, thick - 3, depth - 6, inner, cx + len / 2 - 1.5, yMid, cz));
  g.add(box(3, thick - 4, depth - 4, inner, cx - len / 2 + 1.5, yMid, cz));
  g.add(box(len - 6, thick - 8, 3, inner, cx - 1, yMid, sideZ - 1.5));
  g.add(box(len - 8, 1.6, 3, trim, cx, yTop - 1.2, sideZ - 6));

  // branded side edge facing the glass
  g.add(box(len * 0.42, 9, 2, trim, cx - len * 0.16, yTop - thick * 0.55, sideZ + 0.4));
  g.add(box(len * 0.3, 3, 2, rgbMat(ctx, 2), cx + len * 0.22, yTop - thick * 0.62, sideZ + 0.8));

  // axial fans on the underside
  const n = gs.fan_count || 3;
  const fsize = Math.min(depth - 16, (len - 12) / n);
  for (let i = 0; i < n; i++) {
    placeFan(g, fsize, ctx, {
      frame: true, depth: 16,
      frameColor: partHex(item.part, 0x24272d),
      bladeColor: 0x9aa3b0,
    }, cx - len / 2 + (len / n) * (i + 0.5), yTop - thick + 2.5, cz, '-y');
  }

  // rear I/O bracket with the display outputs cut into it
  g.add(box(3, thick + 6, depth - 6, m.metal, gpuRearX, yMid + 3, cz));
  displayPorts(g, m, { x: gpuRearX - 1.2, y: yTop - thick + 14, z: cz, depth });
  // gold edge fingers where the card seats in the slot
  g.add(box(len * 0.34, 1.6, 3, m.gold, cx - len * 0.22, yTop - 8.4, bz - 4));

  // where the power plugs go: sockets on the top edge with the cables seated in them
  const plugs = gs.power_connector === '16-pin' ? 1 : (gs.board_power_w || 0) >= 320 ? 3 : 2;
  pciePower(g, m, {
    x: cx + len * 0.1, y: yTop + 2, z: bz + depth * 0.42,
    count: plugs, width: plugs === 1 ? 30 : 22, depth: plugs === 1 ? 16 : 14,
  });
  g.add(box(4, 4, depth - 20, m.metal, gpuRearX + 30, yTop - 8, cz));
}