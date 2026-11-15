import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const MAX_CASES_PER_REQUEST = 8;
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const FRONT_STYLES = ['mesh', 'panoramic-glass', 'solid-ribbed', 'wood-slats'];
const FORM_FACTORS = ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'];
const MANUFACTURERS: Array<[string, string[]]> = [
  ['Lian Li', ['lian-li.com']],
  ['Fractal Design', ['fractal-design.com']],
  ['Corsair', ['corsair.com']],
  ['NZXT', ['nzxt.com']],
  ['Phanteks', ['phanteks.com']],
  ['be quiet!', ['bequiet.com']],
  ['Cooler Master', ['coolermaster.com']],
  ['Thermaltake', ['thermaltake.com']],
  ['Montech', ['montechpc.com']],
  ['SilverStone', ['silverstonetek.com']],
  ['HYTE', ['hyte.com']],
  ['Antec', ['antec.com']],
  ['DeepCool', ['deepcool.com']],
  ['JONSBO', ['jonsbo.com']],
];

function bounded(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(Math.max(min, Math.min(max, parsed))) : fallback;
}

function colorHex(value: unknown, fallback: string) {
  const color = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function normalizedUrl(value: unknown) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

function manufacturerFor(urlValue: unknown) {
  try {
    const host = new URL(String(urlValue || '')).hostname.toLowerCase().replace(/^www\./, '');
    return MANUFACTURERS.find(([, domains]) => domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) || null;
  } catch {
    return null;
  }
}

function normalizeCase(candidate: any, index: number, groundedUrls: Set<string>, existingUrls: Set<string>) {
  const productUrl = String(candidate?.product_url || '').trim();
  const source = manufacturerFor(productUrl);
  const productKey = normalizedUrl(productUrl);
  if (!source || !productKey || !groundedUrls.has(productKey) || existingUrls.has(productKey)) return null;

  const dims = candidate?.dims_mm || {};
  const dimensionValues = [Number(dims.l), Number(dims.h), Number(dims.w)];
  const gpu = Number(candidate?.max_gpu_mm);
  const cooler = Number(candidate?.max_cooler_mm);
  if (!dimensionValues.every((value) => Number.isFinite(value) && value >= 300 && value <= 650)
    || !Number.isFinite(gpu) || gpu < 200 || gpu > 500
    || !Number.isFinite(cooler) || cooler < 90 || cooler > 250) return null;
  const [length, height, width] = dimensionValues.map((value) => Math.round(value));
  const frontStyle = FRONT_STYLES.includes(candidate?.front_style) ? candidate.front_style : 'mesh';
  const supported = Array.isArray(candidate?.form_factors)
    ? candidate.form_factors.filter((form: string) => FORM_FACTORS.includes(form)).slice(0, 4)
    : [];
  const name = String(candidate?.name || '').replace(/[<>]/g, '').trim().slice(0, 72);
  if (!name || !supported.length) return null;
  const brand = source[0];
  const fullName = name.toLowerCase().includes(brand.toLowerCase()) ? name : `${brand} ${name}`;
  const specs: Record<string, unknown> = {
    dims_mm: { l: length, h: height, w: width },
    color_hex: colorHex(candidate?.color_hex, '#191b1f'),
    form_factors: supported,
    max_gpu_mm: bounded(gpu, length - 90, 200, 500),
    max_cooler_mm: bounded(cooler, Math.min(185, height - 285), 90, 250),
    psu_form: 'ATX',
    psu_max_mm: bounded(candidate?.psu_max_mm, length - 280, 140, 240),
    rad_front: [120, 240, 360, 420].includes(Number(candidate?.rad_front)) ? Number(candidate.rad_front) : 360,
    rad_top: [120, 240, 360, 420].includes(Number(candidate?.rad_top)) ? Number(candidate.rad_top) : 360,
    fan_mounts: bounded(candidate?.fan_mounts, 7, 3, 12),
    front_style: frontStyle,
    front_mesh_repeat: bounded(candidate?.front_mesh_repeat, 24, 10, 40),
    included_fan_count: bounded(candidate?.included_fan_count, 3, 0, 9),
  };
  if (frontStyle === 'wood-slats') specs.accent_hex = colorHex(candidate?.accent_hex, '#6b4a30');
  return { name: fullName, brand, productUrl, specs };
}

async function generateWithGemini(key: string, count: number, existingNames: string[]) {
  const excluded = existingNames.slice(0, 120).join('; ') || 'none';
  const prompt = `Find ${count} real, currently existing PC cases using Google Search. Do not invent product names or create fictional designs. Only use official product pages from these manufacturers: Lian Li, Fractal Design, Corsair, NZXT, Phanteks, be quiet!, Cooler Master, Thermaltake, Montech, SilverStone, HYTE, Antec, DeepCool, or JONSBO. Exclude these catalog names: ${excluded}.

Return one JSON object with a cases array. Each case must have the exact product name, product_url (the official manufacturer product page found in Search), dims_mm {l,h,w} in millimeters, color_hex, form_factors, max_gpu_mm, max_cooler_mm, psu_max_mm, rad_front, rad_top, fan_mounts, front_style, front_mesh_repeat, and included_fan_count. Use front_style mesh, panoramic-glass, solid-ribbed, or wood-slats to describe the real case's closest visible design. Only include cases whose official product source provides dimensions, motherboard support, GPU clearance, and CPU-cooler clearance. Do not write code, prices, retailer links, or guessed values. These specifications drive an approximate procedural model, not an exact product mesh.`;
  let lastError: unknown = null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`${model} returned ${response.status}`);
      const result = await response.json();
      const parts = result?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((part: { text?: string }) => part.text || '').join('');
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.cases)) throw new Error('Gemini returned no cases array');
      const groundedUrls = new Set(((result?.candidates?.[0]?.groundingMetadata?.groundingChunks) || [])
        .map((chunk: any) => normalizedUrl(chunk?.web?.uri))
        .filter(Boolean));
      return { cases: parsed.cases.slice(0, count), groundedUrls };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('No Gemini model answered');
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in as an administrator to generate case designs.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only administrators can add generated catalog cases.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const count = bounded(body.count, 8, 1, MAX_CASES_PER_REQUEST);
    let key: string | null = null;
    try { key = secrets.get('GEMINI_API_KEY'); } catch { /* missing server secret */ }
    if (!key) return Response.json({ error: 'GEMINI_API_KEY is not configured in Base44 Secrets.' }, { status: 503 });

    const existing = await base44.entities.Part.list('-created_date', 500);
    const existingCases = (existing || []).filter((part: any) => part.category === 'case');
    const existingUrls = new Set(existingCases.map((part: any) => normalizedUrl(part.product_url)).filter(Boolean));
    const existingNames = existingCases.map((part: any) => String(part.name || ''));
    const generated = await generateWithGemini(key, count, existingNames);
    const created = [];
    for (const [index, raw] of generated.cases.entries()) {
      const model = normalizeCase(raw, index, generated.groundedUrls, existingUrls);
      if (!model) continue;
      existingUrls.add(normalizedUrl(model.productUrl));
      created.push(await base44.entities.Part.create({
        name: model.name,
        category: 'case',
        brand: model.brand,
        product_url: model.productUrl,
        description: 'Real manufacturer case; specifications grounded to the official product page. Interactive 3D is procedurally approximated.',
        model_kind: 'generic_procedural',
        specs: model.specs,
        active: true,
      }));
    }
    if (!created.length) return Response.json({ error: 'Gemini did not return new cases with verifiable official manufacturer links and complete dimensions/clearances. Try again.' }, { status: 502 });
    return Response.json({ created, count: created.length, model_source: 'gemini-specs-plus-procedural-renderer' });
  } catch (error) {
    return Response.json({ error: `Could not generate case designs: ${String((error as Error)?.message || error).slice(0, 240)}` }, { status: 500 });
  }
}