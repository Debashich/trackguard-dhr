'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Cpu,
  Check,
  AlertCircle,
  Clock,
  MapPin,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import HazardSelector from '@/components/HazardSelector';
import SeverityBadge from '@/components/SeverityBadge';
import ModelSettingsModal from '@/components/ModelSettingsModal';
import HazardIcon from '@/components/HazardIcon';
import { useReport } from '@/lib/ReportContext';
import { analyzeHazard, isLLMAvailable } from '@/lib/llm';
import { saveReport } from '@/lib/storage';
import { HazardReport, HazardType, Severity } from '@/lib/types';

export default function ReviewReportPage() {
  const router = useRouter();
  const { draft, clearDraft } = useReport();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  // Confirmed fields (editable by gangman)
  const [hazardType, setHazardType] = useState<HazardType>('rockfall');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [userNote, setUserNote] = useState<string>('');
  const [kmMarker, setKmMarker] = useState<string>('51.0');

  // AI suggestions (preserved as reference)
  const [aiType, setAiType] = useState<string>('rockfall');
  const [aiSeverity, setAiSeverity] = useState<string>('medium');
  const [aiNote, setAiNote] = useState<string>('');

  const analysisStarted = useRef(false);

  useEffect(() => {
    // If no draft exists (e.g. direct URL visit), navigate back
    if (!draft.photoBlob) {
      router.push('/report/new');
      return;
    }

    if (draft.location) {
      setKmMarker(draft.location.kmMarker);
    }

    // Run AI analysis once when screen loads
    if (!analysisStarted.current) {
      analysisStarted.current = true;
      runAnalysis();
    }
  }, [draft, router]);

  const runAnalysis = async () => {
    if (!draft.photoBlob || !draft.location) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeHazard(draft.photoBlob, {
        lat: draft.location.latitude,
        lng: draft.location.longitude,
        kmMarker: draft.location.kmMarker,
      });

      // Populate AI values
      setAiType(result.type);
      setAiSeverity(result.severity);
      setAiNote(result.note);

      // Pre-populate gangman fields for quick confirmation
      setHazardType(result.type);
      setSeverity(result.severity);
      setUserNote(result.note);
      setHasAnalyzed(true);
    } catch (err) {
      console.error('Error during AI review pass:', err);
      // Fallback
      setUserNote('Visual inspection on DHR alignment.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!draft.photoBlob || !draft.photoThumbnail) return;

    setIsSaving(true);
    try {
      const newReport: HazardReport = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        latitude: draft.location?.latitude || 26.8814,
        longitude: draft.location?.longitude || 88.2783,
        accuracy: draft.location?.accuracy || 15,
        kmMarker: kmMarker || draft.location?.kmMarker || '51.0',
        section: draft.location?.section || 'kurseong-ghum',
        hazardType,
        severity,
        aiSuggestedType: aiType,
        aiSuggestedSeverity: aiSeverity,
        aiNote,
        userNote,
        photoBlob: draft.photoBlob,
        photoThumbnail: draft.photoThumbnail,
        inspectionStatus: 'open',
        syncStatus: 'pending',
        syncTimestamp: null,
        retryCount: 0,
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'DHR Handheld PWA',
      };

      await saveReport(newReport);
      setSaveSuccess(true);
      clearDraft();

      setTimeout(() => {
        router.push('/queue');
      }, 800);
    } catch (err) {
      console.error('Failed to save report:', err);
      alert('Failed to save report locally. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!draft.photoBlob) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f131a] text-slate-100 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#161b24]/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link
          href="/report/new"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Retake
        </Link>
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Human-in-the-Loop Review</span>
        </div>
        <div className="w-12 text-right">
          <span className="text-[10px] font-mono text-slate-400">STEP 2/2</span>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Photo Preview & Location Tag */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#161b24] shadow-md">
          {draft.photoPreviewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.photoPreviewUrl}
              alt="Track inspection hazard"
              className="w-full h-52 object-cover"
            />
          )}

          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>DHR Km {kmMarker}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <Clock className="h-3 w-3" />
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* AI Suggestion Card */}
        <div className="rounded-xl border border-amber-500/25 bg-[#161b24] p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Gemma 4 E2B AI Suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/20">
                {isLLMAvailable() ? 'WebGPU On-Device' : 'Standard Baseline'}
              </span>
              <button
                type="button"
                onClick={() => setIsModelModalOpen(true)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Configure Model / Load Local .litertlm"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {isAnalyzing ? (
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-2 text-amber-400">
              <Cpu className="h-6 w-6 animate-spin text-amber-400" />
              <p className="text-xs font-medium text-slate-300">Analyzing hazard & drafting observational note...</p>
            </div>
          ) : hasAnalyzed ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Suggested Hazard:</span>
                <span className="font-semibold text-slate-100 capitalize flex items-center gap-1.5">
                  <HazardIcon type={aiType} className="h-4 w-4 text-amber-400" />
                  {aiType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Suggested Severity:</span>
                <SeverityBadge severity={aiSeverity} size="sm" />
              </div>
              <div className="pt-1.5 border-t border-slate-800">
                <p className="text-[11px] text-slate-300 italic bg-[#131720] p-2.5 rounded-lg border border-slate-800">
                  &ldquo;{aiNote}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">AI analysis ready. Review fields below.</p>
          )}

          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <AlertCircle className="h-3 w-3 text-amber-400 shrink-0" />
            <span>AI assists only. Gangman holds complete authority over final report.</span>
          </div>
        </div>

        {/* Human Confirmation Section */}
        <div className="bg-[#161b24] p-4 rounded-xl border border-slate-800 shadow-sm">
          <HazardSelector
            hazardType={hazardType}
            severity={severity}
            note={userNote}
            kmMarker={kmMarker}
            onHazardTypeChange={setHazardType}
            onSeverityChange={setSeverity}
            onNoteChange={setUserNote}
            onKmMarkerChange={setKmMarker}
            disabled={isSaving}
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving || saveSuccess}
            className="w-full h-14 rounded-xl text-base font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
          >
            {saveSuccess ? (
              <>
                <Check className="h-5 w-5" /> Saved to Offline Queue!
              </>
            ) : isSaving ? (
              <>
                <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Saving to Logbook...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" /> Confirm & Save Report
              </>
            )}
          </Button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Stores securely in local IndexedDB. Syncs when station Wi-Fi/signal returns.
          </p>
        </div>
      </main>

      <ModelSettingsModal
        isOpen={isModelModalOpen}
        onClose={() => {
          setIsModelModalOpen(false);
          runAnalysis();
        }}
      />
    </div>
  );
}
