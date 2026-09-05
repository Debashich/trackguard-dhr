// dashboard page
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, RotateCw, SlidersHorizontal } from 'lucide-react';
import { getAllReports } from '@/lib/storage';
import type { HazardReport, HazardType, InspectionStatus, Severity } from '@/lib/types';
import BottomNav from '@/components/BottomNav';
import ConnectivityBanner from '@/components/ConnectivityBanner';
import ReportCard from '@/components/ReportCard';

const hazards = [
  ['all', 'All hazards'],
  ['slip', 'Slip'],
  ['rockfall', 'Rockfall'],
  ['blocked_drain', 'Drain'],
  ['damaged_wall', 'Wall'],
  ['track_defect', 'Track defect'],
  ['vegetation', 'Vegetation'],
  ['other', 'Other'],
];

const severities = [
  ['all', 'All severity'],
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['critical', 'Critical'],
];

const statuses = [
  ['all', 'All status'],
  ['open', 'Open'],
  ['acknowledged', 'Acknowledged'],
  ['inspection_required', 'Inspection required'],
  ['resolved', 'Resolved'],
];

const sections = [
  ['all', 'All sections'],
  ['kurseong-ghum', 'Kurseong → Ghum'],
  ['ghum-darjeeling', 'Ghum → Darjeeling'],
  ['Kurseong → Ghum', 'Kurseong → Ghum'],
  ['Ghum → Darjeeling', 'Ghum → Darjeeling'],
];

export default function DashboardPage() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');
  const [section, setSection] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await getAllReports());
    } catch (error) {
      console.error('Failed to load dashboard reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          (type === 'all' || r.hazardType === (type as HazardType)) &&
          (severity === 'all' || r.severity === (severity as Severity)) &&
          (status === 'all' || r.inspectionStatus === (status as InspectionStatus)) &&
          (section === 'all' || r.section === section)
      ),
    [reports, type, severity, status, section]
  );

  const activeFilters = [type, severity, status, section].filter((filter) => filter !== 'all').length;
  const count = (inspectionStatus: InspectionStatus) =>
    reports.filter((report) => report.inspectionStatus === inspectionStatus).length;

  const reset = () => {
    setType('all');
    setSeverity('all');
    setStatus('all');
    setSection('all');
  };

  return (
    <>
      <ConnectivityBanner />
      <main
        className="min-h-screen px-4 py-6 pb-nav md:ml-20 md:px-8 md:py-9"
        style={{ backgroundColor: 'var(--tg-background)', color: 'var(--tg-on-surface)' }}
      >
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--tg-primary)' }}>
                Control overview
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ color: 'var(--tg-on-surface)' }}>
                Dashboard
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--tg-on-surface-variant)' }}>
                DHR track inspection status
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="touch-target rounded-xl border p-3 transition-colors"
              style={{
                borderColor: 'var(--tg-outline)',
                backgroundColor: 'var(--tg-surface-container)',
                color: 'var(--tg-on-surface)',
              }}
              aria-label="Refresh dashboard"
            >
              <RotateCw className={loading ? 'tg-spin h-5 w-5' : 'h-5 w-5'} />
            </button>
          </header>

          <section className="mb-7">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: 'var(--tg-primary)' }} />
              <h2 className="font-bold" style={{ color: 'var(--tg-on-surface)' }}>
                Track status
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Total reports" value={reports.length} tone="neutral" />
              <Metric label="Open" value={count('open')} tone="open" />
              <Metric label="Inspection required" value={count('inspection_required')} tone="inspection" />
              <Metric label="Acknowledged" value={count('acknowledged')} tone="acknowledged" />
              <Metric label="Resolved" value={count('resolved')} tone="resolved" />
            </div>
          </section>

          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" style={{ color: 'var(--tg-primary)' }} />
                <h2 className="font-bold" style={{ color: 'var(--tg-on-surface)' }}>
                  Filters
                </h2>
                {activeFilters > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      color: 'var(--tg-primary)',
                      backgroundColor: 'var(--tg-primary-container)',
                    }}
                  >
                    {activeFilters}
                  </span>
                )}
              </div>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-11 px-2 text-sm font-semibold"
                  style={{ color: 'var(--tg-primary)' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="chips-scroll flex gap-2 overflow-x-auto pb-1">
              <Filter label="Hazard" value={type} setValue={setType} options={hazards} />
              <Filter label="Severity" value={severity} setValue={setSeverity} options={severities} />
              <Filter label="Status" value={status} setValue={setStatus} options={statuses} />
              <Filter label="Section" value={section} setValue={setSection} options={sections} />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--tg-on-surface)' }}>
                Recent hazards
              </h2>
              {!loading && (
                <span className="text-sm" style={{ color: 'var(--tg-on-surface-variant)' }}>
                  {filtered.length} shown
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="tg-skeleton h-32 rounded-3xl"
                    style={{ backgroundColor: 'var(--tg-surface-dim)' }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-3xl border px-6 py-14 text-center"
                style={{
                  backgroundColor: 'var(--tg-surface-container)',
                  borderColor: 'var(--tg-outline)',
                }}
              >
                <p className="font-semibold" style={{ color: 'var(--tg-on-surface)' }}>
                  No reports match these filters
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-3 min-h-11 px-3 text-sm font-semibold"
                  style={{ color: 'var(--tg-primary)' }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <SectionSummary reports={filtered} />
                <div className="space-y-3">
                  {filtered.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: 'var(--tg-surface-container-high)', fg: 'var(--tg-on-surface)' },
    open: { bg: 'var(--tg-status-open-container)', fg: 'var(--tg-status-open)' },
    inspection: { bg: 'var(--tg-status-inspection-container)', fg: 'var(--tg-status-inspection)' },
    acknowledged: { bg: 'var(--tg-status-acknowledged-container)', fg: 'var(--tg-status-acknowledged)' },
    resolved: { bg: 'var(--tg-status-resolved-container)', fg: 'var(--tg-status-resolved)' },
  };
  const { bg, fg } = colors[tone];
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ backgroundColor: bg, borderColor: 'var(--tg-outline)' }}
    >
      <p className="text-3xl font-bold" style={{ color: fg }}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium" style={{ color: 'var(--tg-on-surface-variant)' }}>
        {label}
      </p>
    </div>
  );
}

function Filter({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (next: string) => void;
  options: string[][];
}) {
  return (
    <label className="shrink-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-11 appearance-none rounded-xl border px-3 pr-8 text-sm font-medium outline-none focus:ring-2"
        style={{
          borderColor: value === 'all' ? 'var(--tg-outline)' : 'var(--tg-primary)',
          backgroundColor: 'var(--tg-surface-container-high)',
          color: 'var(--tg-on-surface)',
        }}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionValue === 'all' ? label : optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionSummary({ reports }: { reports: HazardReport[] }) {
  const groups = reports.reduce<Record<string, number>>(
    (totals, report) => ({
      ...totals,
      [report.section || 'Unassigned']: (totals[report.section || 'Unassigned'] || 0) + 1,
    }),
    {}
  );
  return (
    <aside
      className="h-fit rounded-3xl border p-4"
      style={{
        backgroundColor: 'var(--tg-surface-container)',
        borderColor: 'var(--tg-outline)',
      }}
    >
      <h3 className="font-bold" style={{ color: 'var(--tg-on-surface)' }}>
        Sections
      </h3>
      <div className="mt-3 space-y-3">
        {Object.entries(groups).map(([name, total]) => (
          <div key={name} className="flex items-center justify-between gap-3">
            <span className="text-sm" style={{ color: 'var(--tg-on-surface-variant)' }}>
              {name}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: 'var(--tg-primary-container)',
                color: 'var(--tg-primary)',
              }}
            >
              {total}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}