'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Upload,
  Globe,
  CheckCircle2,
  X,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  setCustomModel,
  resetToDefaultModel,
  getCustomModelInfo,
  isLLMAvailable,
  initLLM,
  GEMMA_4_E2B_MODEL_URL,
} from '@/lib/llm';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModelSettingsModal({
  isOpen,
  onClose,
}: ModelSettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasWebGPU, setHasWebGPU] = useState<boolean>(true);
  const [modelInfo, setModelInfo] = useState<{ isCustom: boolean; name: string | null }>({
    isCustom: false,
    name: null,
  });
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasWebGPU(isLLMAvailable());
      setModelInfo(getCustomModelInfo());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setCustomModel(file, `${file.name} (${sizeMB} MB)`);
    setModelInfo(getCustomModelInfo());
    setTestResult(null);
  };

  const handleResetToCDN = () => {
    resetToDefaultModel();
    setModelInfo(getCustomModelInfo());
    setTestResult(null);
  };

  const handleTestInit = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await initLLM();
      setTestResult({
        success: true,
        message: 'Gemma 4 E2B initialized successfully via WebGPU!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Initialization failed';
      setTestResult({
        success: false,
        message: msg,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#161b24] border border-slate-800 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Gemma 4 AI Settings</h3>
              <p className="text-[11px] text-slate-400">On-Device WebGPU Inference</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* WebGPU Status Check */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium ${
            hasWebGPU
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {hasWebGPU ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            )}
            <span>WebGPU Hardware Acceleration</span>
          </div>
          <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-900/60 border border-current font-mono">
            {hasWebGPU ? 'Available' : 'Missing / Off'}
          </span>
        </div>

        {/* Current Active Source */}
        <div className="bg-[#131720] border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Model Source
          </div>
          {modelInfo.isCustom ? (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg text-amber-300">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold truncate max-w-[200px]">
                  {modelInfo.name}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToCDN}
                className="h-7 text-[11px] text-slate-400 hover:text-white"
              >
                Reset to CDN
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#161b24] border border-slate-800 p-2.5 rounded-lg text-slate-200">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-sky-400 shrink-0" />
                <span className="font-medium">Hugging Face Web CDN (~2.0 GB)</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Default
              </span>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".litertlm"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Options */}
        <div className="space-y-2">
          {/* Load Local File Button */}
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-11 bg-[#131720] hover:bg-slate-800/80 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Load Local &quot;gemma-4-E2B-it-web.litertlm&quot; from Downloads</span>
          </Button>
          <p className="text-[10px] text-slate-400 text-center">
            Pick your local file for instant 100% offline train/airplane mode demo.
          </p>
        </div>

        {/* Test Initializer */}
        <div className="pt-1">
          <Button
            type="button"
            onClick={handleTestInit}
            disabled={isTesting || !hasWebGPU}
            className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initializing Gemma 4 into WebGPU memory...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Test / Warm-Up Model Now</span>
              </>
            )}
          </Button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <p className="leading-snug">{testResult.message}</p>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-700 text-slate-300 hover:text-white text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
