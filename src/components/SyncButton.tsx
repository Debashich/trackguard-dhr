"use client";

import { useEffect, useState } from "react";
import {
    registerBackgroundSync,
    syncNow,
} from "@/lib/sync";
import { getPendingCount } from "@/lib/storage";

export default function SyncButton() {
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [online, setOnline] = useState(
        () =>
            typeof navigator !== "undefined"
                ? navigator.onLine
                : true,
    );
    const [message, setMessage] = useState("");

    const refreshPendingCount = async () => {
        try {
            const count = await getPendingCount();
            setPendingCount(count);
        } catch (error) {
            console.error(
                "Failed to get pending report count:",
                error,
            );
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            refreshPendingCount();
        }, 0);

        const handleOnline = () => {
            setOnline(true);
            refreshPendingCount();
            registerBackgroundSync();
        };

        const handleOffline = () => {
            setOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const handleSync = async () => {
        if (!navigator.onLine) {
            setMessage(
                "You're offline. Reports will sync when you're connected.",
            );
            return;
        }

        if (syncing) return;

        setSyncing(true);
        setMessage("");

        try {
            const result = await syncNow();

            await refreshPendingCount();

            if (result.synced > 0 && result.failed === 0) {
                setMessage(
                    `${result.synced} report${result.synced === 1 ? "" : "s"
                    } synced successfully.`,
                );
            } else if (
                result.synced > 0 &&
                result.failed > 0
            ) {
                setMessage(
                    `${result.synced} synced, ${result.failed} failed. You can retry failed reports.`,
                );
            } else if (result.failed > 0) {
                setMessage(
                    `${result.failed} report${result.failed === 1 ? "" : "s"
                    } failed to sync.`,
                );
            } else {
                setMessage("Everything is already synced.");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            setMessage("Sync failed. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${online
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                        />

                        <span className="text-sm font-semibold text-slate-900">
                            {online ? "Online" : "Offline"}
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                        {pendingCount > 0
                            ? `${pendingCount} report${pendingCount === 1 ? "" : "s"
                            } waiting to sync`
                            : "All reports synced"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSync}
                    disabled={
                        !online ||
                        syncing ||
                        pendingCount === 0
                    }
                    className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {syncing ? "Syncing…" : "Sync Now"}
                </button>
            </div>

            {message ? (
                <p className="px-1 text-xs text-slate-500">
                    {message}
                </p>
            ) : null}
        </div>
    );
}