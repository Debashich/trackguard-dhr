/// <reference lib="webworker" />

import {
  defaultCache,
} from '@serwist/next/worker';

import {
  Serwist,
  type PrecacheEntry,
} from 'serwist';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,
});

self.addEventListener(
  'sync',
  (event) => {
    if (event.tag !== 'sync-reports') {
      return;
    }

    event.waitUntil(
      notifyClientsToSync()
    );
  }
);

async function notifyClientsToSync() {
  const clients =
    await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_REPORTS',
    });
  }
}

serwist.addEventListeners();