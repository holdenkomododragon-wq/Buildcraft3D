import { box, cyl, ring, rgbMat, metalMat, plasticMat } from '../kit';
import { atx24, eps8, fanHeader, ioStack } from './hardware';

// Board layout in ATX units (305 x 244 from the rear edge / bottom), scaled to the
// real board size so mATX and ITX read as the same board shrunk down.
export function addMotherboard(g, ctx, F, item) {
  const m = ctx.m;
  const { board } = F;
  const { xRear, y0, bw, bh, z, kx, ky } = board;
  const X = (v) => xRear + v * kx;
  const Y = (v) => y0 + v * ky;
  const W = (v) => v * kx;
  const S = (v) => v * ky;

  // PCB — the user can repaint the board, otherwise it keeps the product's own finish
  const pcbMat = ctx.colors?.motherboard ? plasticMat(ctx.colors.motherboard, { roughness: 0.66, clearcoat: 0.25 }) : m.pcb;
  g.add(box(bw, bh, 3, pcbMat, X(152.5), Y(122), z - 1.5));

  // rear I/O port block, shield and cover
  g.add(box(W(44), S(158), 30, m.darkMetal, X(22), Y(165), z + 15));
  g.add(box(W(44), S(7), 2, m.metal, X(22), Y(90), z + 29.5));
  g.add(box(W(66), S(76), 36, m.plastic, X(40), Y(198), z + 18));
  g.add(box(W(62), 2.4, 3, rgbMat(ctx, 1.9), X(40), Y(235), z + 35.5));

  // VRM heatsinks
  g.add(box(W(68), S(22), 22, m.darkMetal, X(100), Y(231), z + 11));
  for (let i = 0; i < 8; i++) g.add(box(W(2.4), S(24), 20, m.metal, X(72 + i * 8), Y(231), z + 11));
  g.add(box(W(20), S(76), 22, m.darkMetal, X(13), Y(178), z + 11));
  for (let i = 0; i < 8; i++) g.add(box(W(22), S(2.4), 20, m.metal, X(13), Y(146 + i * 8.6), z + 11));

  // CPU socket, retention frame, capacitors
  const { x: sx, y: sy } = F.socket;
  g.add(box(46, 46, 5, m.socket, sx, sy, z + 2.5));
  g.add(box(52, 3, 9, m.metal, sx, sy + 22, z + 6));
  g.add(box(52, 3, 9, m.metal, sx, sy - 22, z + 6));
  g.add(box(3, 52, 9, m.metal, sx - 22, sy, z + 6));
  g.add(box(3, 52, 9, m.metal, sx + 22, sy, z + 6));
  // the CPU's heat spreader, in the colour picked for it
  const ihs = ctx.colors?.cpu ? metalMat(ctx.colors.cpu, { roughness: 0.26 }) : m.metal;
  g.add(box(40, 40, 2.4, ihs, sx, sy, z + 6));
  for (let i = 0; i < 6; i++) g.add(cyl(2.6, 6, m.cap, sx - 40 + i * 9, sy - 32, z + 3, 'z', 2.6, 10));

  // Dense capacitor banks and power stages make the exposed board area read as hardware.
  [0, 1, 2, 3, 4].forEach((i) => {
    const x = X(57 + i * 9);
    g.add(cyl(3.1, 7, m.cap, x, Y(213), z + 5, 'z', 3.1, 14));
    g.add(cyl(2.2, 2, m.gold, x, Y(213), z + 9.5, 'z', 2.2, 12));
  });
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const x = X(78 + i * 10);
    g.add(box(W(6), S(5), 3, m.darkMetal, x, Y(194), z + 3));
    g.add(box(W(3), S(2), 1.2, m.metal, x, Y(194), z + 5.1));
  });

  // DIMM slots (vertical, left of the CPU toward the front edge)
  for (let i = 0; i < 4; i++) {
    const x = X(132 + i * 8.7);
    g.add(box(W(8), S(133), 9, i % 2 ? m.slot : m.slotAlt, x, Y(178), z + 4.5));
    g.add(box(W(9), S(6), 10, m.slotAlt, x, Y(112), z + 5));
    g.add(box(W(9), S(6), 10, m.slotAlt, x, Y(242), z + 5));
  }

  // PCIe slots
  g.add(box(W(92), S(13), 13, m.metal, X(116), Y(88), z + 6.5));
  g.add(box(W(86), S(7), 13, m.slot, X(116), Y(88), z + 7));
  g.add(box(W(72), S(11), 11, m.slot, X(106), Y(64), z + 5.5));
  g.add(box(W(72), S(11), 11, m.slot, X(106), Y(42), z + 5.5));

  // chipset heatsink, M.2 shields
  g.add(box(W(56), S(56), 14, m.darkMetal, X(212), Y(56), z + 7));
  g.add(box(W(30), S(6), 2, m.metal, X(212), Y(56), z + 14.5));
  g.add(box(W(84), S(24), 7, m.metal, X(205), Y(122), z + 4));
  for (let i = 0; i < 6; i++) g.add(box(W(3), S(20), 8, m.darkMetal, X(172 + i * 12), Y(122), z + 4.5));
  [0, 1, 2].forEach((i) => {
    const x = X(170 + i * 84);
    const y = Y(122);
    g.add(cyl(2.2, 1.8, m.gold, x, y, z + 8.8, 'z', 2.2, 12));
    g.add(box(W(18), S(2.4), 2, m.darkMetal, x + W(25), y, z + 2.5));
  });

  // Surface-mount component dots in grouped rows around the socket, slots and lower edge.
  const componentRows = [
    { x: 54, y: 170, count: 8, step: 7 },
    { x: 72, y: 66, count: 9, step: 8 },
    { x: 192, y: 34, count: 8, step: 9 },
    { x: 270, y: 82, count: 5, step: 7 },
  ];
  componentRows.forEach(({ x, y, count, step }) => {
    for (let i = 0; i < count; i++) {
      const px = X(x + i * step);
      const py = Y(y + (i % 2) * 4);
      g.add(cyl(1.35, 1.3, i % 3 === 0 ? m.gold : m.cap, px, py, z + 1.2, 'z', 1.35, 10));
    }
  });

  // rear I/O ports sitting in the shield cutout
  ioStack(g, m, { x: xRear - 1, y: Y(165), z: z + 15 });

  // 24-pin and CPU power, with the plugs and cables seated where they belong
  atx24(g, m, { x: X(296), y: Y(150), z: z + 7.5 });
  eps8(g, m, { x: X(87), y: Y(239), z: z + 7.5 });

  // fan headers along the board edges
  fanHeader(g, m, { x: X(60), y: Y(22), z: z + 4 });
  fanHeader(g, m, { x: X(276), y: Y(214), z: z + 4 });
  fanHeader(g, m, { x: X(200), y: Y(18), z: z + 4 });

  // SATA ports on the front edge
  for (let i = 0; i < 3; i++) {
    g.add(box(W(16), S(9), 13, m.socket, X(236), Y(32 - i * 11), z + 6));
    g.add(box(W(12), S(3), 3, m.gold, X(236), Y(32 - i * 11), z + 12));
  }

  // Small board standoffs and plated mounting holes along the available corners.
  [[12, 12], [293, 12], [12, 232], [293, 232], [152, 12], [152, 232]].forEach(([x, y]) => {
    g.add(ring(3.2, 0.8, m.metal, X(x), Y(y), z + 1.2, 'z', 16));
    g.add(cyl(1.2, 1.4, m.slot, X(x), Y(y), z + 1.1, 'z', 1.2, 12));
  });

  // CMOS battery + RGB strip along the front edge
  g.add(cyl(10, 4, m.metal, X(250), Y(24), z + 2, 'z', 10, 20));
  g.add(box(2.5, S(150), 3, rgbMat(ctx, 1.4), X(301), Y(150), z + 2));
}