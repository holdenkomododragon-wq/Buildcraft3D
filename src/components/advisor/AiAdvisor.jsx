import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useBuilder } from '@/hooks/useBuilder';
import { calcBenchmark, calcCompat, resolveItems } from '@/lib/buildCalc';
import { ADVISOR_DAY_LIMIT, loadAdvisorUsage } from '@/lib/advisorQuota';
import AdvisorBubble from './AdvisorBubble';
import { Sparkles, Send, Loader2, Gauge } from 'lucide-react';

const STARTERS = ['1440p gaming', 'Workstation for video editing', 'Streaming while I game', 'Everyday office use'];

export default function AiAdvisor({ open, onOpenChange }) {
  const { build, resolved, summary, byId, patch, user } = useBuilder();
  const { toast } = useToast();
  const [log, setLog] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState({ used: null, limit: ADVISOR_DAY_LIMIT });
  const scrollRef = useRef(null);
  const left = quota.used == null ? null : Math.max(0, quota.limit - quota.used);

  // the exact same math the benchmark panel renders, run on the recommended parts
  const evaluate = (rows) => {
    const items = {};
    rows.forEach((r) => {
      if (r && r.part && r.part.id) items[r.slot] = [...(items[r.slot] || []), { partId: r.part.id, qty: 1, config: {} }];
    });
    const r = resolveItems(items, byId);
    const compat = calcCompat(r);
    const bench = calcBenchmark(r);
    return {
      fit: {
        overall: compat.overall,
        issues: compat.checks.filter((c) => c.status === 'incompatible' || c.status === 'warning').slice(0, 2).map((c) => c.message),
      },
      fps: bench.games,
    };
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log, loading]);

  // the remaining count is visible before the first question, not only after an answer
  useEffect(() => {
    if (!open) return;
    let dead = false;
    loadAdvisorUsage()
      .then(({ used }) => { if (!dead) setQuota((q) => ({ ...q, used })); })
      .catch(() => null);
    return () => { dead = true; };
  }, [open]);

  const ask = async (text) => {
    const value = String(text || '').trim();
    if (!value || loading) return;
    const next = [...log, { role: 'user', content: value }];
    setLog(next);
    setInput('');
    setError('');
    setLoading(true);
    try {
      const current = {};
      Object.entries(resolved || {}).forEach(([slot, rows]) => {
        if (rows && rows[0] && rows[0].part) current[slot] = rows[0].part.name;
      });
      const estimates = summary.compat.count ? {
        total_usd: Math.round(summary.price.total),
        power_w: Math.round(summary.power.total),
        time_spy: summary.bench.overall || 0,
        problems: summary.compat.checks.filter((c) => c.status === 'incompatible').slice(0, 4).map((c) => c.message),
        fps_1440p_ultra: summary.bench.games.filter((g) => g.fps).map((g) => `${g.name} ${g.fps}`),
      } : null;
      const res = await base44.functions.invoke('aiBuildAdvisor', {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        current,
        estimates,
      });
      const d = res.data || {};
      if (d.limit) setQuota({ used: Math.max(0, d.limit - (d.remaining ?? 0)), limit: d.limit });
      const rows = d.build || [];
      const verdict = rows.length ? evaluate(rows) : null;
      setLog([...next, {
        role: 'assistant',
        content: d.reply || '',
        questions: d.questions || [],
        build: rows,
        notes: d.notes || [],
        total: d.total || 0,
        fit: verdict ? verdict.fit : null,
        fps: verdict ? verdict.fps : [],
      }]);
    } catch (e) {
      setError((e && e.response && e.response.data && e.response.data.error) || 'The advisor could not answer just now. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // only ever on an explicit click: the recommendation replaces the slots it covers
  const apply = (rows) => {
    const items = { ...build.items };
    rows.forEach((r) => { delete items[r.slot]; });
    rows.forEach((r) => {
      if (!r.part || !r.part.id) return;
      items[r.slot] = [...(items[r.slot] || []), { partId: r.part.id, qty: 1, config: {} }];
    });
    patch({ items });
    toast({ title: 'Recommended parts applied', description: `${rows.length} parts added to your build. Swap anything you like.` });
    onOpenChange(false);
  };

  // the advisor is the one thing that needs an account — the builder itself does not
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md overflow-hidden rounded-xl border-[#262626] bg-[#101010] p-0">
          <div className="px-6 py-8 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#00cc66]/15"><Sparkles className="h-5 w-5 text-[#00cc66]" /></span>
            <DialogTitle className="mt-3 text-[15px] font-semibold text-white">Sign in to use the AI advisor</DialogTitle>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#8b8b94]">The 3D builder is free without an account. The advisor needs one so its daily request limit can be tracked against you and the API credits stay under control.</p>
            <Button onClick={() => { window.location.href = `/login?returnTo=${encodeURIComponent('/')}`; }} className="mt-4 h-9 w-full bg-[#00cc66] text-white hover:opacity-90">Sign in to continue</Button>
            <button type="button" onClick={() => onOpenChange(false)} className="mt-2 w-full rounded-md border border-[#262626] py-2 text-[12px] font-medium text-[#b3b3bb] transition-colors hover:border-[#3a3a3a] hover:text-white">Go back to the builder</button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(88vh,780px)] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border-[#262626] bg-[#101010] p-0">
        <div className="flex items-center gap-2 border-b border-[#1f1f1f] px-4 py-3 pr-12">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#00cc66]/15"><Sparkles className="h-4 w-4 text-[#00cc66]" /></span>
          <div className="min-w-0">
            <DialogTitle className="text-[14px] font-semibold text-white">Build advisor</DialogTitle>
            <p className="truncate text-[11px] text-[#71717a]">Answer a couple of questions and I'll design the build around what you actually do.</p>
          </div>
        </div>

        <div ref={scrollRef} className="thin-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {!log.length && (
            <div className="space-y-3">
              <p className="text-[13px] leading-relaxed text-[#c7c7cf]">Start with what matters most: what you do on the PC and roughly what you want to spend. I'll ask what I still need to know, then hand you a full parts list from the catalog that you can apply to this build.</p>
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => ask(s)} className="rounded-full border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[11px] text-[#b3b3bb] transition-colors hover:border-[#3d3d3d] hover:text-white">{s}</button>
                ))}
              </div>
            </div>
          )}
          {log.map((m, i) => (
            <AdvisorBubble key={i} msg={m} isLast={i === log.length - 1} disabled={loading} onAnswer={ask} onApply={apply} />
          ))}
          {loading && <div className="flex items-center gap-2 text-[12px] text-[#71717a]"><Loader2 className="h-3.5 w-3.5 animate-spin" />Thinking through your build…</div>}
          {error && <p className="text-[12px] text-[#f87171]">{error}</p>}
        </div>

        <div className="border-t border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-[#71717a]">
              <Gauge className="h-3 w-3 text-[#00cc66]" />
              {left == null ? 'Checking your daily allowance…' : `${left} of ${quota.limit} advisor requests left today`}
            </span>
            {left === 0 && <span className="text-[#f87171]">Resets tomorrow</span>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={left === 0 ? 'Daily limit reached' : 'Budget, games, software, screen…'} disabled={left === 0} className="h-9 border-[#262626] bg-[#141414] text-[12px] text-white placeholder:text-[#5f5f68]" />
            <Button type="submit" size="sm" disabled={loading || !input.trim() || left === 0} className="h-9 w-9 shrink-0 bg-[#00cc66] p-0 text-white hover:opacity-90">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}