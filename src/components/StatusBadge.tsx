import type { InspectionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: InspectionStatus;
}

const STATUS_CONFIG: Record<
  InspectionStatus,
  {
    label: string;
    className: string;
  }
> = {
  open: {
    label: "Open",
    className:
      "bg-slate-100 text-slate-700",
  },
  acknowledged: {
    label: "Acknowledged",
    className:
      "bg-blue-100 text-blue-700",
  },
  inspection_required: {
    label: "Inspection Required",
    className:
      "bg-amber-100 text-amber-700",
  },
  resolved: {
    label: "Resolved",
    className:
      "bg-emerald-100 text-emerald-700",
  },
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}