import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PriceModal from './modals/PriceModal';
import CompatModal from './modals/CompatModal';
import PowerModal from './modals/PowerModal';
import BenchModal from './modals/BenchModal';
import SettingsModal from './modals/SettingsModal';
import RenderModal from './modals/RenderModal';

const TITLES = { price: 'Build Price Breakdown', compat: 'Compatibility Status', power: 'Power Usage', bench: 'Build Performance', settings: 'Build Settings', render: 'Render' };

export default function BuildModals({ kind, onClose, viewRef }) {
  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto rounded-xl border-[#262626] bg-[#121212] ${kind === 'bench' ? 'max-w-4xl' : 'max-w-lg'}`}>
        <DialogHeader className="border-b border-[#262626] pb-3"><DialogTitle className="text-[15px] font-semibold text-white">{TITLES[kind]}</DialogTitle></DialogHeader>
        {kind === 'price' && <PriceModal />}
        {kind === 'compat' && <CompatModal />}
        {kind === 'power' && <PowerModal />}
        {kind === 'bench' && <BenchModal />}
        {kind === 'settings' && <SettingsModal />}
        {kind === 'render' && <RenderModal viewRef={viewRef} />}
      </DialogContent>
    </Dialog>
  );
}