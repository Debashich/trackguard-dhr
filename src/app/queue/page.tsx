// queue page
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, FilePlus2, Wifi, WifiOff } from 'lucide-react';
import { getAllReports } from '@/lib/storage';
import { registerBackgroundSync, syncNow } from '@/lib/sync';
import type { HazardReport } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import ConnectivityBanner from '@/components/ConnectivityBanner';
import ReportCard from '@/components/ReportCard';
import SyncButton from '@/components/SyncButton';

export default function QueuePage() {
  const router = useRouter();
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const loadReports = useCallback(async () => {
    try {
      setReports(await getAllReports());
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadReports(), 0);
    const goOnline = () => {
      setOnline(true);
      void registerBackgroundSync();
    };
    const goOffline = () => setOnline(false);
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REPORTS') {
        void syncNow()
          .then(loadReports)
          .catch((error) => console.warn('Background report sync could not run:', error));
      }
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [loadReports]);

  const waiting = reports.filter(
    (report) => report.syncStatus === 'pending' || report.syncStatus === 'failed'
  ).length;

  return (
    <>
      <ConnectivityBanner />
      <main
        className="min-h-screen px-4 py-6 pb-nav md:ml-20 md:px-8 md:py-9"
        style={{ backgroundColor: 'var(--tg-background)', color: 'var(--tg-on-surface)' }}
      >
        <div className="mx-auto max-w-3xl">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--tg-primary)' }}>
                TrackGuard DHR
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--tg-on-surface)' }}>
                My reports
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--tg-on-surface-variant)' }}>
                Track inspection reports saved on this device
              </p>
            </div>
            <span
              className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold"
              style={{
                backgroundColor: online ? 'var(--tg-sync-synced-container)' : 'var(--tg-surface-container-high)',
                color: online ? 'var(--tg-sync-synced)' : 'var(--tg-on-surface-variant)',
              }}
            >
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? 'Online' : 'Offline'}
            </span>
          </header>

          <section
            className="mb-7 rounded-3xl border p-4 shadow-sm"
            style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)' }}
          >
            <SyncButton onSyncComplete={loadReports} />
          </section>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--tg-on-surface)' }}>
              Recent
            </h2>
            {waiting > 0 && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ color: 'var(--tg-sync-pending)', backgroundColor: 'var(--tg-sync-pending-container)' }}
              >
                {waiting} waiting
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3" aria-label="Loading reports">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="tg-skeleton h-32 rounded-3xl"
                  style={{ backgroundColor: 'var(--tg-surface-dim)' }}
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <section
              className="rounded-3xl border px-6 py-14 text-center"
              style={{ backgroundColor: 'var(--tg-surface-container)', borderColor: 'var(--tg-outline)' }}
            >
              <ClipboardList className="mx-auto h-12 w-12" style={{ color: 'var(--tg-primary)' }} />
              <h2 className="mt-4 text-xl font-bold" style={{ color: 'var(--tg-on-surface)' }}>
                No reports yet
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm" style={{ color: 'var(--tg-on-surface-variant)' }}>
                When you capture a track hazard, it will be saved here safely—even offline.
              </p>
              <Link
                href="/report/new"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
                style={{ backgroundColor: 'var(--tg-primary)', color: 'var(--tg-on-primary)' }}
              >
                <FilePlus2 className="h-4 w-4" />
                Create report
              </Link>
            </section>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => router.push(`/report/${report.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}