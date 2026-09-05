'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GeoLocationResult } from './geo';

interface ReportDraft {
  photoBlob: Blob | null;
  photoThumbnail: Blob | null;
  photoPreviewUrl: string | null;
  location: GeoLocationResult | null;
}

interface ReportContextType {
  draft: ReportDraft;
  setDraftPhoto: (photoBlob: Blob, photoThumbnail: Blob) => void;
  setDraftLocation: (location: GeoLocationResult) => void;
  clearDraft: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>({
    photoBlob: null,
    photoThumbnail: null,
    photoPreviewUrl: null,
    location: null,
  });

  const setDraftPhoto = (photoBlob: Blob, photoThumbnail: Blob) => {
    // Revoke previous URL to avoid memory leaks
    if (draft.photoPreviewUrl) {
      URL.revokeObjectURL(draft.photoPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(photoBlob);
    setDraft((prev) => ({
      ...prev,
      photoBlob,
      photoThumbnail,
      photoPreviewUrl: previewUrl,
    }));
  };

  const setDraftLocation = (location: GeoLocationResult) => {
    setDraft((prev) => ({
      ...prev,
      location,
    }));
  };

  const clearDraft = () => {
    if (draft.photoPreviewUrl) {
      URL.revokeObjectURL(draft.photoPreviewUrl);
    }
    setDraft({
      photoBlob: null,
      photoThumbnail: null,
      photoPreviewUrl: null,
      location: null,
    });
  };

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

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}
