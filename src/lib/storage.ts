import { openDB, type IDBPDatabase } from 'idb';
import type { HazardReport, InspectionStatus, SyncStatus } from './types';

const DB_NAME = 'trackguard-dhr';
const STORE_NAME = 'reports';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (db.objectStoreNames.contains(STORE_NAME)) return;
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('syncStatus', 'syncStatus');
      store.createIndex('section', 'section');
      store.createIndex('inspectionStatus', 'inspectionStatus');
      store.createIndex('timestamp', 'timestamp');
    },
  });
}

export async function saveReport(report: HazardReport): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, report);
}

export async function getAllReports(): Promise<HazardReport[]> {
  const db = await getDB();
  const reports = await db.getAll(STORE_NAME) as HazardReport[];
  return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getReportById(id: string): Promise<HazardReport | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id) as Promise<HazardReport | undefined>;
}

async function getCountForStatus(status: SyncStatus): Promise<number> {
  const db = await getDB();
  return db.countFromIndex(STORE_NAME, 'syncStatus', status);
}

export async function getPendingCount(): Promise<number> {
  try { return await getCountForStatus('pending'); }
  catch (error) { console.error('Failed to read pending reports:', error); return 0; }
}

export async function getFailedCount(): Promise<number> {
  try { return await getCountForStatus('failed'); }
  catch (error) { console.error('Failed to read failed reports:', error); return 0; }
}

export async function getUnsyncedCount(): Promise<number> {
  const [pending, failed] = await Promise.all([getPendingCount(), getFailedCount()]);
  return pending + failed;
}

export async function getReportCounts() {
  try {
    const reports = await getAllReports();
    return reports.reduce((counts, report) => {
      counts.total += 1;
      if (report.syncStatus === 'pending') counts.pending += 1;
      if (report.syncStatus === 'failed') counts.failed += 1;
      if (report.syncStatus === 'synced') counts.synced += 1;
      return counts;
    }, { total: 0, pending: 0, failed: 0, synced: 0 });
  } catch (error) {
    console.error('Failed to read report counts:', error);
    return { total: 0, pending: 0, failed: 0, synced: 0 };
  }
}

export async function getReportsBySection(section: string): Promise<HazardReport[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'section', section) as Promise<HazardReport[]>;
}

export async function updateInspectionStatus(id: string, status: InspectionStatus): Promise<void> {
  const db = await getDB();
  const report = await db.get(STORE_NAME, id) as HazardReport | undefined;
  if (!report) throw new Error(`Report ${id} not found`);
  await db.put(STORE_NAME, { ...report, inspectionStatus: status });
}

export async function updateSyncStatus(id: string, status: SyncStatus, syncTimestamp?: string | null): Promise<void> {
  const db = await getDB();
  const report = await db.get(STORE_NAME, id) as HazardReport | undefined;
  if (!report) throw new Error(`Report ${id} not found`);
  await db.put(STORE_NAME, { ...report, syncStatus: status, ...(syncTimestamp !== undefined ? { syncTimestamp } : {}) });
}

