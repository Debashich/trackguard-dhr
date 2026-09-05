import { openDB, type IDBPDatabase } from "idb";

import type {
  HazardReport,
  InspectionStatus,
  SyncStatus,
} from "./types";

const DB_NAME = "trackguard-dhr";
const STORE_NAME = "reports";
const DB_VERSION = 1;

type TrackGuardDB = {
  reports: {
    key: string;
    value: HazardReport;
    indexes: {
      syncStatus: SyncStatus;
      section: string;
      inspectionStatus: InspectionStatus;
      timestamp: string;
    };
  };
};

let dbPromise: Promise<IDBPDatabase<TrackGuardDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<TrackGuardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TrackGuardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (db.objectStoreNames.contains(STORE_NAME)) return;

        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        store.createIndex("syncStatus", "syncStatus");
        store.createIndex("section", "section");
        store.createIndex("inspectionStatus", "inspectionStatus");
        store.createIndex("timestamp", "timestamp");
      },
    });
  }

  return dbPromise;
}

export async function saveReport(
  report: HazardReport,
): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, report);
}

export async function getAllReports(): Promise<HazardReport[]> {
  const db = await getDB();
  const reports = await db.getAll(STORE_NAME);

  return reports.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() -
      new Date(a.timestamp).getTime(),
  );
}

export async function getReportById(
  id: string,
): Promise<HazardReport | undefined> {
  const db = await getDB();

  return db.get(STORE_NAME, id);
}

export async function getPendingReports(): Promise<HazardReport[]> {
  const db = await getDB();

  const pending = await db.getAllFromIndex(
    STORE_NAME,
    "syncStatus",
    "pending",
  );

  const failed = await db.getAllFromIndex(
    STORE_NAME,
    "syncStatus",
    "failed",
  );

  return [...pending, ...failed].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime(),
  );
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();

  const pending = await db.countFromIndex(
    STORE_NAME,
    "syncStatus",
    "pending",
  );

  const failed = await db.countFromIndex(
    STORE_NAME,
    "syncStatus",
    "failed",
  );

  return pending + failed;
}

export async function getReportsBySection(
  section: string,
): Promise<HazardReport[]> {
  const db = await getDB();

  return db.getAllFromIndex(
    STORE_NAME,
    "section",
    section,
  );
}

export async function updateReport(
  id: string,
  updates: Partial<HazardReport>,
): Promise<HazardReport | undefined> {
  const db = await getDB();

  const report = await db.get(STORE_NAME, id);

  if (!report) return undefined;

  const updated: HazardReport = {
    ...report,
    ...updates,
  };

  await db.put(STORE_NAME, updated);

  return updated;
}

export async function updateInspectionStatus(
  id: string,
  status: InspectionStatus,
): Promise<void> {
  await updateReport(id, {
    inspectionStatus: status,
  });
}

export async function updateSyncStatus(
  id: string,
  status: SyncStatus,
): Promise<void> {
  await updateReport(id, {
    syncStatus: status,
  });
}
