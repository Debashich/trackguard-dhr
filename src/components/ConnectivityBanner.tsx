'use client';

import { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

type ConnectivityState = 'online' | 'offline' | 'reconnected';

export default function ConnectivityBanner() {
  const [state, setState] = useState<ConnectivityState>('online');
  const wasOfflineRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initialOnline = navigator.onLine;
    setState(initialOnline ? 'online' : 'offline');
    if (!initialOnline) {
      wasOfflineRef.current = true;
    }

    function handleOnline() {
      if (wasOfflineRef.current) {
        setState('reconnected');
        timerRef.current = setTimeout(() => {
          setState('online');
        }, 3000);
      } else {
        setState('online');
      }
      wasOfflineRef.current = false;
    }

    function handleOffline() {
      wasOfflineRef.current = true;
      setState('offline');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (state === 'online') {
    return null;
  }

  if (state === 'reconnected') {
    return (
      <div
        className="tg-slide-down flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium md:ml-20"
        style={{
          backgroundColor: 'var(--tg-sync-synced-container)',
          color: 'var(--tg-sync-synced)',
        }}
        role="status"
        aria-live="polite"
      >
        <Wifi className="h-4 w-4" aria-hidden="true" />
        Back online
      </div>
    );
  }

  return (
    <div
      className="tg-slide-down flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium md:ml-20"
      style={{
        backgroundColor: 'var(--tg-sync-pending-container)',
        color: 'var(--tg-sync-pending)',
      }}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You&apos;re offline · Reports are saved on this device
    </div>
  );
}