import { box, cyl, plane, meshMat } from '../kit';

// Chassis: front mesh intake, tempered glass side, top vent, PSU basement.
// Returns the glass mesh so the settings toggle can hide it.
export function buildCaseShell(g, ctx, F) {
  const { l, h, w, Y0, ghost, m, x0, x1, z0, z1 } = F;
  const caseSpecs = F.caseSpecs || {};
  const frontStyle = caseSpecs.front_style || 'mesh';
  const glassZ = z1 - 6;
  const fx = x1 - 7;

  // feet
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) =>
    g.add(box(36, Y0, 36, m.plastic, a * (x1 - 46), Y0 / 2, b * (z1 - 32))));

  // chassis panels
  g.add(box(l, 4, w, m.shellDark, 0, Y0 + 2, 0));
  g.add(box(l, 4, w, m.shell, 0, Y0 + h - 2, 0));
  g.add(box(4, h, w, m.shellDark, x0 + 2, Y0 + h / 2, 0));
  g.add(box(l - 6, h - 8, 3, m.shell, 0, Y0 + h / 2, z0 + 2));

  // motherboard tray + cable grommets
  g.add(box(l - 44, h - 34, 2, m.tray, -4, Y0 + h / 2 + 6, z0 + 14));
  [
    [x0 + 150, Y0 + 235], [x0 + 150, Y0 + 285], [x1 - 150, Y0 + 150],
  ].forEach(([x, y]) => g.add(box(56, 38, 5, m.grommet, x, y, z0 + 15)));

  // PSU basement (rear stays open so the power supply is visible)
  const sw = F.shroudFront - F.shroudBack;
  g.add(box(sw, F.shroudTop - Y0 - 4, w - 12, m.shellDark, (F.shroudFront + F.shroudBack) / 2, (Y0 + 4 + F.shroudTop) / 2, 0));
  g.add(box(sw, 2, w - 12, m.shell, (F.shroudFront + F.shroudBack) / 2, F.shroudTop, 0));

  // front panel: rails + perforated intake
  const fh = h - 18;
  g.add(box(10, 15, w - 8, m.shell, fx, Y0 + h - 11, 0));
  g.add(box(10, 15, w - 8, m.shell, fx, Y0 + 11, 0));
  g.add(box(10, fh, 12, m.shell, fx, Y0 + h / 2, -(w - 12) / 2));
  g.add(box(10, fh, 12, m.shell, fx, Y0 + h / 2, (w - 12) / 2));
  if (m.accent || frontStyle === 'wood-slats') {
    // wood / lacquer front: dark backing behind a row of vertical slats
    g.add(plane(w - 44, fh - 34, ghost ? m.front : m.tray, fx - 5, Y0 + h / 2, 0, 'x'));
    const span = w - 52;
    const slats = 15;
    const step = span / slats;
    for (let i = 0; i < slats; i++) {
      g.add(box(7, fh - 34, step * 0.62, m.accent, fx - 1.5, Y0 + h / 2, -(span / 2) + step * (i + 0.5)));
    }
  } else if (frontStyle === 'panoramic-glass') {
    g.add(plane(w - 44, fh - 34, m.front, fx - 4, Y0 + h / 2, 0, 'x'));
  } else if (frontStyle === 'solid-ribbed') {
    g.add(plane(w - 44, fh - 34, m.shellDark, fx - 4, Y0 + h / 2, 0, 'x'));
    const ribs = 9 + (caseSpecs.fan_mounts || 0) % 5;
    const span = w - 52;
    for (let i = 0; i < ribs; i++) {
      const z = -span / 2 + (span / (ribs - 1)) * i;
      g.add(box(4, fh - 42, 3, m.shell, fx + 0.5, Y0 + h / 2, z));
    }
  } else {
    const repeat = caseSpecs.front_mesh_repeat || 24;
    g.add(plane(w - 44, fh - 34, ghost ? m.front : meshMat(m.shell.color, repeat), fx - 4, Y0 + h / 2, 0, 'x'));
  }

  // front I/O: power button + two USB
  g.add(cyl(7, 5, m.metal, fx + 1, Y0 + h - 34, -(w / 2) + 38, 'x', 7, 18));
  g.add(box(5, 9, 13, m.plastic, fx + 1, Y0 + h - 34, -(w / 2) + 66));
  g.add(box(5, 9, 13, m.plastic, fx + 1, Y0 + h - 34, -(w / 2) + 86));

  // top vent
  g.add(plane(l - 100, w - 34, ghost ? m.front : meshMat(0x2c333d, 20), 8, Y0 + h - 3.6, 0, 'y'));

  // tempered glass side panel + frame
  const gw = l - 26;
  const gh = h - 28;
  const glass = box(gw, gh, 4, m.glass, 0, Y0 + h / 2, glassZ);
  glass.castShadow = false;
  glass.receiveShadow = false;
  g.add(glass);
  g.add(box(gw, 8, 6, m.shellDark, 0, Y0 + h - 17, glassZ));
  g.add(box(gw, 8, 6, m.shellDark, 0, Y0 + 17, glassZ));
  g.add(box(8, gh, 6, m.shellDark, -gw / 2 + 4, Y0 + h / 2, glassZ));
  g.add(box(8, gh, 6, m.shellDark, gw / 2 - 4, Y0 + h / 2, glassZ));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) =>
    g.add(cyl(4.5, 3, m.metal, a * (gw / 2 - 5), Y0 + (b > 0 ? h - 26 : 26), glassZ + 3, 'z', 4.5, 12)));

  return glass;
}