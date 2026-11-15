import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, DollarSign, Zap, Gauge, BadgeCheck, AlertTriangle, XCircle, HelpCircle, ExternalLink, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ThreeViewport from '@/three/ThreeViewport';
import ViewportControls from '@/components/builder/ViewportControls';
import Logo from '@/components/layout/Logo';
import ShareRow from '@/components/share/ShareRow';
import { summarize } from '@/lib/buildCalc';
import BuildFpsSection from '@/components/charts/BuildFpsSection';
import { ALL_SLOTS, DEFAULT_SETTINGS, money, productUrl } from '@/lib/catalogMeta';

const COMPAT = {
  compatible: { label: 'Compatible', color: '#3b82f6', Icon: BadgeCheck },
  warning: { label: 'Warnings', color: '#f1c40f', Icon: AlertTriangle },
  incompatible: { label: 'Incompatible', color: '#ef4444', Icon: XCircle },
  unknown: { label: 'Unverified', color: '#94a3b8', Icon: HelpCircle },
};

const Metric = ({ color, Icon, children }) => (
  <span className="flex items-center gap-1.5 rounded-md border border-[#242424] bg-[#161616] px-2.5 py-1.5 text-[13px] font-semibold" style={{ color }}>
    <Icon className="h-3.5 w-3.5" />{children}
  </span>
);

export default function SharedBuild() {
  const { id } = useParams();
  const view = useRef(null);
  const [mode, setMode] = useState('pc');

  const { data, isLoading } = useQuery({
    queryKey: ['shared-build', id],
    queryFn: async () => {
      const rows = await base44.entities.Build.filter({ id });
      const build = rows[0] || null;
      if (!build) return null;
      const parts = await base44.entities.Part.list('-created_date', 500);
      return { build, parts };
    },
  });

  const build = data?.build;
  const summary = useMemo(() => {
    if (!build) return null;
    const byId = Object.fromEntries((data.parts || []).map((p) => [p.id, p]));
    return summarize(build.items || {}, byId);
  }, [data, build]);

  const missing = !isLoading && !build;
  useEffect(() => {
    if (!missing) return;
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [missing]);

  const settings = { ...DEFAULT_SETTINGS, ...(build?.settings || {}) };
  const c = COMPAT[summary?.compat.overall] || COMPAT.unknown;
  const shareUrl = build ? `${window.location.origin}/b/${build.id}` : '';

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#f5f5f7]">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#1f1f1f] bg-[#0f0f0f]/95 px-4 py-2.5 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-[16px] font-extrabold uppercase tracking-[-0.02em] text-white">RigForge</span>
        </Link>
        <span className="ml-1 rounded-full bg-[#1c1c1c] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#b3b3bb]">Shared build</span>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/products" className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#b3b3bb] transition-colors hover:bg-[#171717] hover:text-white sm:flex"><ArrowLeft className="h-3.5 w-3.5" />Browse parts</Link>
          <Link to="/" className="rounded-md bg-[#00cc66] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90">Build your own</Link>
        </div>
      </header>

      {isLoading && <p className="px-6 py-24 text-center text-[13px] text-[#71717a]">Loading this build…</p>}

      {missing && (
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="text-[20px] font-semibold text-white">This build isn't available</h1>
          <p className="mt-2 text-[13px] text-[#8b8b94]">The link may be wrong, or the builder has it set to private.</p>
          <Link to="/" className="mt-6 inline-block rounded-md bg-[#00cc66] px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90">Start your own build</Link>
        </div>
      )}

      {build && summary && (
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative h-[360px] overflow-hidden rounded-xl border border-[#222] bg-[#0b0b0b] sm:h-[460px]">
              <ThreeViewport ref={view} resolved={summary.r} settings={settings} mode={mode} active />
              <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 rounded-full border border-[#262626] bg-[#161616]/90 p-0.5 backdrop-blur">
                {[['pc', 'PC Build'], ['setup', 'Setup']].map(([k, n]) => (
                  <button key={k} onClick={() => setMode(k)} className={`rounded-full px-4 py-1 text-[11px] font-medium transition-colors ${mode === k ? 'bg-[#2a2a2a] text-white' : 'text-[#8b8b94] hover:text-white'}`}>{n}</button>
                ))}
              </div>
              <ViewportControls viewRef={view} />
            </div>

            <div className="min-w-0">
              <span className="rounded-full bg-[#1c1c1c] px-2 py-0.5 text-[10px] font-medium text-[#b3b3bb]">{build.build_category || 'Gaming'}</span>
              <h1 className="mt-2 text-[24px] font-semibold leading-tight text-white">{build.title}</h1>
              <p className="mt-1 text-[12px] text-[#71717a]">
                by {build.author_name || 'Anonymous'} · {build.created_date ? new Date(build.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </p>
              {build.description && <p className="mt-3 text-[12.5px] leading-relaxed text-[#b3b3bb]">{build.description}</p>}

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Metric color="#00cc66" Icon={DollarSign}>{money(summary.price.total)}</Metric>
                <Metric color={c.color} Icon={c.Icon}>{c.label}</Metric>
                <Metric color="#f1c40f" Icon={Zap}>{Math.round(summary.power.total * 10) / 10}W</Metric>
                <Metric color="#f1c40f" Icon={Gauge}>{summary.bench.overall ? `3DMark ${summary.bench.overall.toLocaleString()}` : 'No data'}</Metric>
              </div>

              <div className="mt-4 rounded-xl border border-[#222] bg-[#121212] p-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71717a]">Share this build</div>
                <div className="mb-2 truncate rounded-md border border-[#242424] bg-[#0d0d0d] px-2 py-1.5 text-[11px] text-[#8b8b94]">{shareUrl}</div>
                <ShareRow url={shareUrl} note="Anyone with this link can open the build — no account needed." />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/build/${build.id}`} className="flex items-center gap-1.5 rounded-md border border-[#2e2e2e] bg-[#161616] px-3 py-2 text-[12px] font-medium text-[#d4d4d8] transition-colors hover:border-[#3d3d3d] hover:text-white">
                  <Pencil className="h-3.5 w-3.5" />Clone in builder
                </Link>
                <span className="self-center text-[10px] text-[#5f5f68]">Saving the clone keeps your own copy.</span>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-xl border border-[#222] bg-[#121212]">
            <div className="flex items-center justify-between border-b border-[#222] px-4 py-2.5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71717a]">Parts in this build</h2>
              <span className="tabular text-[13px] font-semibold text-[#00cc66]">{money(summary.price.total)}</span>
            </div>
            <div className="grid gap-x-8 px-4 py-2 sm:grid-cols-2">
              {ALL_SLOTS.filter((s) => summary.r[s.key]?.length).map((s) => (
                <div key={s.key} className="border-b border-[#1c1c1c] py-2.5 last:border-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f5f68]">{s.label}</div>
                  {summary.r[s.key].map((row, i) => (
                    <div key={`${row.part.id}-${i}`} className="mt-1 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] leading-snug text-white">{row.part.name}{row.qty > 1 ? ` × ${row.qty}` : ''}</div>
                        <div className="text-[11px] text-[#71717a]">{money(row.part.price)} each</div>
                      </div>
                      {productUrl(row.part) && (
                        <a href={productUrl(row.part)} target="_blank" rel="noreferrer" title={`Open ${row.part.name} product page`} className="mt-0.5 flex shrink-0 items-center gap-1 rounded bg-[#0b6fe0] px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-[#0a63c7]">Buy <ExternalLink className="h-2.5 w-2.5" /></a>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <BuildFpsSection r={summary.r} />

          <p className="mt-4 text-center text-[10px] text-[#5f5f68]">Prices are reference prices, not live retailer prices. Compatibility and benchmark figures are estimates.</p>
        </div>
      )}
    </div>
  );
}