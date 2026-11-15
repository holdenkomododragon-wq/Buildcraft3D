import { NavLink, Link } from 'react-router-dom';
import { Box, Search, Trophy, FolderOpen, ArrowLeftRight, Plus, LogOut, UserCircle2 } from 'lucide-react';
import Logo from './Logo';
import { useBuilder } from '@/hooks/useBuilder';

const item = ({ isActive }) =>
  `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
    isActive ? 'bg-[#171717] text-white' : 'text-[#b3b3bb] hover:bg-[#151515] hover:text-white'
  }`;

const Section = ({ children }) => (
  <div className="px-4 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f5f68]">{children}</div>
);

export default function Sidebar({ onNavigate }) {
  const { user, requestNewBuild, signOut } = useBuilder();
  const Nav = ({ to, icon: Icon, children, badge, end }) => (
    <NavLink to={to} end={end} className={item} onClick={onNavigate}>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
      <span className="flex-1">{children}</span>
      {badge}
    </NavLink>
  );
  return (
    <aside className="flex h-full w-[236px] shrink-0 flex-col border-r border-[#1f1f1f] bg-[#0f0f0f]">
      <div className="flex items-center gap-2 px-4 pb-1 pt-5">
        <Logo size={26} />
        <span className="text-[19px] font-extrabold uppercase leading-none tracking-[-0.02em] text-white">RigForge</span>
        <span className="ml-auto rounded-full bg-[#1c1c1c] px-1.5 py-0.5 text-[9px] font-semibold text-[#d4d4d8]">BETA v1.0</span>
      </div>
      <Section>Builder</Section>
      <nav className="flex flex-col gap-0.5 px-2">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <Nav to="/" end icon={Box}>3D Builder</Nav>
          </div>
          <button onClick={requestNewBuild} className="flex items-center gap-1 rounded-full bg-[#171717] px-2 py-1 text-[10px] font-medium text-[#b3b3bb] transition-colors hover:bg-[#222] hover:text-white">
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        <Nav to="/products" icon={Search}>Products</Nav>
        <Nav
          to="/builds"
          icon={Trophy}
          badge={<span className="rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">Contest</span>}
        >
          Completed Builds
        </Nav>
      </nav>
      <Section>Your workspace</Section>
      <nav className="flex flex-col gap-0.5 px-2">
        <Nav to="/my-builds" icon={FolderOpen}>My Builds</Nav>
        <Nav to="/compare" icon={ArrowLeftRight}>Compare</Nav>
      </nav>
      <div className="mt-auto border-t border-[#1f1f1f] p-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2e8c] text-[12px] font-bold text-white">{(user.full_name || user.email || '?')[0].toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-white">{user.full_name || 'Builder'}</div>
              <div className="truncate text-[10px] text-[#71717a]">{user.email}</div>
            </div>
            <button onClick={signOut} title="Sign out" className="rounded p-1.5 text-[#8b8b94] hover:bg-[#171717] hover:text-white"><LogOut className="h-4 w-4" /></button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <UserCircle2 className="h-8 w-8 text-[#52525b]" strokeWidth={1.2} />
              <div>
                <div className="text-[12px] font-medium text-white">Anonymous</div>
                <div className="text-[10px] text-[#71717a]">Not signed in</div>
              </div>
            </div>
            <Link to="/login" className="block rounded-md bg-[#ff2e8c] py-2 text-center text-[12px] font-semibold text-white transition-opacity hover:opacity-90">Sign in to save builds</Link>
          </div>
        )}
      </div>
    </aside>
  );
}