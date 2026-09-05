'use client';

import React from 'react';
import { Severity } from '@/lib/types';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SeverityBadge({
  severity,
  size = 'md',
  className = '',
}: SeverityBadgeProps) {
  const norm = (severity || 'medium').toLowerCase() as Severity;

  const config: Record<
    Severity,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    low: {
      label: 'Low Severity',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      border: 'border-emerald-500/25',
      dot: 'bg-emerald-400',
    },
    medium: {
      label: 'Medium Severity',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      border: 'border-amber-500/25',
      dot: 'bg-amber-400',
    },
    high: {
      label: 'High Severity',
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/25',
      dot: 'bg-orange-400',
    },
    critical: {
      label: 'Critical Hazard',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400 animate-pulse',
    },
  };

  const current = config[norm] || config.medium;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
