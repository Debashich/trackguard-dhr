// ============================================
// STUB IMPLEMENTATIONS
// Shahbaz uses these until Debashish's real code merges in.
// Debashish uses these until Shahbaz's real code merges in.
// After merge, delete this file — real implementations take over.
// ============================================

import { HazardReport, AIAnalysisResult } from './types';

// --- STUB for Shahbaz (until Debashish's storage.ts is merged) ---
export async function saveReport(report: HazardReport): Promise<void> {
  console.log('[STUB] Report saved:', report.id);
  // Stores in localStorage as temporary fallback
  const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
  existing.push({
    ...report,
    photoBlob: null,
    photoThumbnail: null,
  });
  localStorage.setItem('stub_reports', JSON.stringify(existing));
}

export async function getPendingCount(): Promise<number> {
  const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
  return existing.length;
}

export async function getAllReports(): Promise<HazardReport[]> {
  const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
  return existing;
}

export async function getReportById(id: string): Promise<HazardReport | undefined> {
  const existing = JSON.parse(localStorage.getItem('stub_reports') || '[]');
  return existing.find((r: HazardReport) => r.id === id);
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
    note: 'Rock/debris visible adjacent to track. Possible concern: track obstruction. Suggested: check clearance.',
  };
}

export function isLLMAvailable(): boolean {
  return false; // Stub always says unavailable
}
