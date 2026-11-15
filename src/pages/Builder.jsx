import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ListPlus } from 'lucide-react';
import TelemetryBar from '@/components/builder/TelemetryBar';
import ActionBar from '@/components/builder/ActionBar';
import ViewportPanel from '@/components/builder/ViewportPanel';
import BuildModals from '@/components/builder/BuildModals';
import PartsDrawer from '@/components/parts/PartsDrawer';
import AiAdvisor from '@/components/advisor/AiAdvisor';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useBuilder } from '@/hooks/useBuilder';

export default function Builder() {
  const { id } = useParams();
  const { openBuild } = useBuilder();
  const [hide3D, setHide3D] = useState(false);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [advisor, setAdvisor] = useState(false);
  const viewRef = useRef(null);
  useEffect(() => { if (id) openBuild(id); }, [id]);
  return (
    <div className="flex h-full min-w-0">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TelemetryBar onOpen={setModal} />
        <ActionBar hide3D={hide3D} setHide3D={setHide3D} onSettings={() => setModal('settings')} onAdvisor={() => setAdvisor(true)} />
        <ViewportPanel hide3D={hide3D} viewRef={viewRef} onRender={() => setModal('render')} />
        <button onClick={() => setDrawer(true)} className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#ff2a85] px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg lg:hidden"><ListPlus className="h-4 w-4" />Parts</button>
      </div>
      <aside className="hidden w-[372px] shrink-0 border-l border-[#1f1f1f] bg-[#0f0f0f] lg:block"><PartsDrawer /></aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="bottom" className="h-[85vh] border-[#262626] bg-[#0f0f0f] p-0"><SheetTitle className="sr-only">Parts</SheetTitle><PartsDrawer /></SheetContent>
      </Sheet>
      <BuildModals kind={modal} onClose={() => setModal(null)} viewRef={viewRef} />
      <AiAdvisor open={advisor} onOpenChange={setAdvisor} />
    </div>
  );
}