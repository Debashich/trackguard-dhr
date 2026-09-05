// ============================================
// STUB IMPLEMENTATIONS
// Shahbaz uses these until Debashish's real code merges in.
// Debashish uses these until Shahbaz's real code merges in.
// Reference: docs/work_division.md & docs/trackguard_dhr_complete_blueprint.md
// ============================================

import { HazardReport, AIAnalysisResult } from './types';

// In-memory media store for Blobs during stub mode
const stubMediaStore = new Map<string, { photoBlob: Blob; photoThumbnail: Blob }>();

// --- STUB for Shahbaz (until Debashish's storage.ts is merged) ---
export async function saveReport(report: HazardReport): Promise<void> {
  console.log('[STUB] Report saved:', report.id);

  if (report.photoBlob) {
    stubMediaStore.set(report.id, {
      photoBlob: report.photoBlob,
      photoThumbnail: report.photoThumbnail,
    });
  }

  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
      const serialized = { ...report, photoBlob: null, photoThumbnail: null };
      const index = existing.findIndex((r: HazardReport) => r.id === report.id);
      if (index >= 0) {
        existing[index] = serialized;
      } else {
        existing.unshift(serialized);
      }
      localStorage.setItem('stub_reports', JSON.stringify(existing));
    } catch (err) {
      console.warn('[STUB] LocalStorage save error:', err);
    }
  }
}

export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
    return existing.filter((r: HazardReport) => r.syncStatus === 'pending').length;
  } catch {
    return 0;
  }
}

export async function getAllReports(): Promise<HazardReport[]> {
  if (typeof window === 'undefined') return [];
  try {
    const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
    return existing.map((r: HazardReport) => {
      const media = stubMediaStore.get(r.id);
      return {
        ...r,
        photoBlob: media?.photoBlob || r.photoBlob,
        photoThumbnail: media?.photoThumbnail || r.photoThumbnail,
      };
    });
  } catch {
    return [];
  }
}

export async function getReportById(id: string): Promise<HazardReport | undefined> {
  const reports = await getAllReports();
  return reports.find((r) => r.id === id);
}

// --- STUB for Debashish (until Shahbaz's llm.ts is merged) ---
export async function analyzeHazard(
  _imageBlob: Blob,
  _location: { lat: number; lng: number; kmMarker: string }
): Promise<AIAnalysisResult> {
  console.log('[STUB] AI analysis — returning mock data');
  return {
    type: 'rockfall',
    severity: 'high',
    note: 'Rock/debris visible adjacent to track. Possible concern: track obstruction. Suggested: check clearance and retaining wall.',
  };
}

export function isLLMAvailable(): boolean {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    return (navigator as any).gpu !== undefined;
  }
  return false;
}
