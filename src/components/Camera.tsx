'use client';

// ============================================
// CAMERA VIEWFINDER & CAPTURE ENGINE
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.1)
// ============================================

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, RefreshCw, Upload, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraProps {
  onCapture: (fullBlob: Blob, thumbnailBlob: Blob) => void;
  className?: string;
}

export function Camera({ onCapture, className }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const streamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<{
    fullBlob: Blob;
    thumbnailBlob: Blob;
    url: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Stop current active stream tracks safely
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  // Initialize camera stream with dual fallback strategy
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopStream();
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser. Please use the file upload option.');
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        // Strategy A: Request requested facing mode with HD ideal constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (errA) {
        console.warn('[Camera] Ideal facingMode failed, attempting generic video fallback:', errA);
        // Strategy B: Fall back to basic video constraint (essential for desktop/laptop webcams)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      if (!isMountedRef.current) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.warn('[Camera] getUserMedia failed completely:', err);
      if (isMountedRef.current) {
        setCameraError(
          err?.name === 'NotAllowedError'
            ? 'Camera access permission denied. Please grant permission or choose a file.'
            : 'Unable to start camera. Please use the file upload option below.'
        );
      }
    }
  }, [stopStream]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera(facingMode);

    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, [facingMode, startCamera, stopStream]);

  // Clean up preview object URL on retake or unmount
  const clearPreview = useCallback(() => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview.url);
      setCapturedPreview(null);
    }
  }, [capturedPreview]);

  // Capture frame from active video element
  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // Full-resolution canvas
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = width;
      fullCanvas.height = height;
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) throw new Error('Canvas 2D unavailable');

      fullCtx.drawImage(video, 0, 0, width, height);

      // Downscaled thumbnail canvas (320x240)
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 320;
      thumbCanvas.height = 240;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (!thumbCtx) throw new Error('Thumbnail canvas unavailable');

      thumbCtx.drawImage(fullCanvas, 0, 0, 320, 240);

      // Convert to Blobs
      const [fullBlob, thumbnailBlob] = await Promise.all([
        new Promise<Blob>((res, rej) =>
          fullCanvas.toBlob((b) => (b ? res(b) : rej('Blob creation failed')), 'image/jpeg', 0.85)
        ),
        new Promise<Blob>((res, rej) =>
          thumbCanvas.toBlob((b) => (b ? res(b) : rej('Thumb creation failed')), 'image/jpeg', 0.7)
        ),
      ]);

      const previewUrl = URL.createObjectURL(fullBlob);
      setCapturedPreview({
        fullBlob,
        thumbnailBlob,
        url: previewUrl,
      });
    } catch (err) {
      console.error('[Camera] Capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle image upload from file input (gallery fallback)
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      const tempUrl = URL.createObjectURL(file);
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = tempUrl;
      });
      URL.revokeObjectURL(tempUrl);

      // Full canvas
      const fullCanvas = document.createElement('canvas');
      const maxDim = 1280;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      fullCanvas.width = w;
      fullCanvas.height = h;
      const fullCtx = fullCanvas.getContext('2d')!;
      fullCtx.drawImage(img, 0, 0, w, h);

      // Thumbnail canvas
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 320;
      thumbCanvas.height = 240;
      const thumbCtx = thumbCanvas.getContext('2d')!;
      thumbCtx.drawImage(fullCanvas, 0, 0, 320, 240);

      const [fullBlob, thumbnailBlob] = await Promise.all([
        new Promise<Blob>((res, rej) =>
          fullCanvas.toBlob((b) => (b ? res(b) : rej('Blob creation failed')), 'image/jpeg', 0.85)
        ),
        new Promise<Blob>((res, rej) =>
          thumbCanvas.toBlob((b) => (b ? res(b) : rej('Thumb creation failed')), 'image/jpeg', 0.7)
        ),
      ]);

      const previewUrl = URL.createObjectURL(fullBlob);
      setCapturedPreview({
        fullBlob,
        thumbnailBlob,
        url: previewUrl,
      });
    } catch (err) {
      console.error('[Camera] File processing error:', err);
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  }, []);

  const handleConfirmPhoto = useCallback(() => {
    if (capturedPreview) {
      onCapture(capturedPreview.fullBlob, capturedPreview.thumbnailBlob);
    }
  }, [capturedPreview, onCapture]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className={cn('relative w-full h-full flex flex-col bg-[#0f131a] overflow-hidden select-none', className)}>
      {/* Hidden File Input for fallback gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Viewfinder or Photo Freeze Preview */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        {capturedPreview ? (
          /* Captured Photo Review Mode */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedPreview.url}
              alt="Hazard snapshot preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <span className="bg-black/70 backdrop-blur-md text-[#fbbf24] text-xs font-mono px-3 py-1.5 rounded-full border border-[#fbbf24]/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Photo Captured · Review Frame
              </span>
            </div>
          </div>
        ) : (
          /* Active Camera Viewfinder */
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                streamActive ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Sunlight Alignment Reticle Overlay */}
            {streamActive && (
              <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="reticle-corner top-0 left-0 border-t-2 border-l-2" />
                  <div className="reticle-corner top-0 right-0 border-t-2 border-r-2" />
                </div>
                <div className="self-center bg-black/60 backdrop-blur-sm text-slate-300 text-[11px] font-mono px-3 py-1 rounded-full border border-white/10">
                  Align Track Hazard in Reticle
                </div>
                <div className="flex justify-between">
                  <div className="reticle-corner bottom-0 left-0 border-b-2 border-l-2" />
                  <div className="reticle-corner bottom-0 right-0 border-b-2 border-r-2" />
                </div>
              </div>
            )}

            {/* Camera Error / Loading Fallback State */}
            {(!streamActive || cameraError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0f131a]">
                <AlertCircle className="w-12 h-12 text-[#fbbf24] mb-3 opacity-90 animate-pulse" />
                <p className="text-sm font-semibold text-slate-200 max-w-xs mb-2">
                  {cameraError || 'Initializing Camera Viewfinder...'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs mb-6">
                  Ensure camera permissions are allowed, or snap / upload a photo directly from your device storage.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#fbbf24] text-[#1c1300] font-bold text-xs flex items-center gap-2 card-pressable glow-amber"
                >
                  <Upload className="w-4 h-4" /> Choose from Gallery / Storage
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera Controls Toolbar */}
      <div className="w-full bg-[#161b24] border-t border-slate-800/80 px-6 py-4 pb-safe flex items-center justify-between">
        {capturedPreview ? (
          /* Confirmation Controls */
          <>
            <button
              type="button"
              onClick={clearPreview}
              className="touch-target px-4 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 card-pressable"
            >
              <X className="w-4 h-4" /> Retake
            </button>
            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="touch-target px-6 py-2.5 rounded-xl bg-[#fbbf24] text-[#1c1300] text-xs font-bold flex items-center gap-2 card-pressable glow-amber"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Use This Photo
            </button>
          </>
        ) : (
          /* Capture Controls */
          <>
            {/* Gallery Upload Fallback */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload from storage"
              className="touch-target w-12 h-12 rounded-full bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center card-pressable border border-slate-700"
            >
              <Upload className="w-5 h-5" />
            </button>

            {/* Big Shutter Button */}
            <button
              type="button"
              disabled={!streamActive || isProcessing}
              onClick={handleCapture}
              className={cn(
                'touch-target w-20 h-20 rounded-full border-4 border-[#fbbf24] flex items-center justify-center card-pressable transition-transform',
                streamActive ? 'glow-amber active:scale-95' : 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="w-14 h-14 rounded-full bg-[#fbbf24] flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-[#1c1300]" />
              </div>
            </button>

            {/* Switch Camera (Rear / Front) */}
            <button
              type="button"
              onClick={toggleFacingMode}
              title="Flip camera"
              className="touch-target w-12 h-12 rounded-full bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center card-pressable border border-slate-700"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
