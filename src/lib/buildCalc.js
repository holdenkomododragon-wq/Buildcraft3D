import { ALL_SLOTS, REQUIRED_PC } from './catalogMeta';
import { gpuClearance, radiatorFit } from './caseFit';

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// items: { slot: [{ partId, qty, config }] } -> resolved: { slot: [{ part, qty, config }] }
export function resolveItems(items, byId) {
  const out = {};
  Object.entries(items || {}).forEach(([slot, list]) => {
    const rows = (list || []).map((it) => ({ part: byId[it.partId], qty: it.qty || 1, config: it.config || {} })).filter((r) => r.part);
    if (rows.length) out[slot] = rows;
  });
  return out;
}

const flat = (r) => Object.entries(r).flatMap(([slot, rows]) => rows.map((x) => ({ ...x, slot })));

export function calcPrice(r) {
  let total = 0;
  let missing = 0;
  flat(r).forEach((x) => {
    if (x.part.price == null) missing += 1;
    else total += x.part.price * x.qty;
  });
  return { total, missing };
}

export function calcPower(r) {
  const rows = [];
  flat(r).forEach(({ part, qty, slot }) => {
    const sp = part.specs || {};
    let w = 0;
    if (slot === 'cpu') w = sp.max_power_w || sp.tdp_w || 0;
    else if (slot === 'gpu') w = sp.board_power_w || 0;
    else if (slot === 'motherboard') w = sp.power_w || 45;
    else if (slot === 'ram') w = (sp.modules || 1) * 4;
    else if (slot === 'cooler') w = sp.power_w ?? (sp.type === 'aio' ? 15 : 3);
    else if (slot === 'storage') w = sp.power_w || 6;
    else if (slot === 'fan') w = sp.power_w || 2.5;
    if (w) rows.push({ part, qty, each: w, sub: w * qty });
  });
  const total = rows.reduce((a, x) => a + x.sub, 0);
  const psu = r.psu?.[0]?.part;
  const capacity = psu?.specs?.wattage_w || null;
  const recommended = Math.ceil((total * 1.25) / 10) * 10;
  let level = 'none';
  if (capacity) level = capacity >= recommended ? 'safe' : capacity >= total ? 'warning' : 'error';
  return { rows, total, capacity, recommended, level, pct: capacity ? (total / capacity) * 100 : 0 };
}

const chk = (id, status, message, ids, rule) => ({ id, rule, status, message, ids });

export function calcCompat(r) {
  const c = r.case?.[0]?.part;
  const cpu = r.cpu?.[0]?.part;
  const mb = r.motherboard?.[0]?.part;
  const gpu = r.gpu?.[0]?.part;
  const ram = r.ram?.[0];
  const cl = r.cooler?.[0]?.part;
  const psu = r.psu?.[0]?.part;
  const power = calcPower(r);
  const out = [];

  if (cpu && mb) {
    const ok = cpu.specs.socket === mb.specs.socket;
    out.push(chk('cpu-socket', ok ? 'compatible' : 'incompatible', ok ? `CPU socket ${cpu.specs.socket} matches the motherboard.` : `CPU socket ${cpu.specs.socket} does not match motherboard socket ${mb.specs.socket}.`, [cpu.id, mb.id], 'CPU / Motherboard'));
    if (ok && mb.specs.bios_note) out.push(chk('cpu-bios', 'warning', mb.specs.bios_note, [cpu.id, mb.id], 'BIOS'));
  }
  if (mb && c) {
    const ok = (c.specs.form_factors || []).includes(mb.specs.form_factor);
    out.push(chk('mb-case', ok ? 'compatible' : 'incompatible', ok ? `${mb.specs.form_factor} board is supported by the case.` : `Motherboard form factor ${mb.specs.form_factor} is not supported by this case (supports ${(c.specs.form_factors || []).join(', ')}).`, [mb.id, c.id], 'Motherboard / Case'));
  }
  if (gpu && c) {
    const max = num(c.specs.max_gpu_mm);
    const len = num(gpu.specs.length_mm);
    const clear = gpuClearance(c, r.cooler?.[0]);
    const radNote = max != null && clear != null && clear < max ? ` (${max} mm less the front radiator)` : '';
    if (clear != null && len != null) {
      const ok = len <= clear;
      const tight = ok && clear - len <= 10;
      out.push(chk('gpu-len', ok ? (tight ? 'warning' : 'compatible') : 'incompatible',
        ok
          ? (tight ? `GPU length ${len} mm fits within ${clear} mm${radNote} with only ${clear - len} mm to spare — check the power cable clearance.` : `GPU length ${len} mm fits within ${clear} mm of clearance${radNote}.`)
          : `GPU length ${len} mm is ${len - clear} mm too long for the ${clear} mm of clearance${radNote}.`,
        [gpu.id, c.id], 'GPU / Case'));
    } else out.push(chk('gpu-len', 'unknown', 'GPU length or case clearance is missing.', [gpu.id, c.id], 'GPU / Case'));
    const gh = num(gpu.specs.height_mm);
    const caseW = num(c.specs.dims_mm?.w);
    if (gh != null && caseW != null && gh > caseW - 60) out.push(chk('gpu-width', 'warning', `Card is ${gh} mm tall; the case is ${caseW} mm wide, so the side panel may press on the power cables.`, [gpu.id, c.id], 'GPU height'));
  }
  if (gpu && psu) {
    const need16 = gpu.specs.power_connector === '16-pin';
    if (need16 && !psu.specs.pcie_16pin) out.push(chk('gpu-conn', 'warning', 'This GPU uses a 16-pin connector; the PSU has no native 16-pin cable, so an adapter is needed.', [gpu.id, psu.id], 'GPU / PSU'));
    else out.push(chk('gpu-conn', 'compatible', 'GPU power connector is supported by the PSU.', [gpu.id, psu.id], 'GPU / PSU'));
  }
  if (ram && mb) {
    const gen = ram.part.specs.memory;
    const ok = gen === mb.specs.memory;
    out.push(chk('ram-gen', ok ? 'compatible' : 'incompatible', ok ? `${gen} memory matches the motherboard.` : `${gen} memory is not supported by this ${mb.specs.memory} motherboard.`, [ram.part.id, mb.id], 'RAM / Motherboard'));
    const sticks = (ram.part.specs.modules || 1) * ram.qty;
    const cap = (ram.part.specs.capacity_gb || 0) * ram.qty;
    if (sticks > (mb.specs.ram_slots || 4)) out.push(chk('ram-slots', 'incompatible', `${sticks} modules selected but the board has ${mb.specs.ram_slots} DIMM slots.`, [ram.part.id, mb.id], 'RAM slots'));
    else if (cap > (mb.specs.max_ram_gb || 9999)) out.push(chk('ram-cap', 'incompatible', `${cap} GB exceeds the board maximum of ${mb.specs.max_ram_gb} GB.`, [ram.part.id, mb.id], 'RAM capacity'));
    if (ok && cpu && cpu.specs.memory && cpu.specs.memory !== gen) out.push(chk('ram-cpu', 'incompatible', `CPU supports ${cpu.specs.memory}, not ${gen}.`, [ram.part.id, cpu.id], 'RAM / CPU'));
    if (ok && ram.part.specs.speed_mt_s > (mb.specs.max_speed_mt_s || 99999)) out.push(chk('ram-speed', 'warning', `Kit is rated ${ram.part.specs.speed_mt_s} MT/s via XMP/EXPO; the board lists up to ${mb.specs.max_speed_mt_s} MT/s. It will likely run slower.`, [ram.part.id, mb.id], 'RAM speed'));
  }
  if (cl && cpu) {
    const ok = (cl.specs.sockets || []).includes(cpu.specs.socket);
    out.push(chk('cool-socket', ok ? 'compatible' : 'incompatible', ok ? `Cooler supports socket ${cpu.specs.socket}.` : `Cooler does not list support for socket ${cpu.specs.socket}.`, [cl.id, cpu.id], 'Cooler / CPU'));
    if (ok && cpu.specs.max_power_w && cl.specs.tdp_rating_w && cl.specs.tdp_rating_w < cpu.specs.max_power_w * 0.7) out.push(chk('cool-tdp', 'warning', `Cooler is rated ${cl.specs.tdp_rating_w} W; this CPU can draw ${cpu.specs.max_power_w} W.`, [cl.id, cpu.id], 'Cooling capacity'));
  }
  if (cl && c) {
    if (cl.specs.type === 'air') {
      const max = num(c.specs.max_cooler_mm);
      const h = num(cl.specs.height_mm);
      if (max != null && h != null) {
        const ok = h <= max;
        const tight = ok && max - h <= 5;
        out.push(chk('cool-height', ok ? (tight ? 'warning' : 'compatible') : 'incompatible',
          ok ? (tight ? `Cooler height ${h} mm only just clears the ${max} mm case limit.` : `Cooler height ${h} mm fits (limit ${max} mm).`) : `Cooler height ${h} mm is ${h - max} mm taller than the ${max} mm case limit.`,
          [cl.id, c.id], 'Cooler / Case'));
      } else out.push(chk('cool-height', 'unknown', 'Cooler height or case limit is missing.', [cl.id, c.id], 'Cooler / Case'));
    } else {
      const len = cl.specs.radiator_mm;
      const mount = r.cooler[0].config?.mount || (len >= 360 ? 'front' : 'top');
      const other = mount === 'front' ? 'top' : 'front';
      const fits = radiatorFit(c, cl, mount);
      const fitsOther = radiatorFit(c, cl, other);
      const max = mount === 'front' ? c.specs.rad_front : c.specs.rad_top;
      out.push(chk('rad-fit', fits ? 'compatible' : fitsOther ? 'warning' : 'incompatible',
        fits
          ? `${len} mm radiator fits the ${mount} mount.`
          : fitsOther
            ? `${len} mm radiator does not fit the ${mount} mount (max ${max || 0} mm), but does fit the ${other} mount — switch the radiator mount.`
            : `${len} mm radiator does not fit the ${mount} mount (max ${max || 0} mm) and neither does the ${other} mount.`,
        [cl.id, c.id], 'Radiator / Case'));
    }
  }
  if (psu && c) {
    const ok = !c.specs.psu_form || c.specs.psu_form === psu.specs.form || (c.specs.psu_form === 'ATX' && psu.specs.form === 'SFX');
    out.push(chk('psu-form', ok ? 'compatible' : 'incompatible', ok ? 'PSU form factor fits the case.' : `Case takes ${c.specs.psu_form} PSUs, selected is ${psu.specs.form}.`, [psu.id, c.id], 'PSU / Case'));
    if (c.specs.psu_max_mm && psu.specs.length_mm > c.specs.psu_max_mm) out.push(chk('psu-len', 'incompatible', `PSU length ${psu.specs.length_mm} mm exceeds case limit ${c.specs.psu_max_mm} mm.`, [psu.id, c.id], 'PSU length'));
  }
  if (psu && power.total) {
    const s = power.level;
    out.push(chk('psu-watt', s === 'safe' ? 'compatible' : s === 'warning' ? 'warning' : 'incompatible',
      s === 'safe' ? `${psu.specs.wattage_w} W covers the estimated ${Math.round(power.total)} W peak with headroom.` : s === 'warning' ? `${psu.specs.wattage_w} W covers the estimated ${Math.round(power.total)} W, but is below the suggested ${power.recommended} W (25% headroom).` : `Estimated ${Math.round(power.total)} W exceeds the PSU's ${psu.specs.wattage_w} W.`, [psu.id], 'PSU wattage'));
  }
  const nv = (r.storage || []).filter((x) => x.part.specs.type === 'nvme').reduce((a, x) => a + x.qty, 0);
  if (mb && nv) {
    const ok = nv <= (mb.specs.m2_slots || 0);
    out.push(chk('m2', ok ? 'compatible' : 'incompatible', ok ? `${nv} M.2 drive(s) fit the ${mb.specs.m2_slots} M.2 slots.` : `${nv} M.2 drives selected but the board has ${mb.specs.m2_slots} M.2 slots.`, [mb.id, ...r.storage.map((x) => x.part.id)], 'Storage / Motherboard'));
  }
  const sata = (r.storage || []).filter((x) => x.part.specs.type !== 'nvme').reduce((a, x) => a + x.qty, 0);
  if (mb && sata && sata > (mb.specs.sata_ports || 0)) out.push(chk('sata', 'incompatible', `${sata} SATA drives but only ${mb.specs.sata_ports} SATA ports.`, [mb.id], 'SATA ports'));
  const fans = (r.fan || []).reduce((a, x) => a + x.qty, 0);
  if (c && fans && c.specs.fan_mounts && fans > c.specs.fan_mounts) out.push(chk('fan-mounts', 'warning', `${fans} fans selected; the case lists ${c.specs.fan_mounts} fan mounts. Only the first positions are shown in 3D.`, [c.id], 'Fan mounts'));

  const errors = out.filter((x) => x.status === 'incompatible').length;
  const warnings = out.filter((x) => x.status === 'warning').length;
  const unknown = out.filter((x) => x.status === 'unknown').length;
  const count = flat(r).filter((x) => ALL_SLOTS.find((s) => s.key === x.slot)).length;
  let overall = 'compatible';
  if (errors) overall = 'incompatible';
  else if (warnings) overall = 'warning';
  else if (!out.length || unknown) overall = 'unknown';
  const missing = REQUIRED_PC.filter((k) => !r[k]);
  const perPart = {};
  flat(r).forEach(({ part }) => {
    const mine = out.filter((x) => x.ids.includes(part.id));
    perPart[part.id] = mine.some((x) => x.status === 'incompatible') ? 'incompatible' : mine.some((x) => x.status === 'warning') ? 'warning' : mine.length ? 'compatible' : 'unknown';
  });
  return { checks: out, errors, warnings, unknown, overall, missing, perPart, count };
}

export const RESOLUTIONS = [
  { id: '1080m', label: '1080p Med', f: 1 },
  { id: '1080u', label: '1080p Ultra', f: 1.5 },
  { id: '1440u', label: '1440p Ultra', f: 2.4 },
  { id: '4km', label: '4K Medium', f: 2.8 },
  { id: '4ku', label: '4K Ultra', f: 4.5 },
];

const GAMES = [
  { name: 'Fortnite', gpu: 230, cpu: 320 },
  { name: 'Counter-Strike 2', gpu: 400, cpu: 450 },
  { name: 'Call of Duty', gpu: 170, cpu: 260 },
  { name: 'Valorant', gpu: 600, cpu: 650 },
  { name: 'Marvel Rivals', gpu: 140, cpu: 200 },
  { name: 'Elden Ring', gpu: 120, cpu: 130, cap: 60 },
  { name: 'League of Legends', gpu: 500, cpu: 600 },
  { name: 'Cyberpunk 2077', gpu: 130, cpu: 180 },
];

// Documented model: Time Spy-style weighted harmonic mean, and per-game FPS = min(GPU-limited, CPU-limited).
export function calcBenchmark(r, resId = '1440u') {
  const cpu = r.cpu?.[0]?.part;
  const gpu = r.gpu?.[0]?.part;
  const C = cpu?.specs?.ts_cpu;
  const G = gpu?.specs?.ts_gpu;
  const overall = C && G ? Math.round(1 / (0.85 / G + 0.15 / C)) : null;
  const res = RESOLUTIONS.find((x) => x.id === resId) || RESOLUTIONS[2];
  const games = GAMES.map((g) => {
    if (!C || !G) return { name: g.name, fps: null };
    const gpuFps = (g.gpu * (G / 20000)) / res.f;
    const cpuFps = g.cpu * (C / 13000);
    let fps = Math.min(gpuFps, cpuFps);
    if (g.cap) fps = Math.min(fps, g.cap);
    return { name: g.name, fps: Math.round(fps), limit: cpuFps < gpuFps ? 'CPU' : 'GPU' };
  });
  return { C, G, overall, games, cpuName: cpu?.name, gpuName: gpu?.name };
}

export function summarize(items, byId) {
  const r = resolveItems(items, byId);
  const price = calcPrice(r);
  const power = calcPower(r);
  const compat = calcCompat(r);
  const bench = calcBenchmark(r);
  return { r, price, power, compat, bench };
}