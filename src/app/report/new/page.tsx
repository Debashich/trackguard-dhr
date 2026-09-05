'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X, TrainTrack } from 'lucide-react';
import Link from 'next/link';
import Camera from '@/components/Camera';
import { getCurrentPosition, GeoLocationResult, DHR_WAYPOINTS } from '@/lib/geo';
import { useReport } from '@/lib/ReportContext';

export default function NewReportPage() {
  const router = useRouter();
  const { setDraftPhoto, setDraftLocation } = useReport();

  const [location, setLocation] = useState<GeoLocationResult | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'acquiring' | 'locked' | 'failed'>('acquiring');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [showStationPicker, setShowStationPicker] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function acquireGps() {
      try {
        setGpsStatus('acquiring');
        const pos = await getCurrentPosition();
        if (isMounted) {
          setLocation(pos);
          setGpsStatus('locked');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setGpsStatus('failed');
          const msg = err instanceof Error ? err.message : 'GPS lock unavailable';
          setGpsErrorMsg(msg);
          // Set a default Kurseong waypoint so inspection is never blocked
          setLocation({
            latitude: 26.8814,
            longitude: 88.2783,
            accuracy: 50,
            kmMarker: '51.0',
            section: 'kurseong-ghum',
          });
        }
      }
    }

    acquireGps();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCapture = (photoBlob: Blob, photoThumbnail: Blob) => {
    setDraftPhoto(photoBlob, photoThumbnail);

    // Fallback location if GPS didn't resolve
    const activeLoc: GeoLocationResult = location || {
      latitude: 26.8814,
      longitude: 88.2783,
      accuracy: 99,
      kmMarker: '51.0',
      section: 'kurseong-ghum',
    };

    setDraftLocation(activeLoc);
    router.push('/report/review');
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)] w-full bg-black overflow-hidden">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-black/50 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>

        {/* GPS Lock Status Badge / DHR Station Simulator */}
        <button
          type="button"
          onClick={() => setShowStationPicker((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm transition-all hover:bg-black/60"
          title="Click to simulate any DHR railway station"
        >
          {gpsStatus === 'acquiring' && (
            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/60 border-amber-600/50 px-2 py-0.5 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Locking GPS...</span>
            </div>
          )}
          {gpsStatus === 'locked' && location && (
            <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/70 border-emerald-600/50 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>
                {location.nearestStationName || `KM ${location.kmMarker}`}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {location.isSimulated ? '(Home Sim)' : `(±${Math.round(location.accuracy)}m)`}
              </span>
            </div>
          )}
          {gpsStatus === 'failed' && (
            <div
              className="flex items-center gap-1.5 text-orange-300 bg-orange-950/70 border-orange-600/50 px-2 py-0.5 rounded-full"
              title={gpsErrorMsg || 'Manual entry active'}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>KM {location?.kmMarker || '51.0'} (Manual)</span>
            </div>
          )}
        </button>
      </div>

      {/* Station Simulator Dropdown Modal */}
      {showStationPicker && (
        <div className="absolute top-16 right-4 z-40 w-64 bg-[#161b24]/95 border border-slate-800 rounded-2xl p-3 shadow-2xl backdrop-blur text-xs space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
              DHR Station Simulator
            </span>
            <button
              type="button"
              onClick={() => setShowStationPicker(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Testing at home? Select any DHR waypoint along the 88km line:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {DHR_WAYPOINTS.map((wp) => (
              <button
                key={wp.name}
                type="button"
                onClick={() => {
                  setLocation({
                    latitude: wp.lat,
                    longitude: wp.lng,
                    accuracy: 10,
                    kmMarker: wp.km.toFixed(1),
                    section: wp.section,
                    nearestStationName: wp.name,
                    distanceToAlignmentKm: 0,
                    isSimulated: true,
                  });
                  setGpsStatus('locked');
                  setShowStationPicker(false);
                }}
                className={`w-full text-left p-2 rounded-lg border transition-colors flex items-center justify-between ${
                  location?.kmMarker === wp.km.toFixed(1)
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <TrainTrack className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold truncate">{wp.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-1">
                  KM {wp.km.toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Camera Viewfinder */}
      <div className="flex-1 w-full h-full">
        <Camera onCapture={handleCapture} />
      </div>
    </div>
  );
}
