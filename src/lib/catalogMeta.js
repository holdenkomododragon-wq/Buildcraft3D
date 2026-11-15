export const PC_SLOTS = [
  { key: 'case', label: 'Case', multi: false },
  { key: 'cpu', label: 'CPU', multi: false },
  { key: 'motherboard', label: 'Motherboard', multi: false },
  { key: 'gpu', label: 'GPU', multi: false },
  { key: 'ram', label: 'RAM', multi: false, qty: true },
  { key: 'cooler', label: 'CPU Cooler', multi: false },
  { key: 'storage', label: 'Storage', multi: true },
  { key: 'psu', label: 'Power Supply', multi: false },
  { key: 'fan', label: 'Case Fan', multi: true, qty: true },
];

export const SETUP_SLOTS = [
  { key: 'desk', label: 'Desk', multi: false },
  { key: 'monitor', label: 'Monitor', multi: true },
  { key: 'keyboard', label: 'Keyboard', multi: false },
  { key: 'mouse', label: 'Mouse', multi: false },
  { key: 'headphones', label: 'Headphones', multi: false },
  { key: 'chair', label: 'Chair', multi: false },
  { key: 'lamp', label: 'Lighting', multi: true },
  { key: 'speaker', label: 'Speaker', multi: true, qty: true },
  { key: 'microphone', label: 'Microphone', multi: false },
  { key: 'webcam', label: 'Webcam', multi: false },
  { key: 'mousepad', label: 'Mousepad', multi: false },
];

export const ALL_SLOTS = [...PC_SLOTS, ...SETUP_SLOTS];
export const SLOT_LABEL = Object.fromEntries(ALL_SLOTS.map((s) => [s.key, s.label]));
export const REQUIRED_PC = ['case', 'cpu', 'motherboard', 'ram', 'storage', 'psu'];

export const DEFAULT_SETTINGS = {
  fansOn: true,
  rpm: 1200,
  rgbMode: 'solid',
  rgbColor: '#00cc66',
  showGlass: true,
  showGrid: true,
  // display toggles: hide the live retailer price feed or the predicted frame rates
  showLivePrices: true,
  showFps: true,
  // per-component 3D finishes; an empty value keeps the part's real colour
  componentColors: { gpu: '', cpu: '', ram: '', motherboard: '' },
};

export const BUILD_CATEGORIES = ['Gaming', 'Workstation', 'Streaming', 'Content creation', 'General use'];

export const money = (n) => (n == null ? 'Price unavailable' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

export const searchUrl = (name) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(name)}`;

// the part's own product page on the brand's site — never a search results page.
// empty string when the catalog has no confirmed page for that part.
export const productUrl = (part) => (part && part.product_url) || '';

export const emptyItems = () => ({});