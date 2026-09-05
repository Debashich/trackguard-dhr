'use client';

import React from 'react';
import {
  HazardType,
  Severity,
  HAZARD_OPTIONS,
  SEVERITY_OPTIONS,
} from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import HazardIcon from '@/components/HazardIcon';

interface HazardSelectorProps {
  hazardType: HazardType;
  severity: Severity;
  note: string;
  kmMarker: string;
  onHazardTypeChange: (type: HazardType) => void;
  onSeverityChange: (severity: Severity) => void;
  onNoteChange: (note: string) => void;
  onKmMarkerChange?: (km: string) => void;
  disabled?: boolean;
}

export default function HazardSelector({
  hazardType,
  severity,
  note,
  kmMarker,
  onHazardTypeChange,
  onSeverityChange,
  onNoteChange,
  onKmMarkerChange,
  disabled = false,
}: HazardSelectorProps) {
  return (
    <div className="space-y-5 text-slate-100">
      {/* 1. Track Location / KM Marker */}
      {onKmMarkerChange && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            DHR Alignment Km Marker
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
              KM
            </span>
            <input
              type="text"
              value={kmMarker}
              onChange={(e) => onKmMarkerChange(e.target.value)}
              disabled={disabled}
              placeholder="e.g. 74.2 (Ghum)"
              className="flex-1 rounded-lg border border-slate-800 bg-[#131720] px-3 py-2 text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
            />
          </div>
        </div>
      )}

      {/* 2. Hazard Type Grid Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Hazard Classification (Human Confirmed)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HAZARD_OPTIONS.map((opt) => {
            const isSelected = hazardType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => onHazardTypeChange(opt.value)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-[#161b24] hover:border-slate-700 text-slate-300'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <HazardIcon type={opt.value} className="h-4 w-4 shrink-0" />
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Severity Level Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Inspection Severity Level
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SEVERITY_OPTIONS.map((opt) => {
            const isSelected = severity === opt.value;

            // Comfortable, muted badge colors
            const styleMap: Record<Severity, { active: string; inactive: string }> = {
              low: {
                active: 'bg-emerald-600 text-white border-emerald-500 shadow-sm',
                inactive: 'bg-[#161b24] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-emerald-400',
              },
              medium: {
                active: 'bg-amber-600 text-white border-amber-500 shadow-sm',
                inactive: 'bg-[#161b24] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-amber-400',
              },
              high: {
                active: 'bg-orange-600 text-white border-orange-500 shadow-sm',
                inactive: 'bg-[#161b24] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-orange-400',
              },
              critical: {
                active: 'bg-rose-600 text-white border-rose-500 shadow-sm',
                inactive: 'bg-[#161b24] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-rose-400',
              },
            };

            const styling = styleMap[opt.value];

            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => onSeverityChange(opt.value)}
                className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                  isSelected ? styling.active : styling.inactive
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Observational Note Textarea */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Observational Inspection Note
          </label>
          <span className="text-[11px] text-slate-400">Factual details only</span>
        </div>
        <Textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          disabled={disabled}
          placeholder="Describe visible signs (e.g. mud slurry over culvert inlet, rail clearance obstructed by rockfall)..."
          rows={3}
          className="text-sm border-slate-800 bg-[#131720] text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500/50 resize-none font-normal rounded-lg"
        />
      </div>
    </div>
  );
}
