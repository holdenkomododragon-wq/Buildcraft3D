import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { useToast } from '@/components/ui/use-toast';
import { ALL_SLOTS, DEFAULT_SETTINGS, SLOT_LABEL } from '@/lib/catalogMeta';
import { calcCompat, resolveItems, summarize } from '@/lib/buildCalc';
import { coolerFitsCase, gpuFitsCase } from '@/lib/caseFit';
import { needsPriceRefresh } from '@/lib/prices';
import { LOCAL_PREVIEW_CATALOG } from '@/lib/localPreviewCatalog';

const Ctx = createContext(null);
export const useBuilder = () => useContext(Ctx);

const DRAFT_KEY = 'rigforge_draft_v1';
const fresh = () => ({ id: null, title: 'New Build', description: '', visibility: 'private', category: 'Gaming', createdAt: new Date().toISOString(), items: {}, settings: { ...DEFAULT_SETTINGS }, priceHistory: [] });

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (d && d.items) {
      const settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
      if (['#ff2a85', '#ff2e8c'].includes(String(settings.rgbColor).toLowerCase())) settings.rgbColor = DEFAULT_SETTINGS.rgbColor;
      return { ...fresh(), ...d, settings };
    }
  } catch (e) { /* ignore corrupt draft */ }
  return fresh();
}

const fromRecord = (rec) => ({
  id: rec.id, title: rec.title, description: rec.description || '', visibility: rec.visibility || 'private', category: rec.build_category || 'Gaming',
  createdAt: rec.created_date, items: rec.items || {}, settings: { ...DEFAULT_SETTINGS, ...(rec.settings || {}) }, priceHistory: rec.price_history || [], ownerId: rec.created_by_id,
});

export function BuilderProvider({ children }) {
  const { toast } = useToast();
  const [build, setBuild] = useState(loadDraft);
  const [mode, setMode] = useState('pc');
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [focusPartId, setFocusPartId] = useState(null);
  const [newPrompt, setNewPrompt] = useState(false);
  const [priceSyncing, setPriceSyncing] = useState(false);
  const qc = useQueryClient();
  const savedJson = useRef(null);
  const autoPriced = useRef(false);
  const buildRef = useRef(build);
  const localPreview = !/^[a-f0-9]{24}$/i.test(appParams.appId || '');
  buildRef.current = build;

  useEffect(() => {
    if (localPreview) return;
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, [localPreview]);

  const { data: parts = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['parts', 'product-photos'],
    queryFn: () => base44.entities.Part.list('-created_date', 500),
    enabled: !localPreview,
    initialData: localPreview ? LOCAL_PREVIEW_CATALOG : undefined,
    staleTime: 300000,
  });
  const byId = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p])), [parts]);

  // nothing in the build is ever rewritten behind the user's back: a selection stays exactly
  // as chosen, and parts the catalog cannot resolve are simply left out of the computed view
  const summary = useMemo(() => summarize(build.items, byId), [build.items, byId]);

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(build)); }, [build]);

  const sig = (b) => JSON.stringify([b.title, b.description, b.visibility, b.category, b.items, b.settings]);
  const dirty = Object.keys(build.items).length > 0 && sig(build) !== savedJson.current;

  const patch = (p) => setBuild((b) => ({ ...b, ...p }));
  const setSettings = (p) => setBuild((b) => ({ ...b, settings: { ...b.settings, ...p } }));

  const addPart = useCallback((slot, part, idx = null) => {
    setFocusPartId(part.id);
    const meta = ALL_SLOTS.find((s) => s.key === slot);
    const base = buildRef.current.items;
    const list = [...(base[slot] || [])];
    if (idx != null && list[idx]) list[idx] = { partId: part.id, qty: list[idx].qty || 1, config: {} };
    else if (!meta?.multi) list.splice(0, list.length, { partId: part.id, qty: meta?.qty ? list[0]?.qty || 1 : 1, config: {} });
    else {
      const ex = list.findIndex((x) => x.partId === part.id);
      if (ex >= 0) list[ex] = { ...list[ex], qty: list[ex].qty + 1 };
      else list.push({ partId: part.id, qty: 1, config: {} });
    }
    const items = { ...base, [slot]: list };
    setBuild((b) => ({ ...b, items }));

    // a new case only reports what no longer fits — the card and cooler stay exactly as chosen
    let unfit = null;
    if (slot === 'case') {
      const out = [];
      const clRow = (base.cooler || [])[0];
      const clPart = clRow && byId[clRow.partId];
      if (clPart && coolerFitsCase(part, clPart, clRow.config || {}) === false) out.push(`${clPart.name} does not fit inside it`);
      const gpuRow = (base.gpu || [])[0];
      const gpuPart = gpuRow && byId[gpuRow.partId];
      const coolerRow = clPart ? { part: clPart, config: clRow.config || {} } : null;
      if (gpuPart && gpuFitsCase(part, gpuPart, coolerRow) === false) out.push(`${gpuPart.name} is too long for it`);
      if (out.length) unfit = out;
    }

    setTimeout(() => {
      if (unfit) toast({ title: 'Some of your parts do not fit this case', description: `${unfit.join(' · ')}. Nothing was changed — swap them yourself from the Parts panel.`, variant: 'destructive' });
      const c = calcCompat(resolveItems(buildRef.current.items, byId));
      const bad = c.checks.find((x) => x.status === 'incompatible' && x.ids.includes(part.id));
      if (bad) toast({ title: `${part.name} may not fit`, description: bad.message, variant: 'destructive' });
    }, 50);
  }, [byId, toast]);

  const removePart = (slot, idx) => setBuild((b) => {
    const list = (b.items[slot] || []).filter((_, i) => i !== idx);
    const items = { ...b.items };
    if (list.length) items[slot] = list; else delete items[slot];
    return { ...b, items };
  });
  const updateItem = (slot, idx, p) => setBuild((b) => {
    const list = [...(b.items[slot] || [])];
    list[idx] = { ...list[idx], ...p };
    return { ...b, items: { ...b.items, [slot]: list } };
  });

  const newBuild = () => { setBuild(fresh()); savedJson.current = null; setMode('pc'); };
  const requestNewBuild = () => (Object.keys(build.items).length ? setNewPrompt(true) : newBuild());

  const loadBuild = (rec) => { const b = fromRecord(rec); setBuild(b); savedJson.current = sig(b); };
  const openBuild = async (id) => {
    const rows = await base44.entities.Build.filter({ id });
    if (rows[0]) loadBuild(rows[0]);
    return rows[0] || null;
  };
  const cloneFromRecord = (rec) => {
    setBuild({ ...fromRecord(rec), id: null, ownerId: null, title: `${rec.title} (clone)`, visibility: 'private', createdAt: new Date().toISOString(), priceHistory: [] });
    savedJson.current = null;
    setMode('pc');
  };
  const cloneBuild = () => { setBuild((b) => ({ ...b, id: null, ownerId: null, title: `${b.title} (clone)`, visibility: 'private', createdAt: new Date().toISOString(), priceHistory: [] })); savedJson.current = null; toast({ title: 'Build cloned', description: 'A new independent copy is ready. Save it to keep it.' }); };

  const save = async (overrides = {}) => {
    const src = { ...build, ...overrides };
    const me = user || (await base44.auth.me().catch(() => null));
    if (!me) { window.location.href = `/login?returnTo=${encodeURIComponent('/')}`; return null; }
    setUser(me);
    setSaving(true);
    const last = src.priceHistory[src.priceHistory.length - 1];
    const total = Number(summary.price.total.toFixed(2));
    const priceHistory = !last || last.total !== total ? [...src.priceHistory, { date: new Date().toISOString(), total }] : src.priceHistory;
    const data = {
      title: src.title, description: src.description, visibility: src.visibility, build_category: src.category, items: src.items, settings: src.settings,
      total_price: total, power_w: Math.round(summary.power.total), compat_status: summary.compat.overall, author_name: me.full_name || me.email,
      case_name: summary.r.case?.[0]?.part.name || '', cpu_name: summary.r.cpu?.[0]?.part.name || '', gpu_name: summary.r.gpu?.[0]?.part.name || '',
      timespy_estimate: summary.bench.overall || 0, price_history: priceHistory,
    };
    const canUpdate = src.id && src.ownerId === me.id;
    const rec = canUpdate ? await base44.entities.Build.update(src.id, data) : await base44.entities.Build.create(data);
    const next = { ...src, id: rec.id, ownerId: me.id, priceHistory };
    setBuild(next);
    savedJson.current = sig(next);
    setSaving(false);
    toast({ title: 'Build saved to your account' });
    return rec;
  };

  const signOut = () => base44.auth.logout('/');

  // live retailer prices: only the parts on screen are looked up, and only when they are an hour old
  const refreshPrices = useCallback(async (ids = null, force = false) => {
    const wanted = ids || Object.values(buildRef.current.items).flat().map((it) => it.partId);
    const selected = [...new Set(wanted)].map((id) => byId[id]).filter(Boolean).filter((p) => force || needsPriceRefresh(p));
    if (!selected.length) return { updated: [] };
    setPriceSyncing(true);
    try {
      const { data } = await base44.functions.invoke('refreshPartPrices', {
        part_ids: selected.slice(0, 12).map((p) => p.id),
        force,
      });
      const updated = (data && Array.isArray(data.updated)) ? data.updated : [];
      if (updated.length) {
        const patched = Object.fromEntries(updated.map((u) => [u.id, u]));
        qc.setQueryData(['parts', 'product-photos'], (old) => (Array.isArray(old) ? old.map((p) => (patched[p.id] ? { ...p, ...patched[p.id] } : p)) : old));
        // Keep the shared sheet in step with successfully refreshed catalog prices.
        try {
          await base44.functions.invoke('priceSheetSync', {});
        } catch (syncError) {
          const message = syncError?.response?.data?.error || 'Connect Google Sheets and retry from Settings.';
          toast({ title: 'Prices updated; sheet sync failed', description: message, variant: 'destructive' });
        }
      }
      return data || {};
    } catch (e) {
      const message = (e && e.response && e.response.data && e.response.data.error) || 'Live prices are unavailable right now.';
      toast({ title: 'Could not refresh prices', description: message, variant: 'destructive' });
      return { error: message };
    } finally {
      setPriceSyncing(false);
    }
  }, [byId, qc, toast]);

  // opening the builder re-prices the selected parts once per session, on the same hourly rule
  useEffect(() => {
    if (!user || autoPriced.current || catalogLoading || !parts.length) return;
    autoPriced.current = true;
    if (Object.values(buildRef.current.items).flat().length) refreshPrices().catch(() => null);
  }, [user, catalogLoading, parts, refreshPrices]);

  const value = {
    build, patch, setSettings, mode, setMode, user, parts, byId, catalogLoading, localPreview, summary, resolved: summary.r, dirty, saving, save, signOut, focusPartId, setFocusPartId, refreshPrices, priceSyncing,
    addPart, removePart, updateItem, newBuild, requestNewBuild, newPrompt, setNewPrompt, loadBuild, openBuild, cloneBuild, cloneFromRecord, SLOT_LABEL,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}