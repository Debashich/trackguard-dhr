'use client';

// ============================================
// GLOBAL CONNECTIVITY BANNER
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.7)
// ============================================

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectivityBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="w-full bg-[#fbbf24]/15 border-b border-[#fbbf24]/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono text-[#fbbf24] z-50 animate-fadeIn">
        <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
        <span>You are offline · 100% On-Device Mode · Reports save to local storage</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="w-full bg-[#34d399]/15 border-b border-[#34d399]/30 px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono text-[#34d399] z-50 animate-fadeIn">
        <Wifi className="w-3.5 h-3.5 shrink-0" />
        <span>Connected to network · Ready to sync reports at station</span>
      </div>
    );
  }

  return null;
}
