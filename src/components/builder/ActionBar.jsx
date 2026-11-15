import { useEffect, useState } from 'react';
import { Copy, EyeOff, Eye, Files, Settings, Save, Loader2, Share2, Globe, Lock, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useBuilder } from '@/hooks/useBuilder';
import { ADVISOR_DAY_LIMIT, loadAdvisorUsage } from '@/lib/advisorQuota';
import { appParams } from '@/lib/app-params';

const btn = 'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#b3b3bb] transition-colors hover:bg-[#171717] hover:text-white';

export default function ActionBar({ hide3D, setHide3D, onSettings, onAdvisor }) {
  const { build, cloneBuild, save, saving, dirty, user } = useBuilder();
  const { toast } = useToast();
  const localPreview = !/^[a-f0-9]{24}$/i.test(appParams.appId || '');
  // the advisor allowance is visible on the bar, before opening the chat
  const [advisorLeft, setAdvisorLeft] = useState(null);
  useEffect(() => {
    if (!user) { setAdvisorLeft(null); return; }
    loadAdvisorUsage().then(({ used }) => setAdvisorLeft(Math.max(0, ADVISOR_DAY_LIMIT - used))).catch(() => null);
  }, [user]);
  const isPublic = build.visibility === 'public';
  const url = build.id && isPublic ? `${window.location.origin}/b/${build.id}` : '';
  const shareUrl = `${window.location.origin}/b/${build.id}`;

  const guard = () => {
    if (!build.id) { toast({ title: 'Save the build first', description: 'Saved builds get a link you can share.' }); return false; }
    if (!isPublic) { toast({ title: 'This build is private', description: 'Tap "Make public" to turn on the share link.' }); return false; }
    return true;
  };

  const copy = async () => {
    if (!guard()) return;
    try { await navigator.clipboard.writeText(shareUrl); } catch (e) { /* clipboard blocked */ }
    toast({ title: 'Public link copied', description: shareUrl });
  };

  const share = async () => {
    if (!guard()) return;
    if (navigator.share) {
      try { await navigator.share({ title: build.title, url: shareUrl }); return; } catch (e) { return; }
    }
    copy();
  };

  const makePublic = async () => {
    const rec = await save({ visibility: 'public' });
    if (rec) toast({ title: 'Build is now public', description: 'Anyone with the link can view it. Copy it from the bar above.' });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-[#1f1f1f] bg-[#0d0d0d] px-2 py-1.5 sm:gap-2 sm:px-3">
      {!localPreview && <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#242424] bg-[#131313] px-2 py-1">
        {isPublic && build.id ? <Globe className="h-3 w-3 shrink-0 text-[#00cc66]" /> : <Lock className="h-3 w-3 shrink-0 text-[#5f5f68]" />}
        <input
          readOnly
          value={build.id ? (isPublic ? shareUrl : 'Private build — no public link yet') : 'Save your build to get a public link'}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 bg-transparent text-[11px] text-[#8b8b94] outline-none"
        />
        {!isPublic && (
          <button onClick={makePublic} disabled={saving} className="shrink-0 rounded bg-[#00cc66] px-2 py-0.5 text-[10px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {saving ? 'Saving…' : 'Make public'}
          </button>
        )}
        <button onClick={copy} aria-label="Copy public link" title="Copy public link" className="text-[#5f5f68] transition-colors hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={share} aria-label="Share build" title="Share build" className="text-[#5f5f68] transition-colors hover:text-white"><Share2 className="h-3.5 w-3.5" /></button>
      </div>}
      <button onClick={() => setHide3D(!hide3D)} className={btn}>{hide3D ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{hide3D ? 'Show 3D' : 'Hide 3D'}</button>
      {!localPreview && <button onClick={cloneBuild} className={btn}><Files className="h-3.5 w-3.5" />Clone</button>}
      {!localPreview && <button
        onClick={onAdvisor}
        title={advisorLeft == null ? 'Ask the AI advisor' : `${advisorLeft} of ${ADVISOR_DAY_LIMIT} advisor requests left today`}
        className="flex items-center gap-1.5 rounded-md border border-[#00cc66]/40 bg-[#00cc66]/10 px-2.5 py-1.5 text-[12px] font-semibold text-[#00cc66] transition-colors hover:bg-[#00cc66]/20 hover:text-white"
      >
        <Sparkles className="h-3.5 w-3.5" />AI Advisor
        {advisorLeft != null && <span className="rounded bg-black/40 px-1 text-[10px] font-semibold text-white">{advisorLeft}</span>}
      </button>}
      <button onClick={onSettings} className={btn}><Settings className="h-3.5 w-3.5" />Settings</button>
      {!localPreview && <button onClick={() => save()} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-[#00cc66] px-3 py-1.5 text-[12px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}{dirty ? 'Save' : 'Saved'}
      </button>}
    </div>
  );
}