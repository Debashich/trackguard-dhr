"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    getAllReports,
} from "@/lib/storage";
import {
    HAZARD_OPTIONS,
    SECTIONS,
    SEVERITY_OPTIONS,
    type HazardReport,
    type InspectionStatus,
    type Severity,
} from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

type StatusFilter = "all" | InspectionStatus;
type SeverityFilter = "all" | Severity;
type SectionFilter = "all" | string;

const INSPECTION_STATUSES: {
    value: InspectionStatus;
    label: string;
}[] = [
        {
            value: "open",
            label: "Open",
        },
        {
            value: "acknowledged",
            label: "Acknowledged",
        },
        {
            value: "inspection_required",
            label: "Inspection Required",
        },
        {
            value: "resolved",
            label: "Resolved",
        },
    ];

export default function DashboardPage() {
    const [reports, setReports] = useState<HazardReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [sectionFilter, setSectionFilter] =
        useState<SectionFilter>("all");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");
    const [severityFilter, setSeverityFilter] =
        useState<SeverityFilter>("all");

    const loadReports = useCallback(async () => {
        try {
            setLoading(true);

            const allReports = await getAllReports();

            setReports(
                allReports.sort(
                    (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime(),
                ),
            );
        } catch (error) {
            console.error(
                "Failed to load dashboard reports:",
                error,
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadReports();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [loadReports]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            if (
                sectionFilter !== "all" &&
                report.section !== sectionFilter
            ) {
                return false;
            }

            if (
                statusFilter !== "all" &&
                report.inspectionStatus !== statusFilter
            ) {
                return false;
            }

            if (
                severityFilter !== "all" &&
                report.severity !== severityFilter
            ) {
                return false;
            }

            return true;
        });
    }, [
        reports,
        sectionFilter,
        statusFilter,
        severityFilter,
    ]);

    const statusCounts = useMemo(() => {
        return {
            open: reports.filter(
                (report) =>
                    report.inspectionStatus === "open",
            ).length,

            acknowledged: reports.filter(
                (report) =>
                    report.inspectionStatus === "acknowledged",
            ).length,

            inspection_required: reports.filter(
                (report) =>
                    report.inspectionStatus ===
                    "inspection_required",
            ).length,

            resolved: reports.filter(
                (report) =>
                    report.inspectionStatus === "resolved",
            ).length,
        };
    }, [reports]);

    const severityCounts = useMemo(() => {
        return {
            low: reports.filter(
                (report) => report.severity === "low",
            ).length,

            medium: reports.filter(
                (report) => report.severity === "medium",
            ).length,

            high: reports.filter(
                (report) => report.severity === "high",
            ).length,

            critical: reports.filter(
                (report) => report.severity === "critical",
            ).length,
        };
    }, [reports]);

    const sectionCounts = useMemo(() => {
        return SECTIONS.map((section) => ({
            ...section,
            count: reports.filter(
                (report) => report.section === section.label,
            ).length,
        }));
    }, [reports]);

    return (
        <main className="mx-auto min-h-screen max-w-4xl px-4 pb-28 pt-6">
            <div className="mb-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            TrackGuard DHR
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Dashboard
                        </h1>
                    </div>

                    <Link
                        href="/"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                    >
                        Home
                    </Link>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                    Overview of reported hazards across the
                    Darjeeling Himalayan Railway alignment.
                </p>
            </div>

            {/* Overview */}
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500">
                        Total Reports
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {reports.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500">
                        Open
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {statusCounts.open}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500">
                        Inspection
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {statusCounts.inspection_required}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-500">
                        Resolved
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {statusCounts.resolved}
                    </p>
                </div>
            </section>

            {/* Section summary */}
            <section className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">
                        Railway Sections
                    </h2>

                    <span className="text-xs text-slate-400">
                        {reports.length} total
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {sectionCounts.map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() =>
                                setSectionFilter(
                                    sectionFilter === section.label
                                        ? "all"
                                        : section.label,
                                )
                            }
                            className={`rounded-2xl border p-4 text-left transition ${sectionFilter === section.label
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-slate-900">
                                    {section.label}
                                </span>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                    {section.count}
                                </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Reported hazards
                            </p>
                        </button>
                    ))}
                </div>
            </section>

            {/* Filters */}
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">
                        Filters
                    </h2>

                    <button
                        type="button"
                        onClick={() => {
                            setSectionFilter("all");
                            setStatusFilter("all");
                            setSeverityFilter("all");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                    >
                        Clear
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-slate-500">
                            Section
                        </span>

                        <select
                            value={sectionFilter}
                            onChange={(event) =>
                                setSectionFilter(event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                        >
                            <option value="all">
                                All sections
                            </option>

                            {SECTIONS.map((section) => (
                                <option
                                    key={section.id}
                                    value={section.label}
                                >
                                    {section.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-slate-500">
                            Inspection Status
                        </span>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value as StatusFilter,
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                        >
                            <option value="all">
                                All statuses
                            </option>

                            {INSPECTION_STATUSES.map((status) => (
                                <option
                                    key={status.value}
                                    value={status.value}
                                >
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-medium text-slate-500">
                            Severity
                        </span>

                        <select
                            value={severityFilter}
                            onChange={(event) =>
                                setSeverityFilter(
                                    event.target.value as SeverityFilter,
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                        >
                            <option value="all">
                                All severities
                            </option>

                            {SEVERITY_OPTIONS.map((severity) => (
                                <option
                                    key={severity.value}
                                    value={severity.value}
                                >
                                    {severity.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            {/* Status summary */}
            <section className="mb-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">
                    Inspection Workflow
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {INSPECTION_STATUSES.map((status) => (
                        <button
                            key={status.value}
                            type="button"
                            onClick={() =>
                                setStatusFilter(
                                    statusFilter === status.value
                                        ? "all"
                                        : status.value,
                                )
                            }
                            className={`rounded-2xl border bg-white p-3 text-left transition ${statusFilter === status.value
                                    ? "border-slate-900"
                                    : "border-slate-200"
                                }`}
                        >
                            <StatusBadge status={status.value} />

                            <p className="mt-2 text-xl font-bold text-slate-900">
                                {statusCounts[status.value]}
                            </p>
                        </button>
                    ))}
                </div>
            </section>

            {/* Severity summary */}
            <section className="mb-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">
                    Severity
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SEVERITY_OPTIONS.map((severity) => (
                        <button
                            key={severity.value}
                            type="button"
                            onClick={() =>
                                setSeverityFilter(
                                    severityFilter === severity.value
                                        ? "all"
                                        : severity.value,
                                )
                            }
                            className={`rounded-2xl border bg-white p-3 text-left transition ${severityFilter === severity.value
                                    ? "border-slate-900"
                                    : "border-slate-200"
                                }`}
                        >
                            <span
                                className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{
                                    backgroundColor: `${severity.color}20`,
                                    color: severity.color,
                                }}
                            >
                                {severity.label}
                            </span>

                            <p className="mt-2 text-xl font-bold text-slate-900">
                                {severityCounts[severity.value]}
                            </p>
                        </button>
                    ))}
                </div>
            </section>

            {/* Reports */}
            <section>
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">
                            Reports
                        </h2>

                        <p className="text-xs text-slate-400">
                            Showing {filteredReports.length} of{" "}
                            {reports.length}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadReports}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                        <p className="text-sm text-slate-500">
                            Loading dashboard…
                        </p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                        <div className="text-4xl">🔎</div>

                        <h3 className="mt-3 font-semibold text-slate-900">
                            No matching reports
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Try changing or clearing the filters.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredReports.map((report) => {
                            const hazard = HAZARD_OPTIONS.find(
                                (option) =>
                                    option.value === report.hazardType,
                            );

                            const severity =
                                SEVERITY_OPTIONS.find(
                                    (option) =>
                                        option.value === report.severity,
                                );

                            return (
                                <Link
                                    key={report.id}
                                    href={`/report/${report.id}`}
                                    className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {hazard?.icon ?? "⚠️"}
                                                </span>

                                                <h3 className="truncate font-semibold text-slate-900">
                                                    {hazard?.label ??
                                                        report.hazardType}
                                                </h3>
                                            </div>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {report.section}
                                                {report.kmMarker
                                                    ? ` • KM ${report.kmMarker}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <span
                                            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                            style={{
                                                backgroundColor: `${severity?.color ??
                                                    "#94a3b8"
                                                    }20`,
                                                color:
                                                    severity?.color ??
                                                    "#64748b",
                                            }}
                                        >
                                            {severity?.label ??
                                                report.severity}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <StatusBadge
                                            status={report.inspectionStatus}
                                        />

                                        <span className="text-[11px] text-slate-400">
                                            {new Date(
                                                report.timestamp,
                                            ).toLocaleString()}
                                        </span>
                                    </div>

                                    {report.userNote ||
                                        report.aiNote ? (
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                                            {report.userNote ||
                                                report.aiNote}
                                        </p>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}