'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BrickWall,
  CheckCircle2,
  Clock,
  Construction,
  Droplets,
  MapPin,
  Mountain,
  RefreshCw,
  TrainTrack,
  Trees,
  type LucideIcon,
} from 'lucide-react';

import type { HazardReport } from '@/lib/types';
import StatusBadge from './StatusBadge';

interface ReportCardProps {
  report: HazardReport;
  onClick?: () => void;
}

const HAZARD_LABELS: Record<string, string> = {
  slip: 'Slip / Landslide',
  rockfall: 'Rockfall',
  blocked_drain: 'Blocked Drain',
  damaged_wall: 'Damaged Retaining Wall',
  track_defect: 'Track Defect',
  vegetation: 'Vegetation Overgrowth',
  other: 'Other',
};

const HAZARD_ICONS: Record<string, LucideIcon> = {
  slip: Mountain,
  rockfall: Mountain,
  blocked_drain: Droplets,
  damaged_wall: BrickWall,
  track_defect: TrainTrack,
  vegetation: Trees,
  other: Construction,
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  // Check if today
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return `Today, ${date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportCard({
  report,
  onClick,
}: ReportCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!report.photoThumbnail) {
      const clearImage = window.setTimeout(() => setImageUrl(null), 0);
      return () => window.clearTimeout(clearImage);
    }

    const url = URL.createObjectURL(report.photoThumbnail);
    const updateImage = window.setTimeout(() => setImageUrl(url), 0);

    return () => {
      window.clearTimeout(updateImage);
      URL.revokeObjectURL(url);
    };
  }, [report.photoThumbnail]);

  const hazardLabel = HAZARD_LABELS[report.hazardType] ?? 'Other';
  const HazardIcon = HAZARD_ICONS[report.hazardType] ?? Construction;
  const Container = onClick ? 'button' : 'article';

  return (
    <Container
      role={onClick ? undefined : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex min-h-[72px] w-full flex-col overflow-hidden rounded-2xl border text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        onClick
          ? 'card-pressable cursor-pointer focus-visible:ring-[var(--tg-primary)]'
          : ''
      }`}
      style={{ borderColor: 'var(--tg-outline)', backgroundColor: 'var(--tg-surface-container)' }}
      aria-label={onClick ? `Open ${hazardLabel} report` : undefined}
    >
      <div className="flex flex-1 p-3">
        {/* Thumbnail */}
        <div
          className="mr-3 h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-sm"
          style={{ backgroundColor: 'var(--tg-surface-dim)' }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hazardLabel}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <HazardIcon className="h-7 w-7" style={{ color: 'var(--tg-primary)' }} aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold leading-tight" style={{ color: 'var(--tg-on-surface)' }}>
              <HazardIcon className="mr-1 inline h-4 w-4 align-[-2px]" style={{ color: 'var(--tg-primary)' }} aria-hidden="true" />
              {hazardLabel}
            </h3>

            {/* Inline Severity Chip */}
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `var(--tg-severity-${report.severity}-container)`,
                color: `var(--tg-severity-${report.severity})`,
              }}
            >
              {report.severity}
            </span>
          </div>

          <div className="mt-1 flex flex-col gap-1 text-xs" style={{ color: 'var(--tg-on-surface-variant)' }}>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate font-medium" style={{ color: 'var(--tg-on-surface)' }}>
                {report.section} {report.kmMarker ? `· KM ${report.kmMarker}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{formatTimestamp(report.timestamp)}</span>
              </div>
              <StatusBadge status={report.inspectionStatus} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Footer */}
      <div
        className="flex items-center gap-1.5 border-t px-3 py-2 text-[11px] font-medium"
        style={{
          borderColor: 'var(--tg-outline-variant)',
          backgroundColor:
            report.syncStatus === 'failed'
              ? 'var(--tg-sync-failed-container)'
              : 'var(--tg-surface-container-high)',
        }}
      >
        {report.syncStatus === 'synced' && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--tg-sync-synced)' }} />
            <span style={{ color: 'var(--tg-sync-synced)' }}>
              Synced {report.syncTimestamp ? `· ${formatTimestamp(report.syncTimestamp)}` : ''}
            </span>
          </>
        )}

        {report.syncStatus === 'pending' && (
          <>
            <div className="flex h-3.5 w-3.5 items-center justify-center">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--tg-sync-pending)' }} />
            </div>
            <span style={{ color: 'var(--tg-sync-pending)' }}>Waiting to sync</span>
          </>
        )}

        {report.syncStatus === 'syncing' && (
          <>
            <RefreshCw className="tg-spin h-3.5 w-3.5" style={{ color: 'var(--tg-sync-syncing)' }} />
            <span style={{ color: 'var(--tg-sync-syncing)' }}>Syncing…</span>
          </>
        )}

        {report.syncStatus === 'failed' && (
          <>
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--tg-sync-failed)' }} />
            <span style={{ color: 'var(--tg-sync-failed)' }}>
              Sync failed {report.retryCount ? `· Retried ${report.retryCount} times` : ''}
            </span>
          </>
        )}
      </div>
    </Container>
  );
}