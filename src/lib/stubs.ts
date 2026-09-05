// ============================================
// STUB IMPLEMENTATIONS
// Shahbaz uses these until Debashish's real code merges in.
// Debashish uses these until Shahbaz's real code merges in.
// After merge, delete this file — real implementations take over.
// ============================================

import {
  HazardReport,
  AIAnalysisResult,
} from "./types";

// --- STUB for Shahbaz (until Debashish's storage.ts is merged) ---
export async function saveReport(
  report: HazardReport,
): Promise<void> {
  console.log("[STUB] Report saved:", report.id);

  const existing = JSON.parse(
    localStorage.getItem("stub_reports") || "[]",
  );

  existing.push({
    ...report,
    photoBlob: null,
    photoThumbnail: null,
  });

  localStorage.setItem(
    "stub_reports",
    JSON.stringify(existing),
  );
}

export async function getPendingCount(): Promise<number> {
  const existing = JSON.parse(
    localStorage.getItem("stub_reports") || "[]",
  );

  return existing.length;
}

// --- STUB for Debashish (until Shahbaz's llm.ts is merged) ---
export async function analyzeHazard(
  _imageBlob: Blob,
  _location: {
    lat: number;
    lng: number;
    kmMarker: string;
  },
): Promise<AIAnalysisResult> {
  console.log(
    "[STUB] AI analysis — returning mock data",
  );

  return {
    type: "rockfall",
    severity: "high",
    note:
      "Rock/debris visible adjacent to track. Possible concern: track obstruction. Suggested: check clearance.",
  };
}

export function isLLMAvailable(): boolean {
  return false;
}
