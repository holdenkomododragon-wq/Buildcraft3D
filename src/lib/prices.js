// live retailer prices attached to each part by the refreshPartPrices function
export const PRICE_FRESH_MS = 60 * 60 * 1000;

export const newestOfferAt = (part) =>
  (Array.isArray(part?.offers) ? part.offers.reduce((t, o) => Math.max(t, Date.parse(o.updated_at) || 0), 0) : 0);

// a part is re-priced once an hour: anything older is worth another lookup
export const needsPriceRefresh = (part) => Date.now() - newestOfferAt(part) > PRICE_FRESH_MS;

export const offerLines = (part) => {
  const offers = Array.isArray(part?.offers) ? part.offers.filter((o) => Number(o?.price) > 0) : [];
  const min = offers.length ? Math.min(...offers.map((o) => o.price)) : null;
  return [...offers].sort((a, b) => a.price - b.price).map((o) => ({ ...o, best: o.price === min }));
};

export const bestOffer = (part) => offerLines(part)[0] || null;

export const timeAgo = (ts) => {
  if (!ts) return 'never';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
};