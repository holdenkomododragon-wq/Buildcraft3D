import { box, cyl, ring, stack, placeFan, rgbMat, tube, metalMat, plasticMat } from '../kit';
import { partHex, accentHex } from '../finish';

export function addCooler(g, ctx, F, item) {
  const cc = item.part.specs || {};
  const mount = item.config?.mount || (cc.radiator_mm >= 360 ? 'front' : 'top');
  if (cc.type === 'aio') return aio(g, ctx, F, cc, mount, item);
  return air(g, ctx, F, cc, item);
}

// tower air cooler: base on the CPU, fins stacked upward, fan on the front face
function air(g, ctx, F, cc, item) {
  const m = ctx.m;
  // fin stack and fan housing in the cooler's real finish (bare aluminium or black)
  const finsMat = metalMat(partHex(item.part, 0xbdc3cc), { roughness: 0.3 });
  const fanOpts = {
    rgb: !!cc.rgb,
    frameColor: partHex(item.part, 0x1d2128),
    bladeColor: accentHex(item.part, 0x8b929c),
  };
  const { socket, board, h, Y0 } = F;
  const zs = board.z;
  const H = Math.min(cc.height_mm || 155, Y0 + h - 26 - socket.y);
  const finH = Math.max(60, H - 40);
  const count = Math.max(18, Math.floor(finH / 3.1));
  const zc = zs + 74;

  g.add(box(46, 46, 16, m.copper, socket.x, socket.y, zs + 14));
  g.add(box(50, 50, 3, m.metal, socket.x, socket.y, zs + 23));
  for (let i = 0; i < 4; i++) {
    g.add(cyl(3, finH + 26, m.copper, socket.x - 16 + i * 10.7, socket.y + finH / 2 - 8, zc, 'y', 3, 10));
  }
  const fins = stack(finsMat, count, [58, 1.3, 118], 3.1, 'y');
  fins.position.set(socket.x / 1000, (socket.y - finH / 2) / 1000, zc / 1000);
  g.add(fins);

  g.add(box(62, 4, 122, m.darkMetal, socket.x, socket.y - finH / 2 - 2, zc));
  g.add(box(62, 5, 122, m.darkMetal, socket.x, socket.y + finH / 2 + 3, zc));
  g.add(box(26, 2, 44, rgbMat(ctx, 1.1), socket.x, socket.y + finH / 2 + 6, zc));

  placeFan(g, 120, ctx, fanOpts, socket.x - 36, socket.y, zc, 'x');
  if ((cc.fan_count || 1) > 1) placeFan(g, 120, ctx, fanOpts, socket.x + 36, socket.y, zc, '-x');
  return { front: false, top: false };
}

// all-in-one liquid cooler: pump block on the CPU, radiator on the front or roof
function aio(g, ctx, F, cc, mount, item) {
  const m = ctx.m;
  const pumpMat = plasticMat(partHex(item.part, 0x22252b), { roughness: 0.42, clearcoat: 0.7 });
  const finsMat = metalMat(partHex(item.part, 0xbdc3cc), { roughness: 0.32 });
  const fanOpts = {
    rgb: !!cc.rgb,
    frameColor: partHex(item.part, 0x1d2128),
    bladeColor: accentHex(item.part, 0x8b929c),
  };
  const { socket, board, l, h, Y0, x0, x1 } = F;
  const zs = board.z;
  const fsize = (cc.radiator_mm || 240) >= 420 ? 140 : 120;
  const maxLen = mount === 'front' ? h - 120 : l - 150;
  const len = Math.min(cc.radiator_mm || 240, maxLen);
  const n = cc.fan_count || Math.max(2, Math.round(len / fsize));

  // pump / water block
  g.add(cyl(44, 12, m.darkMetal, socket.x, socket.y, zs + 10, 'z', 44, 32));
  g.add(cyl(42, 30, pumpMat, socket.x, socket.y, zs + 30, 'z', 42, 32));
  g.add(ring(32, 3, rgbMat(ctx, 2.3), socket.x, socket.y, zs + 45.5));
  g.add(cyl(30, 2, m.metal, socket.x, socket.y, zs + 45.5, 'z', 30, 32));

  if (mount === 'front') {
    const rx = x1 - 56;
    const ry = Y0 + h / 2;
    g.add(box(27, len, 122, m.darkMetal, rx, ry, 0));
    for (let i = 0; i < 4; i++) g.add(box(29, len - 8, 2, finsMat, rx, ry, -46 + i * 30));
    for (let i = 0; i < n; i++) {
      placeFan(g, fsize, ctx, fanOpts, x1 - 30, ry + (i - (n - 1) / 2) * fsize, 0, 'x');
    }
    g.add(box(24, 14, 26, m.darkMetal, rx, ry + len / 2 - 10, 44));
    g.add(tube([[socket.x, socket.y + 28, zs + 40], [socket.x + 40, socket.y + 110, zs + 78], [rx, ry + len / 2 - 10, 44]], m.tube, 7));
    g.add(tube([[socket.x, socket.y - 24, zs + 40], [socket.x + 60, socket.y - 40, zs + 90], [rx, ry + len / 2 - 10, 20]], m.tube, 7));
    return { front: true, top: false };
  }

  const rcx = Math.max(x0 + 150, Math.min(socket.x + 40, x1 - 150));
  const ry = Y0 + h - 32;
  g.add(box(len, 27, 122, m.darkMetal, rcx, ry, 0));
  for (let i = 0; i < 4; i++) g.add(box(len - 8, 29, 2, finsMat, rcx, ry, -46 + i * 30));
  for (let i = 0; i < n; i++) {
    placeFan(g, fsize, ctx, fanOpts, rcx + (i - (n - 1) / 2) * fsize, ry - 28, 0, '-y');
  }
  g.add(box(26, 14, 24, m.darkMetal, rcx - len / 2 + 10, ry, 44));
  g.add(tube([[socket.x, socket.y + 28, zs + 40], [socket.x - 20, socket.y + 120, zs + 70], [rcx - len / 2 + 10, ry - 6, 44]], m.tube, 7));
  g.add(tube([[socket.x, socket.y - 24, zs + 40], [socket.x + 10, socket.y - 60, zs + 96], [rcx - len / 2 + 10, ry - 6, 22]], m.tube, 7));
  return { front: false, top: true };
}