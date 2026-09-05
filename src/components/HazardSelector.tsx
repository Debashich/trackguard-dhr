'use client';

// ============================================
// HAZARD SELECTOR & HUMAN OVERRIDE CONTROLS
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.2)
// Gangman's authoritative control panel during report review
// ============================================

import React from 'react';
import { HazardType, Severity, HAZARD_OPTIONS, SEVERITY_OPTIONS } from '@/lib/types';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import { MapPin, AlertCircle, Edit3, Sparkles } from 'lucide-react';

interface HazardSelectorProps {
  hazardType: HazardType;
  onChangeHazardType: (type: HazardType) => void;
  severity: Severity;
  onChangeSeverity: (severity: Severity) => void;
  kmMarker: string;
  onChangeKmMarker: (km: string) => void;
  userNote: string;
  onChangeUserNote: (note: string) => void;
  nearestWaypointName?: string;
  isAiSuggested?: boolean;
}

const QUICK_TAGS = [
  'Loose boulders on track',
  'Drain completely clogged',
  'Water overtopping rails',
  'Retaining wall bulging',
  'Rail joint gap widening',
  'Tree blocking clearance',
];

export function HazardSelector({
  hazardType,
  onChangeHazardType,
  severity,
  onChangeSeverity,
  kmMarker,
  onChangeKmMarker,
  userNote,
  onChangeUserNote,
  nearestWaypointName,
  isAiSuggested = false,
}: HazardSelectorProps) {
  const handleAddQuickTag = (tag: string) => {
    if (!userNote.trim()) {
      onChangeUserNote(tag);
    } else if (!userNote.includes(tag)) {
      onChangeUserNote(`${userNote.trim()}. ${tag}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Hazard Classification */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#fbbf24]" />
            Hazard Classification
          </label>
          {isAiSuggested && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 rounded-full border border-[#fbbf24]/20">
              <Sparkles className="w-3 h-3" /> AI Pre-filled (Editable)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HAZARD_OPTIONS.map((opt) => {
            const isSelected = hazardType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeHazardType(opt.value)}
                className={cn(
                  'touch-target flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left card-pressable text-xs font-medium transition-colors',
                  isSelected
                    ? 'bg-[#fbbf24]/15 border-[#fbbf24] text-[#fbbf24] font-semibold'
                    : 'bg-[#161b24] border-slate-800 text-slate-300 hover:bg-slate-800/60'
                )}
              >
                <span className="text-base shrink-0">{opt.icon}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Severity Level Selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Severity Level (Gangman's Authority)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SEVERITY_OPTIONS.map((opt) => {
            const isSelected = severity === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeSeverity(opt.value)}
                className={cn(
                  'touch-target flex flex-col items-center justify-center p-2 rounded-xl border card-pressable transition-all',
                  isSelected
                    ? 'ring-2 ring-offset-2 ring-offset-[#0f131a] border-transparent font-bold'
                    : 'bg-[#161b24] border-slate-800/80 text-slate-400 hover:bg-slate-800/40'
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${opt.color}22`,
                        borderColor: opt.color,
                        boxShadow: `0 0 12px ${opt.color}33`,
                      }
                    : undefined
                }
              >
                <SeverityBadge severity={opt.value} size="sm" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Kilometer Marker & Location Stone */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#fbbf24]" />
            Nearest DHR Kilometer Stone
          </label>
          {nearestWaypointName && (
            <span className="text-[11px] font-mono text-slate-400">
              Near {nearestWaypointName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500 font-bold">
              KM
            </span>
            <input
              type="text"
              value={kmMarker}
              onChange={(e) => onChangeKmMarker(e.target.value)}
              placeholder="e.g. 51.0"
              className="w-full bg-[#161b24] border border-slate-800 focus:border-[#fbbf24] rounded-xl pl-11 pr-3 py-2.5 font-mono text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const num = parseFloat(kmMarker) || 51.0;
                onChangeKmMarker((num - 0.1).toFixed(1));
              }}
              className="touch-target px-3 rounded-xl bg-[#161b24] border border-slate-800 text-slate-300 hover:bg-slate-800 font-mono text-xs card-pressable"
            >
              -0.1
            </button>
            <button
              type="button"
              onClick={() => {
                const num = parseFloat(kmMarker) || 51.0;
                onChangeKmMarker((num + 0.1).toFixed(1));
              }}
              className="touch-target px-3 rounded-xl bg-[#161b24] border border-slate-800 text-slate-300 hover:bg-slate-800 font-mono text-xs card-pressable"
            >
              +0.1
            </button>
          </div>
        </div>
      </div>

      {/* 4. Gangman's Official Logbook Note */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-[#fbbf24]" />
          Gangman's Official Note
        </label>
        <textarea
          rows={3}
          value={userNote}
          onChange={(e) => onChangeUserNote(e.target.value)}
          placeholder="Enter detailed observations, track clearance status, or recommended maintenance..."
          className="w-full bg-[#161b24] border border-slate-800 focus:border-[#fbbf24] rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 outline-none transition-colors resize-none leading-relaxed"
        />

        {/* Quick Tag Tap Chips (Glove-Friendly) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleAddQuickTag(tag)}
              className="text-[11px] bg-[#1a202c] hover:bg-[#fbbf24]/15 hover:text-[#fbbf24] hover:border-[#fbbf24]/30 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg transition-colors card-pressable"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
