import { getDB } from './storage';
import type { HazardReport } from './types';

export interface SyncResult { synced: number; failed: number; attempted: number; }

export async function syncNow(onProgress?: (completed: number, total: number) => void): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('Cannot sync while offline');
  const db = await getDB();
  const [pending, failedReports] = await Promise.all([
    db.getAllFromIndex('reports', 'syncStatus', 'pending') as Promise<HazardReport[]>,
    db.getAllFromIndex('reports', 'syncStatus', 'failed') as Promise<HazardReport[]>,
  ]);
  const reports = [...pending, ...failedReports];
  let synced = 0;
  let failed = 0;

  for (const [index, sourceReport] of reports.entries()) {
    const report = { ...sourceReport, syncStatus: 'syncing' as const };
    try {
      await db.put('reports', report);
      const { photoBlob, photoThumbnail, ...reportData } = report;
      // Keep media local; the full image is sent as multipart data below.
      void photoThumbnail;
      const formData = new FormData();
      formData.append('data', JSON.stringify(reportData));
      if (photoBlob) formData.append('photo', photoBlob, `${report.id}.jpg`);
      const response = await fetch('/api/reports', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Sync failed with status ${response.status}`);
      await db.put('reports', { ...report, syncStatus: 'synced', syncTimestamp: new Date().toISOString() });
      synced += 1;
    } catch (error) {
      console.error(`Failed to sync report ${report.id}:`, error);
      await db.put('reports', { ...report, syncStatus: 'failed', retryCount: (report.retryCount ?? 0) + 1 });
      failed += 1;
    } finally {
      onProgress?.(index + 1, reports.length);
    }
  }
  return { synced, failed, attempted: reports.length };
}

export async function registerBackgroundSync(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('SyncManager' in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-reports');
  } catch (error) {
    console.warn('Background Sync registration failed:', error);
  }
}
