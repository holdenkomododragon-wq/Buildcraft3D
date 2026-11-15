import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import Logo from './Logo';
import NewBuildDialog from '@/components/builder/NewBuildDialog';

export default function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#000000] text-[#f5f5f7]">
      <div className="hidden h-full md:block"><Sidebar /></div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[236px] border-[#262626] bg-[#0f0f0f] p-0">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2 md:hidden">
          <button onClick={() => setOpen(true)} className="rounded p-1.5 text-[#a1a1aa] hover:bg-[#1c1c1c]" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <Logo size={22} /><span className="font-bold">RigForge</span>
        </div>
        <main className="min-h-0 flex-1"><Outlet /></main>
      </div>
      <NewBuildDialog />
    </div>
  );
}