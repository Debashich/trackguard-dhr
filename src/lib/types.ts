// ============================================
// SHARED CONTRACT — DO NOT EDIT DURING HACKATHON
// Both Shahbaz and Debashish import from here.
// Reference: docs/work_division.md & docs/trackguard_dhr_complete_blueprint.md
// ============================================

export interface HazardReport {
  id: string;
  timestamp: string; // ISO 8601 UTC

  // Location
  latitude: number;
  longitude: number;
  accuracy: number;
  kmMarker: string;
  section: string; // 'kurseong-ghum' | 'ghum-darjeeling'

  // Hazard (confirmed by gangman)
  hazardType: HazardType;
  severity: Severity;

  // AI suggestions (may differ from confirmed values - audit trail)
  aiSuggestedType: string;
  aiSuggestedSeverity: string;
  aiNote: string;
  userNote: string;

  // Media
  photoBlob: Blob;
  photoThumbnail: Blob;

  // Workflow
  inspectionStatus: InspectionStatus;

  // Sync
  syncStatus: SyncStatus;
  syncTimestamp: string | null;
  retryCount: number;

  // Meta
  deviceInfo: string;
}

export type HazardType =
  | 'slip'
  | 'rockfall'
  | 'blocked_drain'
  | 'damaged_wall'
  | 'track_defect'
  | 'vegetation'
  | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type InspectionStatus =
  | 'open'
  | 'acknowledged'
  | 'inspection_required'
  | 'resolved';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface AIAnalysisResult {
  type: HazardType;
  severity: Severity;
  note: string;
}

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  kmMarker: string;
  section: string;
  nearestWaypointName?: string;
  distanceToTrackKm?: number;
  isSimulated?: boolean;
}

export interface VisualInspectionCues {
  mudSiltPercent: number;
  foliagePercent: number;
  waterSpecularPercent: number;
  ballastTextureScore: number;
  transverseCrackDetected: boolean;
  summary: string;
}

// Hazard options for manual fallback & dropdowns
export const HAZARD_OPTIONS: { value: HazardType; label: string; icon: string }[] = [
  { value: 'slip', label: 'Slip / Landslide', icon: '🏔️' },
  { value: 'rockfall', label: 'Rockfall', icon: '🪨' },
  { value: 'blocked_drain', label: 'Blocked Drain', icon: '🚰' },
  { value: 'damaged_wall', label: 'Damaged Retaining Wall', icon: '🧱' },
  { value: 'track_defect', label: 'Track Defect', icon: '🛤️' },
  { value: 'vegetation', label: 'Vegetation Overgrowth', icon: '🌿' },
  { value: 'other', label: 'Other', icon: '⚠️' },
];

export const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#51cf66' },
  { value: 'medium', label: 'Medium', color: '#fab005' },
  { value: 'high', label: 'High', color: '#ff922b' },
  { value: 'critical', label: 'Critical', color: '#ff6b6b' },
];

export const SECTIONS = [
  { id: 'kurseong-ghum', label: 'Kurseong → Ghum' },
  { id: 'ghum-darjeeling', label: 'Ghum → Darjeeling' },
];
