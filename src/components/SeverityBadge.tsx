import React from 'react';
import { Severity } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; textClass: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  low: {
    label: 'Low',
    textClass: 'text-[#34d399]',
    bgClass: 'bg-[#34d399]/15',
    borderClass: 'border-[#34d399]/30',
    dotClass: 'bg-[#34d399]',
  },
  medium: {
    label: 'Medium',
    textClass: 'text-[#fbbf24]',
    bgClass: 'bg-[#fbbf24]/15',
    borderClass: 'border-[#fbbf24]/30',
    dotClass: 'bg-[#fbbf24]',
  },
  high: {
    label: 'High',
    textClass: 'text-[#fb923c]',
    bgClass: 'bg-[#fb923c]/15',
    borderClass: 'border-[#fb923c]/30',
    dotClass: 'bg-[#fb923c]',
  },
  critical: {
    label: 'Critical',
    textClass: 'text-[#fb7185]',
    bgClass: 'bg-[#fb7185]/15',
    borderClass: 'border-[#fb7185]/30',
    dotClass: 'bg-[#fb7185]',
  },
};

export function SeverityBadge({ severity, className, size = 'md' }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded-full border',
        config.textClass,
        config.bgClass,
        config.borderClass,
        sizeClasses,
        className
      )}
    >
      <span className={cn('rounded-full shrink-0 animate-pulse', config.dotClass, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {config.label}
    </span>
  );
}
