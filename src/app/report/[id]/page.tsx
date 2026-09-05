'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SeverityBadge from '@/components/SeverityBadge';
import HazardIcon from '@/components/HazardIcon';
import { getReportById, updateInspectionStatus } from '@/lib/storage';
import { HazardReport, HAZARD_OPTIONS, InspectionStatus } from '@/lib/types';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [report, setReport] = useState<HazardReport | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    let activeUrl: string | null = null;

    async function loadReport() {
      if (!reportId) return;

      try {
        setLoading(true);
        const data = await getReportById(reportId);
        if (data) {
          setReport(data);
          if (data.photoBlob) {
            activeUrl = URL.createObjectURL(data.photoBlob);
            setPhotoUrl(activeUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [reportId]);

  const handleStatusChange = async (newStatus: InspectionStatus) => {
    if (!report) return;
    setIsUpdatingStatus(true);
    try {
      await updateInspectionStatus(report.id, newStatus);
      setReport((prev) => (prev ? { ...prev, inspectionStatus: newStatus } : null));
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f131a] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading inspection report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0f131a] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-3 bg-[#161b24] border border-slate-800 rounded-full text-slate-400">
          <FileText className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold">Report Not Found</h2>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          The requested inspection report could not be found in local storage.
        </p>
        <Link href="/queue">
          <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">
            Return to Reports
          </Button>
        </Link>
      </div>
    );
  }

  const hazardOption = HAZARD_OPTIONS.find((h) => h.value === report.hazardType);
  const formattedDate = new Date(report.timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-[#0f131a] text-slate-100 pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#161b24]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-xs font-mono text-slate-400">
          ID: {report.id.slice(0, 8)}...
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
              report.syncStatus === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}
          >
            {report.syncStatus}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Photo Display */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#161b24] shadow-md">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Hazard inspection capture"
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-[#131720] text-slate-400 text-xs">
              Photo preview unavailable
            </div>
          )}

          <div className="absolute top-3 right-3">
            <SeverityBadge severity={report.severity} size="md" />
          </div>

          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>DHR Km {report.kmMarker}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300 text-[11px]">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Hazard Classification Card */}
        <div className="bg-[#161b24] border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#131720] rounded-xl border border-slate-800 text-amber-400">
                <HazardIcon type={report.hazardType} className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Confirmed Hazard
                </div>
                <div className="text-base font-bold text-white">
                  {hazardOption?.label || report.hazardType}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Status</div>
              <div className="text-xs font-semibold capitalize text-amber-400">
                {report.inspectionStatus.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Gangman Note */}
          <div className="p-3 bg-[#131720] rounded-lg border border-slate-800 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Gangman&apos;s Official Inspection Note
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {report.userNote || 'No additional note provided.'}
            </p>
          </div>
        </div>

        {/* AI Suggestions Reference Card (Proof of Human-in-the-Loop) */}
        <div className="bg-[#161b24] border border-amber-500/25 rounded-xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Original Gemma 4 E2B AI Output</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Audited</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
            <div>
              <span className="text-slate-400 text-[11px] block">AI Suggested Type:</span>
              <span className="font-semibold text-slate-200 capitalize">
                {report.aiSuggestedType || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">AI Suggested Severity:</span>
              <span className="font-semibold text-slate-200 capitalize">
                {report.aiSuggestedSeverity || 'N/A'}
              </span>
            </div>
          </div>

          {report.aiNote && (
            <div className="text-[11px] text-slate-300 italic bg-[#131720] p-2.5 rounded-lg border border-slate-800">
              &ldquo;{report.aiNote}&rdquo;
            </div>
          )}
        </div>

        {/* Workflow & Supervisor Status Actions */}
        <div className="bg-[#161b24] border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Supervisor Actions
            </span>
            <span className="text-[10px] font-mono text-slate-400">Status Update</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUpdatingStatus || report.inspectionStatus === 'acknowledged'}
              onClick={() => handleStatusChange('acknowledged')}
              className={`text-xs h-9 px-2 border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 ${
                report.inspectionStatus === 'acknowledged' ? 'border-amber-500/50 text-amber-400 font-semibold' : ''
              }`}
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Acknowledge
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isUpdatingStatus || report.inspectionStatus === 'inspection_required'}
              onClick={() => handleStatusChange('inspection_required')}
              className={`text-xs h-9 px-2 border-orange-500/30 bg-orange-950/20 hover:bg-orange-900/40 text-orange-300 ${
                report.inspectionStatus === 'inspection_required' ? 'border-orange-500 font-semibold' : ''
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-orange-400" /> Require Insp.
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isUpdatingStatus || report.inspectionStatus === 'resolved'}
              onClick={() => handleStatusChange('resolved')}
              className={`text-xs h-9 px-2 border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-300 ${
                report.inspectionStatus === 'resolved' ? 'border-emerald-500 font-semibold' : ''
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Resolved
            </Button>
          </div>
        </div>

        {/* Technical & GPS Metadata */}
        <div className="bg-[#161b24] border border-slate-800 rounded-xl p-4 space-y-2 text-xs shadow-sm">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            Alignment & Device Telemetry
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <div>
              <span className="text-slate-500 block">Section:</span>
              <span className="font-medium text-slate-200 capitalize">
                {report.section.replace('-', ' → ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">GPS Coordinates:</span>
              <span className="font-mono text-slate-200">
                {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">GPS Accuracy:</span>
              <span className="text-slate-200">±{Math.round(report.accuracy)} meters</span>
            </div>
            <div>
              <span className="text-slate-500 block">Sync Attempts:</span>
              <span className="text-slate-200">{report.retryCount}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
