'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListTodo, LayoutDashboard, Camera } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/queue', label: 'Reports', icon: ListTodo },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ---------- Mobile: fixed bottom tab bar ---------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        style={{
          backgroundColor: 'var(--tg-surface-container)',
          borderColor: 'var(--tg-outline)',
        }}
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="touch-target flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5"
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: active ? 'var(--tg-primary)' : 'var(--tg-on-surface-variant)' }}
                />
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: active ? 'var(--tg-primary)' : 'var(--tg-on-surface-variant)' }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ---------- Desktop: fixed left rail ---------- */}
      <nav
        className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col items-center border-r py-6 md:flex"
        style={{
          backgroundColor: 'var(--tg-surface-container)',
          borderColor: 'var(--tg-outline)',
        }}
        aria-label="Primary"
      >
        <Link
          href="/"
          className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
          style={{
            backgroundColor: 'var(--tg-primary-container)',
            color: 'var(--tg-primary)',
          }}
          aria-label="TrackGuard home"
        >
          TG
        </Link>

        <div className="flex flex-1 flex-col items-center gap-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors"
                style={{
                  backgroundColor: active ? 'var(--tg-primary-container)' : 'transparent',
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: active ? 'var(--tg-primary)' : 'var(--tg-on-surface-variant)' }}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? 'var(--tg-primary)' : 'var(--tg-on-surface-variant)' }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Quick "new report" shortcut, mirrors the mobile primary CTA */}
        <Link
          href="/report/new"
          className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition-transform hover:scale-105"
          style={{ backgroundColor: 'var(--tg-primary)', color: 'var(--tg-on-primary)' }}
          aria-label="New report"
        >
          <Camera className="h-5 w-5" />
        </Link>
      </nav>
    </>
  );
}