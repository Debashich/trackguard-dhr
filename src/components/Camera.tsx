'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, RefreshCw, Upload, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraProps {
  onCapture: (photoBlob: Blob, photoThumbnail: Blob) => void;
  className?: string;
}

export default function Camera({ onCapture, className = '' }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [tempBlobs, setTempBlobs] = useState<{ full: Blob; thumb: Blob } | null>(null);

  // Stop active media stream cleanly
  const stopCurrentStream = useCallback(() => {
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
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);
    stopCurrentStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this browser or device.');
      setIsInitializing(false);
      return;
    }

    let mediaStream: MediaStream;

    try {
      // 1. Try with preferred facingMode and resolution
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      // 2. Fallback to generic video (essential for laptops / virtual webcams where facingMode can throw)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        let msg = 'Unable to access camera. Please allow camera permissions.';
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = 'Camera permission was denied. Please allow camera access in browser settings.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = 'No camera device found on this system.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            msg = 'Camera is in use by another application.';
          } else {
            msg = err.message;
          }
        }
        setCameraError(msg);
        setIsInitializing(false);
        return;
      }
    }

    // If unmounted while waiting for user permission, release tracks immediately
    if (!isMountedRef.current) {
      mediaStream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = mediaStream;
    setIsInitializing(false);

    // Safely assign stream to video element
    if (videoRef.current) {
      const video = videoRef.current;
      video.srcObject = mediaStream;

      video.onloadedmetadata = () => {
        if (isMountedRef.current && videoRef.current) {
          videoRef.current.play().catch((playErr: unknown) => {
            // AbortError or "interrupted by removal" is benign during React remounts
            if (
              playErr instanceof Error &&
              (playErr.name === 'AbortError' || playErr.message.includes('interrupted'))
            ) {
              return;
            }
            console.warn('Video play notice:', playErr);
          });
        }
      };

      if (video.readyState >= 1) {
        video.play().catch(() => {});
      }
    }
  }, [stopCurrentStream]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera(facingMode);

    return () => {
      isMountedRef.current = false;
      stopCurrentStream();
    };
  }, [facingMode, startCamera, stopCurrentStream]);

  // Create thumbnail blob and full blob
  const createBlobsFromCanvas = async (
    sourceCanvas: HTMLCanvasElement
  ): Promise<{ full: Blob; thumb: Blob }> => {
    // 1. Full Blob (JPEG ~0.85 quality)
    const fullBlob = await new Promise<Blob>((resolve, reject) => {
      sourceCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create full image blob'))),
        'image/jpeg',
        0.85
      );
    });

    // 2. Thumbnail Canvas (max 320x240)
    const thumbCanvas = document.createElement('canvas');
    const scale = Math.min(320 / sourceCanvas.width, 240 / sourceCanvas.height, 1);
    thumbCanvas.width = Math.round(sourceCanvas.width * scale);
    thumbCanvas.height = Math.round(sourceCanvas.height * scale);

    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(sourceCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }

    const thumbBlob = await new Promise<Blob>((resolve, reject) => {
      thumbCanvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create thumb blob'))),
        'image/jpeg',
        0.7
      );
    });

    return { full: fullBlob, thumb: thumbBlob };
  };

  // Capture frame from active video stream
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
    const blobs = await createBlobsFromCanvas(canvas);

    setCapturedPreview(previewUrl);
    setTempBlobs(blobs);
  };

  // Handle file input fallback
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
        const blobs = await createBlobsFromCanvas(canvas);
        setCapturedPreview(previewUrl);
        setTempBlobs(blobs);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const confirmPhoto = () => {
    if (tempBlobs) {
      onCapture(tempBlobs.full, tempBlobs.thumb);
    }
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
    setTempBlobs(null);
    if (!streamRef.current) {
      startCamera(facingMode);
    } else if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className={`relative flex flex-col items-center justify-between w-full h-full bg-[#0a0d12] text-white ${className}`}>
      {/* Hidden canvas for snapshot rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery/camera fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Viewfinder or Captured Preview */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
        {capturedPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedPreview}
            alt="Captured hazard preview"
            className="w-full h-full object-contain"
          />
        ) : cameraError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm">
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-full text-rose-400">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Camera Unavailable</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cameraError}</p>
            </div>
            <div className="flex flex-col w-full gap-2 pt-2">
              <Button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Retry Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white"
              >
                <Upload className="h-4 w-4 mr-2" /> Select Photo from Device
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            {/* Guide overlay reticle for track hazard capture */}
            <div className="absolute inset-8 top-16 border border-white/25 rounded-xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between text-[10px] text-white/50 tracking-widest uppercase font-mono">
                <span>[ALIGN TRACK HAZARD]</span>
                <span>DHR {facingMode === 'environment' ? 'REAR' : 'FRONT'}</span>
              </div>
              <div className="flex justify-center">
                <div className="w-16 h-0.5 bg-amber-400/60 rounded-full" />
              </div>
              <div className="text-right text-[10px] text-white/50 font-mono">
                <span>SUNLIGHT-READY</span>
              </div>
            </div>

            {isInitializing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs font-semibold text-amber-400">
                Initializing camera...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="w-full z-20 p-5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-around">
        {capturedPreview ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={retakePhoto}
              className="h-12 px-6 rounded-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            >
              Retake
            </Button>
            <Button
              type="button"
              onClick={confirmPhoto}
              className="h-12 px-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-950/40"
            >
              <Check className="h-5 w-5 mr-2" /> Use Photo
            </Button>
          </>
        ) : (
          <>
            {/* Gallery fallback button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full text-slate-300 hover:text-white hover:bg-white/10 h-12 w-12"
              title="Upload photo from device"
            >
              <Upload className="h-6 w-6" />
            </Button>

            {/* Shutter Capture Button */}
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isInitializing || !!cameraError}
              className="group relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-white/80 bg-white/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Capture Hazard Photo"
            >
              <div className="w-16 h-16 rounded-full bg-white group-hover:bg-amber-400 transition-colors shadow-lg" />
            </button>

            {/* Flip Camera Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleFacingMode}
              disabled={isInitializing || !!cameraError}
              className="rounded-full text-slate-300 hover:text-white hover:bg-white/10 h-12 w-12"
              title="Flip Camera (Front / Rear)"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
