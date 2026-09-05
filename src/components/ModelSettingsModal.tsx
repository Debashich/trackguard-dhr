'use client';

// ============================================
// MODEL SETTINGS & WEBGPU DIAGNOSTIC MODAL
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.9)
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, X, CheckCircle2, AlertTriangle, Upload, Sparkles, RefreshCw } from 'lucide-react';
import { isLLMAvailable, getActiveModelName, initLLM } from '@/lib/llm';
import { cn } from '@/lib/utils';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelSettingsModal({ isOpen, onClose }: ModelSettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [webGpuSupported, setWebGpuSupported] = useState<boolean>(false);
  const [modelSource, setModelSource] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWebGpuSupported(isLLMAvailable());
      setModelSource(getActiveModelName());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(`Loading local model file (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const success = await initLLM(file);
      if (success) {
        setModelSource(`Local: ${file.name}`);
        setStatusMessage('Local model loaded and ready for WebGPU inference.');
      } else {
        setStatusMessage('Failed to initialize local model on WebGPU.');
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err?.message || 'Model initialization failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    setIsLoading(true);
    setStatusMessage('Reconnecting to default LiteRT-LM web model...');
    try {
      await initLLM();
      setModelSource(getActiveModelName());
      setStatusMessage('Default model ready.');
    } catch {
      setStatusMessage('Default model initialization error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#161b24] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/15 border border-[#fbbf24]/30 flex items-center justify-center text-[#fbbf24]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">On-Device AI Engine</h3>
              <p className="text-[11px] text-slate-400">LiteRT-LM & WebGPU Telemetry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WebGPU Status Pill */}
        <div className="p-3 rounded-xl bg-[#0f131a] border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {webGpuSupported ? (
              <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
            )}
            <span className="text-xs font-mono font-medium text-slate-200">WebGPU Acceleration</span>
          </div>
          <span
            className={cn(
              'text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border',
              webGpuSupported
                ? 'bg-[#34d399]/15 text-[#34d399] border-[#34d399]/30'
                : 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30'
            )}
          >
            {webGpuSupported ? 'Hardware Active' : 'Fallback Active'}
          </span>
        </div>

        {/* Model Architecture Info */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Active Model Architecture
          </label>
          <div className="p-3 rounded-xl bg-[#0f131a] border border-slate-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-slate-200 font-semibold">Gemma 4 E2B Multimodal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Parameters:</span>
              <span className="text-slate-200">2 Billion (Mixed 2/4/8-bit)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Source:</span>
              <span className="text-[#fbbf24] truncate max-w-[200px]">{modelSource || 'LiteRT CDN'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Safety Guard:</span>
              <span className="text-[#34d399]">Human-in-the-Loop Audit</span>
            </div>
          </div>
        </div>

        {/* Local Offline File Upload */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Offline Evaluation (.litertlm)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".litertlm,.bin"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 touch-target py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 card-pressable border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5 text-[#fbbf24]" />
              Load Local .litertlm
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleResetToDefault}
              title="Reset to default CDN model"
              className="touch-target p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 card-pressable border border-slate-700"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin text-[#fbbf24]')} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-[#0f131a] border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full touch-target py-2.5 rounded-xl bg-[#fbbf24] text-[#1c1300] text-xs font-bold card-pressable glow-amber"
        >
          Done
        </button>
      </div>
    </div>
  );
}
