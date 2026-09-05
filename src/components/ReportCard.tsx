"use client";

import Link from "next/link";
import type { HazardReport } from "@/lib/types";
import { HAZARD_OPTIONS, SEVERITY_OPTIONS } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface ReportCardProps {
  report: HazardReport;
}

export default function ReportCard({
  report,
}: ReportCardProps) {
  const hazard = HAZARD_OPTIONS.find(
    (option) => option.value === report.hazardType,
  );

  const severity = SEVERITY_OPTIONS.find(
    (option) => option.value === report.severity,
  );

  const thumbnailUrl =
    report.photoThumbnail instanceof Blob
      ? URL.createObjectURL(report.photoThumbnail)
      : null;

  return (
    <Link
      href={`/report/${report.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex gap-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={hazard?.label ?? "Hazard report"}
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
            {hazard?.icon ?? "⚠️"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">
                {hazard?.icon}{" "}
                {hazard?.label ?? report.hazardType}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {report.section}
                {report.kmMarker
                  ? ` • KM ${report.kmMarker}`
                  : ""}
              </p>
            </div>

            <span
              className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: `${
                  severity?.color ?? "#94a3b8"
                }20`,
                color: severity?.color ?? "#64748b",
              }}
            >
              {severity?.label ?? report.severity}
            </span>
          </div>

          {report.userNote || report.aiNote ? (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {report.userNote || report.aiNote}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2">
            <StatusBadge status={report.inspectionStatus} />

            <span className="text-[11px] text-slate-400">
              {new Date(report.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            Sync:{" "}
            <span className="font-medium capitalize">
              {report.syncStatus}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}