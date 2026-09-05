'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Camera,
  ListTodo,
  LayoutDashboard,
  Wifi,
  WifiOff,
  TrainTrack,
  ChevronRight,
  Shield,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { getPendingCount } from '@/lib/storage';
import { getCustomModelInfo } from '@/lib/llm';
import BottomNav from '@/components/BottomNav';
import ModelSettingsModal from '@/components/ModelSettingsModal';

export default function HomePage() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [modelInfo, setModelInfo] = useState<{ isCustom: boolean; name: string | null }>({
    isCustom: false,
    name: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      setModelInfo(getCustomModelInfo());

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      loadCount();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const loadCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.warn('Could not read pending count:', err);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col justify-between pb-nav md:ml-20"
      style={{ backgroundColor: 'var(--tg-surface)', color: 'var(--tg-on-surface)' }}
    >
      {/* Top Banner / DHR Branding */}
      <header
        className="sticky top-0 z-30 border-b p-4 backdrop-blur-md"
        style={{ borderColor: 'var(--tg-outline)', backgroundColor: 'color-mix(in srgb, var(--tg-surface-container) 85%, transparent)' }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between md:max-w-3xl">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl border p-2"
              style={{ backgroundColor: 'var(--tg-primary-container)', color: 'var(--tg-primary)', borderColor: 'var(--tg-outline)' }}
            >
              <TrainTrack className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--tg-on-surface)' }}>
                  TrackGuard
                </h1>
                <span
                  className="rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                  style={{ backgroundColor: 'var(--tg-primary-container)', color: 'var(--tg-primary)', borderColor: 'var(--tg-outline)' }}
                >
                  DHR
                </span>
              </div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--tg-on-surface-variant)' }}>
                Darjeeling Himalayan Railway · Gangman Logbook
              </p>
            </div>
          </div>

          {/* Network Status Badge */}
          <div
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: isOnline ? 'var(--tg-sync-synced-container)' : 'var(--tg-surface-container-high)',
              borderColor: isOnline ? 'transparent' : 'var(--tg-outline)',
              color: isOnline ? 'var(--tg-sync-synced)' : 'var(--tg-on-surface-variant)',
            }}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span>Station Signal</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>Track Offline</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center space-y-5 p-4 md:max-w-3xl">
        {/* Status Highlight Banner */}
        <div
          className="flex items-start gap-3.5 rounded-xl border p-4 shadow-sm"
          style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)' }}
        >
          <div
            className="mt-0.5 shrink-0 rounded-lg border p-2"
            style={{ backgroundColor: 'var(--tg-primary-container)', color: 'var(--tg-primary)', borderColor: 'var(--tg-outline)' }}
          >
            <Shield className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold tracking-wide" style={{ color: 'var(--tg-on-surface)' }}>
              <span>Alignment Inspection Mode</span>
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                style={{ backgroundColor: 'var(--tg-surface-container-high)', color: 'var(--tg-on-surface-variant)' }}
              >
                100% Offline
              </span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--tg-on-surface-variant)' }}>
              Record rockfalls, slope slips, and culvert blockages on track. Reports queue locally until the next railway station.
            </p>
          </div>
        </div>

        {/* AI Model Source Selector Chip */}
        <button
          type="button"
          onClick={() => setIsModelModalOpen(true)}
          className="group flex w-full items-center justify-between rounded-xl border p-3 text-xs shadow-sm transition-colors"
          style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)', color: 'var(--tg-on-surface)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg border p-2"
              style={{ backgroundColor: 'var(--tg-surface-container-high)', color: 'var(--tg-primary)', borderColor: 'var(--tg-outline)' }}
            >
              <Cpu className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--tg-on-surface)' }}>
                <span>Gemma 4 WebGPU Engine</span>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--tg-sync-synced)' }} />
              </div>
              <div className="text-[11px]" style={{ color: 'var(--tg-on-surface-variant)' }}>
                {modelInfo.isCustom ? (
                  <span className="font-medium" style={{ color: 'var(--tg-primary)' }}>
                    Local: {modelInfo.name}
                  </span>
                ) : (
                  'Hugging Face CDN (Auto-cached)'
                )}
              </div>
            </div>
          </div>
          <span
            className="rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={{ backgroundColor: 'var(--tg-surface-container-high)', borderColor: 'var(--tg-outline)', color: 'var(--tg-on-surface)' }}
          >
            Configure
          </span>
        </button>

        {/* Primary Action Button: New Report */}
        <div>
          <Link href="/report/new" className="group block w-full">
            <div
              className="relative overflow-hidden rounded-2xl border p-5 shadow-lg transition-all active:scale-[0.99]"
              style={{
                background: 'linear-gradient(to right, color-mix(in srgb, var(--tg-primary) 10%, transparent), var(--tg-surface-container-high), var(--tg-surface-container))',
                borderColor: 'color-mix(in srgb, var(--tg-primary) 35%, transparent)',
              }}
            >
              <div
                className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-2xl"
                style={{ background: 'linear-gradient(to bottom, var(--tg-primary), color-mix(in srgb, var(--tg-primary) 70%, black))' }}
              />

              <div className="flex items-center justify-between pl-1">
                <div className="flex items-center gap-4">
                  <div
                    className="rounded-xl p-3 font-bold shadow-md transition-colors"
                    style={{ backgroundColor: 'var(--tg-primary)', color: 'var(--tg-on-primary)' }}
                  >
                    <Camera className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-lg font-bold tracking-tight" style={{ color: 'var(--tg-on-surface)' }}>
                      <span>NEW REPORT</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--tg-on-surface-variant)' }}>
                      <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--tg-primary)' }} />
                      <span>Photo + GPS + Gemma 4 AI</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border transition-all group-hover:translate-x-0.5"
                  style={{ backgroundColor: 'var(--tg-surface-container-high)', borderColor: 'var(--tg-outline)', color: 'var(--tg-on-surface-variant)' }}
                >
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Queue Card */}
          <Link href="/queue" className="block">
            <div
              className="flex h-full flex-col justify-between space-y-3 rounded-xl border p-4 transition-colors"
              style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)' }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="rounded-lg border p-2"
                  style={{ backgroundColor: 'var(--tg-status-acknowledged-container)', color: 'var(--tg-status-acknowledged)', borderColor: 'var(--tg-outline)' }}
                >
                  <ListTodo className="h-5 w-5" />
                </div>
                {pendingCount > 0 ? (
                  <span
                    className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: 'var(--tg-sync-pending-container)', color: 'var(--tg-sync-pending)', borderColor: 'transparent' }}
                  >
                    {pendingCount} Pending
                  </span>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: 'var(--tg-on-surface-variant)' }}>
                    Synced
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--tg-on-surface)' }}>
                  My Reports
                </div>
                <div className="text-[11px]" style={{ color: 'var(--tg-on-surface-variant)' }}>
                  Offline queue & sync
                </div>
              </div>
            </div>
          </Link>

          {/* Section Dashboard Card */}
          <Link href="/dashboard" className="block">
            <div
              className="flex h-full flex-col justify-between space-y-3 rounded-xl border p-4 transition-colors"
              style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)' }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="rounded-lg border p-2"
                  style={{ backgroundColor: 'var(--tg-status-resolved-container)', color: 'var(--tg-status-resolved)', borderColor: 'var(--tg-outline)' }}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <span className="font-mono text-[11px]" style={{ color: 'var(--tg-on-surface-variant)' }}>
                  DHR
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--tg-on-surface)' }}>
                  Section View
                </div>
                <div className="text-[11px]" style={{ color: 'var(--tg-on-surface-variant)' }}>
                  Supervisor overview
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Local alignment info */}
        <div
          className="flex items-center justify-between rounded-xl border p-3 text-xs"
          style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)', color: 'var(--tg-on-surface-variant)' }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--tg-on-surface)' }}>
            <TrainTrack className="h-4 w-4" style={{ color: 'var(--tg-primary)' }} />
            <span>Active Sector: Kurseong ↔ Ghum ↔ Darjeeling</span>
          </div>
          <span className="font-mono text-[11px]" style={{ color: 'var(--tg-on-surface-variant)' }}>
            88 km
          </span>
        </div>
      </main>

      {/* Footer / Helper */}
      <footer className="mx-auto w-full max-w-md px-4 text-center md:max-w-3xl">
        <p className="text-[11px]" style={{ color: 'var(--tg-on-surface-variant)' }}>
          TrackGuard DHR · GDG Siliguri Toy Train Edition · On-Device Gemma 4
        </p>
      </footer>

      {/* Model Settings / Local Loader Modal */}
      <ModelSettingsModal
        isOpen={isModelModalOpen}
        onClose={() => {
          setIsModelModalOpen(false);
          setModelInfo(getCustomModelInfo());
        }}
      />

      <BottomNav />
    </div>
  );
}