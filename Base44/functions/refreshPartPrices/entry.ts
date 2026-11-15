import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const MAX_PARTS = 12;
const FRESH_MS = 55 * 60 * 1000;

const SUPPLIERS = [
  { name: 'Amazon', test: /amazon/i },
  { name: 'Newegg', test: /newegg/i },
  { name: 'Micro Center', test: /micro\s*center/i },
];
const SUPPLIER_DOMAINS: Record<string, string[]> = {
  Amazon: ['amazon.com'],
  Newegg: ['newegg.com'],
  'Micro Center': ['microcenter.com'],
};

function directRetailerUrl(source, value) {
  const supplier = SUPPLIERS.find((item) => item.test.test(String(source || '')));
  if (!supplier || !value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const allowed = SUPPLIER_DOMAINS[supplier.name].some((domain) => host === domain || host.endsWith(`.${domain}`));
    return url.protocol === 'https:' && allowed && !/(^|\/)s(?:earch)?(?:\/|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

function urlKey(value) {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set(['the', 'and', 'with', 'for', 'pro', 'plus', 'series', 'edition', 'black', 'white', 'wifi', 'gen', 'new', 'gb', 'tb', 'inch']);

const query = (part) => `${part.brand ? `${part.brand} ` : ''}${part.name}`.trim();

function plausible(part, title) {
  const t = norm(title);
  const words = norm(`${part.brand || ''} ${part.name}`).split(' ').filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) return true;
  const hits = words.filter((w) => t.includes(w)).length;
  return hits >= Math.min(2, words.length);
}

async function serpLookup(key, part) {
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query(part))}&gl=us&hl=en&num=20&api_key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`SerpApi responded ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data.shopping_results) ? data.shopping_results : []).map((r) => ({
    source: String(r.source || ''),
    title: String(r.title || ''),
    price: Number(r.extracted_price),
    url: String(r.product_link || r.link || ''),
  }));
}

async function rainLookup(key, part) {
  const url = `https://api.rainforestapi.com/request?api_key=${encodeURIComponent(key)}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(query(part))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Rainforest responded ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data.search_results) ? data.search_results : []).map((r) => ({
    source: 'Amazon',
    title: String(r.title || ''),
    price: Number(r.price && r.price.value),
    url: String(r.link || ''),
  }));
}

// no price API needed: Gemini is pointed at the live web with Google Search grounding and
// reads the current listings straight off the retailers' pages
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

function geminiPrompt(part) {
  return `You are a price scout for a PC parts catalog. Today's date is ${new Date().toISOString().slice(0, 10)}.

Find the CURRENT US retail prices for this exact product:
Product: ${query(part)}
Brand: ${part.brand || 'unknown'}
Category: ${part.category}

Search the web and report only real listings from Amazon (amazon.com), Newegg (newegg.com) and Micro Center (microcenter.com) for THIS exact model. Ignore accessories, bundles, refurbished or open-box units, and different variants.

Reply with one JSON object and nothing else:
{"listings":[{"retailer":"Amazon","title":"the product title exactly as listed","price":1299.99,"url":"the direct product page URL"}]}

Rules: at most one listing per retailer, at most three listings. "price" is a plain number of US dollars taken from a result you actually saw. "url" must be a real product page, never a search page. If you cannot find a retailer's listing, leave that retailer out. Never invent a price or a URL.`;
}

async function geminiLookup(key, part) {
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: geminiPrompt(part) }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (!res.ok) throw new Error(`${model} (${res.status})`);
      const data = await res.json();
      const candidate = (data && data.candidates && data.candidates[0]) || {};
      const text = ((candidate.content && candidate.content.parts) || []).map((p) => (p && p.text) || '').join('');
      const parsed = JSON.parse(text);
      const listings = Array.isArray(parsed.listings) ? parsed.listings : [];
      const grounded = new Set(((candidate.groundingMetadata?.groundingChunks) || [])
        .map((chunk) => urlKey(chunk?.web?.uri))
        .filter(Boolean));
      const verified = listings.map((l) => ({
        source: String((l && l.retailer) || ''),
        title: String((l && l.title) || ''),
        price: Number(l && l.price),
        url: String((l && l.url) || ''),
      })).filter((listing) => directRetailerUrl(listing.source, listing.url) && grounded.has(urlKey(listing.url)));
      if (!verified.length) throw new Error(`${model} returned no grounded direct retailer product links`);
      return verified;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Gemini found no price');
}

async function lookup(part, keys) {
  const failures = [];
  const sources = [
    ['serp', (k) => serpLookup(k, part)],
    ['rain', (k) => rainLookup(k, part)],
    ['gemini', (k) => geminiLookup(k, part)],
  ];
  for (const [name, run] of sources) {
    if (!keys[name]) continue;
    try {
      const rows = await run(keys[name]);
      const verified = rows.filter((row) => directRetailerUrl(row.source, row.url) && Number.isFinite(row.price) && row.price > 0 && plausible(part, row.title));
      if (verified.length) return { rows: verified, provider: name };
      failures.push(`${name}: no verified direct product listings`);
    } catch (e) {
      failures.push(String((e && e.message) || e));
    }
  }
  throw new Error(failures.join(' · ') || 'No price source configured');
}

// one offer per supplier: the cheapest listing that is really this product and in a believable price range
function pickOffers(part, rows) {
  const ref = Number(part.reference_price ?? part.price) || 0;
  const now = new Date().toISOString();
  const out = [];
  SUPPLIERS.forEach((s) => {
    const candidates = rows
      .filter((r) => s.test.test(r.source) && Number.isFinite(r.price) && r.price > 0)
      .filter((r) => directRetailerUrl(r.source, r.url))
      .filter((r) => plausible(part, r.title))
      .filter((r) => !ref || (r.price >= ref * 0.45 && r.price <= ref * 2.2))
      .sort((a, b) => a.price - b.price);
    if (candidates[0]) {
      out.push({
        supplier: s.name,
        price: Math.round(candidates[0].price * 100) / 100,
        url: candidates[0].url,
        in_stock: true,
        updated_at: now,
      });
    }
  });
  return out.sort((a, b) => a.price - b.price);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Sign in to refresh prices.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.part_ids) ? [...new Set(body.part_ids.map((x) => String(x)))].slice(0, MAX_PARTS) : [];
    if (!ids.length) return Response.json({ error: 'No parts to price.' }, { status: 400 });

    const read = (name) => { try { return secrets.get(name); } catch (e) { return null; } };
    const keys = { serp: read('SERPAPI_KEY'), rain: read('RAINFOREST_API_KEY'), gemini: read('GEMINI_API_KEY') };
    if (!keys.serp && !keys.rain && !keys.gemini) {
      return Response.json({
        error: 'No live price source is configured. Add GEMINI_API_KEY, SERPAPI_KEY, or RAINFOREST_API_KEY in Base44 Secrets.',
      }, { status: 400 });
    }

    const rows = await base44.entities.Part.filter({ id: { $in: ids } });
    const parts = (Array.isArray(rows) ? rows : rows.items || []).slice(0, MAX_PARTS);

    const now = Date.now();
    const stale = parts.filter((p) => {
      if (body.force) return true;
      const times = (Array.isArray(p.offers) ? p.offers : []).map((o) => Date.parse(o.updated_at) || 0);
      return now - (times.length ? Math.max(...times) : 0) > FRESH_MS;
    });

    const updated = [];
    const failures = [];
    const providers = new Set();
    for (let i = 0; i < stale.length; i += 6) {
      const batch = stale.slice(i, i + 6);
      const settled = await Promise.allSettled(batch.map((p) => lookup(p, keys)));
      settled.forEach((res, j) => {
        const part = batch[j];
        if (res.status !== 'fulfilled') {
          failures.push(`${part.name}: ${String((res.reason && res.reason.message) || res.reason)}`);
          return;
        }
        providers.add(res.value.provider);
        const offers = pickOffers(part, res.value.rows);
        if (!offers.length) {
          failures.push(`${part.name}: no matching listing at Amazon, Newegg or Micro Center`);
          return;
        }
        const best = offers[0];
        updated.push({
          id: part.id,
          offers,
          price: best.price,
          reference_price: part.reference_price ?? part.price ?? null,
          price_source: `${best.supplier} · live`,
          price_updated_at: new Date().toISOString(),
        });
      });
    }

    if (updated.length) {
      await base44.asServiceRole.entities.Part.bulkUpdate(updated.map((u) => ({
        id: u.id,
        offers: u.offers,
        price: u.price,
        reference_price: u.reference_price,
        price_source: u.price_source,
        price_updated_at: u.price_updated_at,
      })));
    }

    return Response.json({
      updated,
      checked: stale.length,
      skipped: parts.length - stale.length,
      failures: failures.slice(0, 6),
      provider: [...providers].join(',') || 'none',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}