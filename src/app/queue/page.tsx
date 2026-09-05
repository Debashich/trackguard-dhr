"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReportCard from "@/components/ReportCard";
import SyncButton from "@/components/SyncButton";
import { getPendingReports } from "@/lib/storage";
import type { HazardReport } from "@/lib/types";

export default function QueuePage() {
    const [reports, setReports] = useState<HazardReport[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReports = useCallback(async () => {
        try {
            setLoading(true);

            const pendingReports = await getPendingReports();

            setReports(pendingReports);
        } catch (error) {
            console.error(
                "Failed to load queued reports:",
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

    return (
        <main className="mx-auto min-h-screen max-w-2xl px-4 pb-28 pt-6">
            <div className="mb-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            TrackGuard DHR
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            My Reports
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
                    Reports saved on this device and waiting
                    for synchronization.
                </p>
            </div>

            <div className="mb-6">
                <SyncButton />
            </div>

            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                    <p className="text-sm text-slate-500">
                        Loading reports…
                    </p>
                </div>
            ) : reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div className="text-4xl">📋</div>

                    <h2 className="mt-3 text-lg font-semibold text-slate-900">
                        No pending reports
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        New reports will appear here when they
                        are saved offline.
                    </p>

                    <Link
                        href="/report"
                        className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                        Create Report
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-700">
                            {reports.length} pending{" "}
                            {reports.length === 1
                                ? "report"
                                : "reports"}
                        </h2>

                        <button
                            type="button"
                            onClick={loadReports}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                        >
                            Refresh
                        </button>
                    </div>

                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}