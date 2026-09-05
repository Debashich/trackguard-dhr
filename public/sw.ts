/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{
    url: string;
    revision: string | null;
  }>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Allow the app to tell the service worker to activate immediately.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Background Sync.
//
// The service worker does NOT access IndexedDB or perform the actual
// report-sync logic itself. It notifies an open app client, which then
// calls syncNow() from src/lib/sync.ts.
//
// Manual "Sync Now" remains the primary mechanism.
self.addEventListener("sync", (event) => {
  if (event.tag !== "sync-reports") {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: "SYNC_REPORTS",
          });
        }
      }),
  );
});

// Register Serwist's precaching, routing and runtime caching listeners.
serwist.addEventListeners();