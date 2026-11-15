// Physical fit between a case and the GPU / CPU cooler that sit inside it.

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// radiator core plus the fans stacked on it, in millimetres
export const radiatorDepth = (sizeMm) => ((sizeMm || 240) >= 420 ? 55 : 52);

export const defaultMount = (coolerPart) => ((coolerPart?.specs?.radiator_mm || 240) >= 360 ? 'front' : 'top');

// How much card length the case really leaves once a front radiator is mounted.
export function gpuClearance(casePart, coolerRow) {
  const max = num(casePart?.specs?.max_gpu_mm);
  if (max == null) return null;
  const cc = coolerRow?.part?.specs || coolerRow?.specs || {};
  const mount = coolerRow?.config?.mount || defaultMount({ specs: cc });
  if (cc.type === 'aio' && mount === 'front') return Math.max(0, max - radiatorDepth(cc.radiator_mm));
  return max;
}

export function gpuFitsCase(casePart, gpuPart, coolerRow) {
  const len = num(gpuPart?.specs?.length_mm);
  const clear = gpuClearance(casePart, coolerRow);
  if (len == null || clear == null) return null;
  return len <= clear;
}

export function radiatorFit(casePart, coolerPart, mount) {
  const need = num(coolerPart?.specs?.radiator_mm) || 240;
  const cs = casePart?.specs || {};
  const m = mount || defaultMount(coolerPart);
  const max = m === 'front' ? num(cs.rad_front) : num(cs.rad_top);
  return (max || 0) >= need;
}

export function coolerFitsCase(casePart, coolerPart, config = {}) {
  const cc = coolerPart?.specs || {};
  const cs = casePart?.specs || {};
  if (cc.type === 'aio') {
    const m = config.mount || defaultMount(coolerPart);
    return radiatorFit(casePart, coolerPart, m) || radiatorFit(casePart, coolerPart, m === 'front' ? 'top' : 'front');
  }
  const maxH = num(cs.max_cooler_mm);
  const h = num(cc.height_mm);
  if (maxH == null || h == null) return null;
  return h <= maxH;
}

// The strongest GPU / cooler that still fits the chosen case.
const bestGpu = (casePart, coolerRow, parts) => parts
  .filter((p) => p.category === 'gpu' && p.active !== false && gpuFitsCase(casePart, p, coolerRow) === true)
  .sort((a, b) => (b.specs?.ts_gpu || 0) - (a.specs?.ts_gpu || 0))[0];

const bestCooler = (casePart, parts) => parts
  .filter((p) => p.category === 'cooler' && p.active !== false && coolerFitsCase(casePart, p, {}) === true)
  .sort((a, b) => (b.specs?.tdp_rating_w || 0) - (a.specs?.tdp_rating_w || 0))[0];

// Re-fits an existing selection to a newly chosen case: swaps a card or cooler that no
// longer fits for the strongest catalog part that does, and reports what could not fit.
export function fitItemsToCase(items, casePart, parts, byId) {
  const next = { ...items };
  const swaps = [];
  const missing = [];

  // the cooler is settled first: a front radiator changes how much card length is left
  const clRow = next.cooler?.[0];
  const clPart = clRow && byId[clRow.partId];

  if (clPart) {
    if (coolerFitsCase(casePart, clPart, clRow.config) === false) {
      const alt = bestCooler(casePart, parts);
      if (alt) {
        const mount = alt.specs?.type === 'aio' ? defaultMount(alt) : null;
        next.cooler = [{ partId: alt.id, qty: 1, config: mount ? { mount } : {} }];
        swaps.push(`${clPart.name} → ${alt.name}`);
      } else missing.push(clPart);
    } else if (clPart.specs?.type === 'aio' && clRow.config?.mount && !radiatorFit(casePart, clPart, clRow.config.mount)) {
      const mount = radiatorFit(casePart, clPart, 'front') ? 'front' : radiatorFit(casePart, clPart, 'top') ? 'top' : clRow.config.mount;
      if (mount !== clRow.config.mount) {
        next.cooler = [{ ...clRow, config: { ...clRow.config, mount } }];
        swaps.push(`moved the ${clPart.name} radiator to the ${mount} mount`);
      }
    }
  }

  const fittedCl = next.cooler?.[0];
  const fittedClPart = fittedCl && byId[fittedCl.partId];
  const coolerRow = fittedClPart ? { part: fittedClPart, config: fittedCl.config || {} } : null;

  const gpuRow = next.gpu?.[0];
  const gpuPart = gpuRow && byId[gpuRow.partId];
  if (gpuPart && gpuFitsCase(casePart, gpuPart, coolerRow) === false) {
    const alt = bestGpu(casePart, coolerRow, parts);
    if (alt) {
      next.gpu = [{ ...gpuRow, partId: alt.id }];
      swaps.push(`${gpuPart.name} → ${alt.name}`);
    } else missing.push(gpuPart);
  }

  return { items: next, swaps, missing };
}