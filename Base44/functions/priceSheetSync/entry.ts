import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SHEET_TAB = 'Prices';
const MAX_ROWS = 400;
const HEADERS = ['Part ID', 'Category', 'Part', 'Brand', 'Reference price', 'Best price', 'Best supplier', 'Product page', 'Amazon', 'Newegg', 'Micro Center', 'Updated'];

const money = (n) => (Number.isFinite(Number(n)) ? Math.round(Number(n) * 100) / 100 : '');
const esc = (s) => String(s ?? '').replace(/"/g, '""');

// only real product pages are ever written: a live listing's own page, or the brand's page for the part

// a clickable cell that opens the page the price was read from
function link(url, label) {
  return url ? `=HYPERLINK("${esc(url)}","${esc(label)}")` : esc(label);
}

function offersOf(part) {
  const offers = Array.isArray(part.offers) ? part.offers : [];
  const find = (name) => offers.find((o) => String(o.supplier || '').toLowerCase().includes(name)) || null;
  const sorted = offers.filter((o) => Number.isFinite(Number(o.price))).sort((a, b) => a.price - b.price);
  return {
    best: sorted[0] || null,
    amazon: find('amazon'),
    newegg: find('newegg'),
    micro: find('micro'),
  };
}

async function sheets(token, path, init = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Sheets ${res.status}: ${detail.slice(0, 160)}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Sign in to sync the price sheet.' }, { status: 401 });

    let accessToken = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('googlesheets');
      accessToken = conn && conn.accessToken;
    } catch (e) {
      accessToken = null;
    }
    if (!accessToken) {
      return Response.json({ error: 'Google Sheets is not connected yet. Connect it from the app dashboard, then sync again.' }, { status: 400 });
    }

    const parts = (await base44.entities.Part.list('-created_date', MAX_ROWS)) || [];
    const rows = [HEADERS];
    parts.forEach((p) => {
      const o = offersOf(p);
      // the brand's own page for this part, used whenever no live retailer listing exists yet
      const productPage = p.product_url || '';
      const buyPage = o.best?.url || productPage;
      const storeCell = (offer) => (offer && (offer.url || offer.price) ? link(offer.url, money(offer.price)) : '');
      rows.push([
        p.id,
        p.category || '',
        link(buyPage, p.name || ''),
        p.brand || '',
        money(p.reference_price ?? p.price),
        link(buyPage, money(o.best ? o.best.price : p.price)),
        o.best?.supplier || '',
        productPage ? link(productPage, 'Open product page') : '',
        storeCell(o.amazon),
        storeCell(o.newegg),
        storeCell(o.micro),
        p.price_updated_at || '',
      ]);
    });

    const existing = (await base44.entities.PriceSheet.list('-created_date', 1).catch(() => []))[0];
    let sheet = existing;
    if (!sheet) {
      const created = await sheets(accessToken, '', {
        method: 'POST',
        body: JSON.stringify({
          properties: { title: 'RigForge Part Prices' },
          sheets: [{ properties: { title: SHEET_TAB } }],
        }),
      });
      sheet = await base44.asServiceRole.entities.PriceSheet.create({
        spreadsheet_id: created.spreadsheetId,
        title: created.properties?.title || 'RigForge Part Prices',
        url: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
      });
    }

    const id = sheet.spreadsheet_id;
    await sheets(accessToken, `/${id}/values/${SHEET_TAB}:clear`, { method: 'POST', body: JSON.stringify({}) });
    await sheets(accessToken, `/${id}/values/${SHEET_TAB}!A1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ range: `${SHEET_TAB}!A1`, majorDimension: 'ROWS', values: rows }),
    });

    const record = await base44.asServiceRole.entities.PriceSheet.update(sheet.id, {
      rows: rows.length - 1,
      synced_at: new Date().toISOString(),
    });

    return Response.json({
      url: record.url,
      rows: record.rows,
      synced_at: record.synced_at,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}