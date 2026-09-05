import {
  CircleAlert,
  Eye,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { InspectionStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: InspectionStatus;
  size?: 'sm' | 'default';
}

const STATUS_CONFIG: Record<
  InspectionStatus,
  {
    label: string;
    style: React.CSSProperties;
    Icon: React.ElementType;
  }
> = {
  open: {
    label: 'Open',
    style: {
      backgroundColor: 'var(--tg-status-open-container)',
      color: 'var(--tg-status-open)',
    },
    Icon: CircleAlert,
  },
  acknowledged: {
    label: 'Acknowledged',
    style: {
      backgroundColor: 'var(--tg-status-acknowledged-container)',
      color: 'var(--tg-status-acknowledged)',
    },
    Icon: Eye,
  },
  inspection_required: {
    label: 'Inspection Required',
    style: {
      backgroundColor: 'var(--tg-status-inspection-container)',
      color: 'var(--tg-status-inspection)',
    },
    Icon: AlertTriangle,
  },
  resolved: {
    label: 'Resolved',
    style: {
      backgroundColor: 'var(--tg-status-resolved-container)',
      color: 'var(--tg-status-resolved)',
    },
    Icon: CheckCircle2,
  },
};

export default function StatusBadge({
  status,
  size = 'default',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const { Icon } = config;

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center font-medium ${
        isSmall ? 'rounded-md px-2 py-0.5 text-[10px]' : 'rounded-lg px-2.5 py-1 text-xs'
      }`}
      style={config.style}
    >
      <Icon
        className={`${isSmall ? 'mr-1 h-3 w-3' : 'mr-1.5 h-3.5 w-3.5'}`}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}