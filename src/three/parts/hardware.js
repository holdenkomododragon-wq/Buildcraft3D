import { box, cyl } from '../kit';

// Small hard details: the sockets, headers and plugs that make a component read as
// real hardware when the camera gets close.

// A row of PCIe sockets on a card's top edge, each with the cable plug seated in it
// and a short cable run leaving upward.
export function pciePower(g, m, { x, y, z, count = 2, width = 22, height = 10, depth = 14, gap = 5 }) {
  const total = count * width + (count - 1) * gap;
  const exits = [];
  for (let i = 0; i < count; i++) {
    const px = x - total / 2 + width / 2 + i * (width + gap);
    g.add(box(width, height, depth, m.socket, px, y, z));
    g.add(box(width - 5, 2.4, depth - 5, m.gold, px, y + height / 2 - 0.6, z));
    g.add(box(width - 2, 8, depth - 3, m.plug, px, y + height / 2 + 4.5, z));
    g.add(box(width - 9, 15, depth - 8, m.sleeve, px, y + height / 2 + 16, z));
    exits.push({ x: px, y: y + height / 2 + 23.5, z });
  }
  return exits;
}

// 24-pin ATX header on the board's front edge, with its plug and cable leaving it
export function atx24(g, m, { x, y, z }) {
  g.add(box(15, 48, 15, m.socket, x, y, z));
  g.add(box(11, 42, 2, m.gold, x, y, z + 8.2));
  g.add(box(13, 46, 12, m.plug, x, y, z + 14));
  g.add(box(17, 40, 12, m.sleeve, x, y, z + 25));
}

// EPS 8-pin CPU power on the board's top edge
export function eps8(g, m, { x, y, z }) {
  g.add(box(26, 13, 15, m.socket, x, y, z));
  g.add(box(22, 3, 9, m.gold, x, y + 6, z));
  g.add(box(24, 11, 12, m.plug, x, y + 12, z));
  g.add(box(20, 14, 10, m.sleeve, x, y + 24, z));
}

// 4-pin fan header: white shell with the pins exposed
export function fanHeader(g, m, { x, y, z }) {
  g.add(box(13, 12, 4, m.header, x, y, z));
  g.add(box(9, 8, 1.5, m.gold, x, y, z + 2.4));
  g.add(box(13, 3, 5, m.header, x, y - 6.5, z + 0.6));
}

// PSU modular panel: sockets recessed in the housing, the top two cables plugged in
export function modularPanel(g, m, { x, y, z }) {
  const exits = [];
  [[16, -40], [16, -14], [-14, -40], [-14, -14]].forEach(([dy, dz], i) => {
    g.add(box(2, 12, 16, m.slot, x, y + dy, z + dz));
    g.add(box(7, 12, 15, m.plug, x + 3.5, y + dy, z + dz));
    g.add(box(9, 11, 13, m.sleeve, x + 11, y + dy, z + dz));
    exits.push({ x: x + 15.5, y: y + dy, z: z + dz, index: i });
  });
  return exits;
}

// Rear I/O: USB stacks, ethernet, audio jacks and a USB-C set into the shield
export function ioStack(g, m, { x, y, z }) {
  const port = (py, h, w) => {
    g.add(box(3, w, h, m.port, x, y + py, z));
    g.add(box(4, w - 4, h - 4, m.portInner, x - 0.8, y + py, z));
  };
  port(30, 9, 26);
  port(18, 9, 26);
  port(4, 14, 24);
  [-24, -34, -44].forEach((py) => g.add(cyl(3.4, 4, m.portInner, x, y + py, z, 'x', 3.4, 12)));
  g.add(box(3, 8, 6, m.port, x, y + 44, z));
  g.add(box(4, 5, 3, m.portInner, x - 0.8, y + 44, z));
}

// Graphics card outputs on the bracket: dark ports in metal surrounds
export function displayPorts(g, m, { x, y, z, depth = 90 }) {
  [-0.3, -0.05, 0.2].forEach((o) => {
    const pz = z + o * depth;
    g.add(box(3, 13, 19, m.darkMetal, x, y, pz));
    g.add(box(2, 9, 15, m.portInner, x - 1.4, y, pz));
  });
}