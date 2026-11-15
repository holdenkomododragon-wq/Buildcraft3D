// A demo rig drawn when the build is still empty, so the 3D viewport always shows
// a real PC instead of a bare case. It swaps out as soon as a PC part is added.
const part = (category, specs) => ({ part: { id: `showcase-${category}`, name: category, category, specs }, qty: 1, config: {} });

export const SHOWCASE = {
  case: [part('case', {
    dims_mm: { l: 480, h: 470, w: 235 }, color: 'black', form_factors: ['ATX', 'mATX', 'Mini-ITX', 'E-ATX'],
    max_gpu_mm: 392, max_cooler_mm: 180, psu_form: 'ATX', psu_max_mm: 210, rad_front: 360, rad_top: 360, fan_mounts: 8, glass: true,
  })],
  motherboard: [part('motherboard', { socket: 'AM5', form_factor: 'ATX', memory: 'DDR5', ram_slots: 4 })],
  cpu: [part('cpu', { socket: 'AM5' })],
  cooler: [part('cooler', { type: 'aio', radiator_mm: 360, fan_count: 3, rgb: true, sockets: ['AM5', 'AM4'] })],
  gpu: [part('gpu', { length_mm: 304, height_mm: 130, thickness_mm: 55, fan_count: 3 })],
  ram: [part('ram', { modules: 2, rgb: true, memory: 'DDR5' })],
  psu: [part('psu', { length_mm: 160, wattage_w: 850 })],
  storage: [part('storage', { type: 'nvme' }), part('storage', { type: 'nvme' })],
  fan: [{ ...part('fan', { size_mm: 120, rgb: true }), qty: 3 }],
  desk: [part('desk', { width_mm: 1600, depth_mm: 800 })],
  monitor: [part('monitor', { diag_in: 27, aspect: 16 / 9 })],
  keyboard: [part('keyboard', { w: 380, d: 140 })],
  mouse: [part('mouse', {})],
  mousepad: [part('mousepad', { width_mm: 900, depth_mm: 400 })],
  headphones: [part('headphones', {})],
  lamp: [part('lamp', {})],
  speaker: [part('speaker', {})],
};