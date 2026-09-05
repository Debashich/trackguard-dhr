'use client';

// ============================================
// RESPONSIVE APP NAVIGATION BAR
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.8)
// Fixed bottom bar on mobile, fixed left rail on desktop
// ============================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, ClipboardList, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'New Report',
    href: '/report/new',
    icon: Camera,
    isPrimary: true,
  },
  {
    label: 'My Reports',
    href: '/queue',
    icon: ClipboardList,
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav when in camera viewfinder screen to maximize screen real estate
  const isCameraFullscreen = pathname === '/report/new';
  if (isCameraFullscreen) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation (fixed bottom, 64px + pb-safe) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161b24]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2 pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative -top-3 flex flex-col items-center"
                >
                  <div className="touch-target w-13 h-13 rounded-full bg-[#fbbf24] text-[#1c1300] flex items-center justify-center card-pressable glow-amber border-2 border-[#0f131a]">
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-mono text-[#fbbf24] font-bold mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'touch-target flex flex-col items-center py-1 px-3 rounded-xl transition-colors card-pressable',
                  isActive ? 'text-[#fbbf24]' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] font-mono', isActive ? 'font-bold' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Left Rail Navigation (hidden on mobile, 80px fixed width) */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-20 z-40 bg-[#161b24] border-r border-slate-800/80 flex-col items-center py-6 justify-between">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-[#fbbf24]/15 border border-[#fbbf24]/40 flex items-center justify-center text-lg font-black text-[#fbbf24]">
            TG
          </Link>
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            DHR
          </span>
        </div>

        <div className="flex flex-col items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className="touch-target w-12 h-12 rounded-2xl bg-[#fbbf24] text-[#1c1300] flex items-center justify-center card-pressable glow-amber"
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'touch-target w-12 h-12 rounded-xl flex items-center justify-center transition-colors card-pressable',
                  isActive
                    ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </div>

        <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-bold rotate-180 [writing-mode:vertical-lr]">
          UNESCO C1
        </div>
      </aside>
    </>
  );
}
