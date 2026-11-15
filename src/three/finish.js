import * as THREE from 'three';

// Real product finishes. A part can carry an exact paint code in specs.color_hex
// (plus specs.accent_hex for trims like the North's walnut front), otherwise its
// coarse specs.color name is mapped to the finish that ships with the product.
const NAMED = {
  black: 0x191b1f,
  white: 0xe9eaee,
  silver: 0xbfc4cd,
  grey: 0x71787f,
  gray: 0x71787f,
  graphite: 0x282b31,
  gunmetal: 0x3a3f47,
  walnut: 0x6b4a30,
  bamboo: 0xb59a6f,
  brown: 0x8d6b4a,
  beige: 0xd3c3a6,
  copper: 0xb9733a,
};

function asHex(v) {
  if (typeof v === 'number') return v;
  const s = String(v || '').trim().toLowerCase();
  if (!s) return null;
  if (/^#?[0-9a-f]{6}$/.test(s)) return s.startsWith('#') ? s : `#${s}`;
  return NAMED[s] ?? null;
}

export function partHex(part, fallback) {
  const s = part?.specs || {};
  return asHex(s.color_hex) ?? asHex(s.color) ?? fallback;
}

export function accentHex(part, fallback = null) {
  return asHex(part?.specs?.accent_hex) ?? fallback;
}

// same material, lighter (k > 1) or darker (k < 1)
export function shade(color, k) {
  const c = new THREE.Color(color);
  if (k < 1) c.multiplyScalar(k);
  else c.lerp(new THREE.Color(0xffffff), Math.min(1, k - 1));
  return c.getHex();
}

export const finishMat = (part, fallback, opts = {}) =>
  new THREE.MeshStandardMaterial({ color: partHex(part, fallback), metalness: 0.3, roughness: 0.6, ...opts });