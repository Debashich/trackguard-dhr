import {
  getPendingReports,
  getDB,
  updateReport,
} from "./storage";

let syncInProgress = false;

export async function syncNow(): Promise<{
  synced: number;
  failed: number;
}> {
  if (syncInProgress) {
    return { synced: 0, failed: 0 };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  syncInProgress = true;

  let synced = 0;
  let failed = 0;

  try {
    const reports = await getPendingReports();

    for (const report of reports) {
      try {
        await updateReport(report.id, {
          syncStatus: "syncing",
        });

        const formData = new FormData();

        const {
          photoBlob,
          photoThumbnail,
          ...serializableReport
        } = report;

        formData.append(
          "data",
          JSON.stringify(serializableReport),
        );

        if (photoBlob instanceof Blob) {
          formData.append(
            "photo",
            photoBlob,
            `${report.id}.jpg`,
          );
        }

        if (photoThumbnail instanceof Blob) {
          formData.append(
            "thumbnail",
            photoThumbnail,
            `${report.id}-thumb.jpg`,
          );
        }

        const response = await fetch("/api/reports", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `Sync failed with HTTP ${response.status}`,
          );
        }

        await updateReport(report.id, {
          syncStatus: "synced",
          syncTimestamp: new Date().toISOString(),
        });

        synced++;
      } catch (error) {
        console.error(
          `Failed to sync report ${report.id}`,
          error,
        );

        await updateReport(report.id, {
          syncStatus: "failed",
          retryCount: report.retryCount + 1,
        });

        failed++;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return { synced, failed };
}

export async function registerBackgroundSync(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.ready;

    if (!("sync" in registration)) {
      return;
    }

    await registration.sync.register("sync-reports");
  } catch (error) {
    console.debug(
      "Background Sync unavailable:",
      error,
    );
  }
}

export function listenForBackgroundSync(
  onSync: () => void,
): () => void {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === "SYNC_REPORTS") {
      onSync();
    }
  };

  navigator.serviceWorker.addEventListener(
    "message",
    handler,
  );

  return () => {
    navigator.serviceWorker.removeEventListener(
      "message",
      handler,
    );
  };
}

export async function resetStuckSyncingReports(): Promise<void> {
  const db = await getDB();
  const reports = await db.getAll("reports");

  for (const report of reports) {
    if (report.syncStatus === "syncing") {
      await updateReport(report.id, {
        syncStatus: "pending",
      });
    }
  }
}