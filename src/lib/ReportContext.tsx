'use client';

// ============================================
// REPORT DRAFT CONTEXT
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.7)
// Manages in-memory state across report capture and review screens
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { GeoLocationResult } from './types';

export interface ReportDraft {
  photoBlob: Blob | null;
  photoThumbnail: Blob | null;
  photoPreviewUrl: string | null;
  location: GeoLocationResult | null;
}

interface ReportContextType {
  draft: ReportDraft;
  setDraftPhoto: (fullBlob: Blob, thumbnailBlob: Blob) => void;
  setDraftLocation: (location: GeoLocationResult) => void;
  clearDraft: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>({
    photoBlob: null,
    photoThumbnail: null,
    photoPreviewUrl: null,
    location: null,
  });

  const setDraftPhoto = useCallback((fullBlob: Blob, thumbnailBlob: Blob) => {
    setDraft((prev) => {
      // Clean up previous preview URL to prevent memory leaks
      if (prev.photoPreviewUrl) {
        URL.revokeObjectURL(prev.photoPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(fullBlob);
      return {
        ...prev,
        photoBlob: fullBlob,
        photoThumbnail: thumbnailBlob,
        photoPreviewUrl: previewUrl,
      };
    });
  }, []);

  const setDraftLocation = useCallback((location: GeoLocationResult) => {
    setDraft((prev) => ({
      ...prev,
      location,
    }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft((prev) => {
      if (prev.photoPreviewUrl) {
        URL.revokeObjectURL(prev.photoPreviewUrl);
      }
      return {
        photoBlob: null,
        photoThumbnail: null,
        photoPreviewUrl: null,
        location: null,
      };
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draft.photoPreviewUrl) {
        URL.revokeObjectURL(draft.photoPreviewUrl);
      }
    };
  }, [draft.photoPreviewUrl]);

  return (
    <ReportContext.Provider
      value={{
        draft,
        setDraftPhoto,
        setDraftLocation,
        clearDraft,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReportDraft() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReportDraft must be used within a ReportProvider');
  }
  return context;
}
