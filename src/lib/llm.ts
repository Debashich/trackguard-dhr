// ============================================
// GEMMA 4 LITERT-LM WEBGPU REASONING ENGINE
// Reference: docs/gangmans_logbook_solution_CRITICS_RESOLVED.md (Section 9.1)
// and docs/trackguard_dhr_complete_blueprint.md (Section 5.6)
// ============================================

import { AIAnalysisResult, HazardType, Severity } from './types';
import { analyzeImageCues } from './vision';

let engineInstance: any = null;
let activeModelSource: string = 'Default Web Model (LiteRT CDN)';
let isInitializing = false;

/**
 * Checks if the current browser environment supports WebGPU
 */
export function isLLMAvailable(): boolean {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    return (navigator as any).gpu !== undefined;
  }
  return false;
}

/**
 * Returns current model source name or status
 */
export function getActiveModelName(): string {
  return activeModelSource;
}

/**
 * Initializes the LiteRT-LM WebGPU Engine.
 * Supports passing a local file Blob (from ModelSettingsModal) or default CDN URL.
 */
export async function initLLM(customModel?: string | Blob): Promise<boolean> {
  if (engineInstance && !customModel) return true;
  if (!isLLMAvailable()) return false;

  isInitializing = true;
  try {
    const { Engine } = await import('@litert-lm/core');

    const modelSource =
      customModel ||
      'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm';

    engineInstance = await Engine.create({
      model: modelSource as any,
      mainExecutorSettings: {
        maxNumTokens: 1024,
      },
    });

    activeModelSource = typeof customModel === 'string'
      ? 'Custom URL Model'
      : customModel instanceof Blob
      ? 'Local .litertlm File'
      : 'Gemma 4 E2B (WebGPU)';

    isInitializing = false;
    return true;
  } catch (err) {
    console.warn('[LiteRT-LM] Engine initialization skipped/failed:', err);
    isInitializing = false;
    engineInstance = null;
    return false;
  }
}

/**
 * Generates an intelligent, deterministic fallback suggestion using canvas CV cues
 * when WebGPU runtime is unavailable or offline.
 */
function generateCVBasedSuggestion(cues: {
  mudSiltPercent: number;
  foliagePercent: number;
  waterSpecularPercent: number;
  ballastTextureScore: number;
  transverseCrackDetected: boolean;
}): AIAnalysisResult {
  if (cues.transverseCrackDetected) {
    return {
      type: 'track_defect',
      severity: 'high',
      note: 'Linear track discontinuity or obstruction detected across rail alignment. Suggested: check rail joint clearance and gauge integrity.',
    };
  }

  if (cues.mudSiltPercent > 22) {
    const severity: Severity = cues.mudSiltPercent > 40 ? 'critical' : 'high';
    return {
      type: 'slip',
      severity,
      note: `Earthy slope wash and mud silt observed on trackbed (${cues.mudSiltPercent}%). Suggested: inspect upslope retaining wall for fresh fracture.`,
    };
  }

  if (cues.waterSpecularPercent > 15) {
    return {
      type: 'blocked_drain',
      severity: 'medium',
      note: `Water ponding detected along track formation (${cues.waterSpecularPercent}%). Suggested: inspect mountain catchwater drain for blockage.`,
    };
  }

  if (cues.foliagePercent > 30) {
    return {
      type: 'vegetation',
      severity: 'low',
      note: `Dense trackside foliage encroaching into kinematic clearance zone (${cues.foliagePercent}%). Suggested: schedule routine brush clearing.`,
    };
  }

  if (cues.ballastTextureScore < 20) {
    return {
      type: 'damaged_wall',
      severity: 'medium',
      note: 'Irregular masonry profile or structural displacement observed adjacent to track. Suggested: check retaining wall weep holes.',
    };
  }

  // Default baseline observational suggestion
  return {
    type: 'rockfall',
    severity: 'medium',
    note: 'Debris and ballast displacement visible along mountain rail cutting. Suggested: verify line clearance before next train passage.',
  };
}

/**
 * Main inference pipeline:
 * 1. Computes client-side canvas CV telemetry
 * 2. Attempts WebGPU Gemma 4 inference with strict observational guardrails
 * 3. Falls back gracefully to deterministic rule-based suggestions if needed
 */
export async function analyzeHazard(
  imageBlob: Blob,
  location: { lat: number; lng: number; kmMarker: string }
): Promise<AIAnalysisResult> {
  // Step 1: Compute Edge CV Telemetry from Image Pixels
  const cues = await analyzeImageCues(imageBlob);

  // Step 2: Attempt On-Device Gemma 4 Inference if WebGPU is active
  if (isLLMAvailable() && !engineInstance && !isInitializing) {
    await initLLM();
  }

  if (engineInstance) {
    try {
      const conversation = await engineInstance.createConversation({
        preface: {
          messages: [
            {
              role: 'system',
              content: `You are TrackGuard AI, an observational railway track inspection assistant for the Darjeeling Himalayan Railway (DHR).
You are analyzing inspection telemetry taken by a gangman.
HAZARD TYPES: [slip, rockfall, blocked_drain, damaged_wall, track_defect, vegetation, other]
SEVERITIES: [low, medium, high, critical]

SAFETY RULES:
1. Describe ONLY factual, physical observations visible in telemetry.
2. DO NOT make operational decisions (e.g., do NOT command halting trains or closing lines).
3. Always suggest what physical feature the gangman should verify.
4. Keep the observational note under 45 words.
5. Respond in valid JSON format only:
{"type": "<type>", "severity": "<severity>", "note": "<observational note>"}`,
            },
          ],
        },
      });

      const prompt = `Inspection Telemetry:
Location: KM ${location.kmMarker} (${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E)
Edge CV Telemetry:
- Mud/Silt Ratio: ${cues.mudSiltPercent}%
- Foliage Coverage: ${cues.foliagePercent}%
- Water Pooling: ${cues.waterSpecularPercent}%
- Ballast Roughness: ${cues.ballastTextureScore}/100
- Transverse Anomaly: ${cues.transverseCrackDetected ? 'DETECTED' : 'NONE'}
- Visual Summary: ${cues.summary}

Provide classification and observational inspection note in JSON.`;

      const response = await conversation.sendMessage(prompt);
      const text = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
        ? (response.content[0] as any)?.text || ''
        : '';

      // Clean JSON string (remove ```json fences)
      const cleanJson = text.replace(/```json\s*|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const validTypes: HazardType[] = ['slip', 'rockfall', 'blocked_drain', 'damaged_wall', 'track_defect', 'vegetation', 'other'];
      const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];

      const type: HazardType = validTypes.includes(parsed.type) ? parsed.type : 'other';
      const severity: Severity = validSeverities.includes(parsed.severity) ? parsed.severity : 'medium';
      const note: string = parsed.note || cues.summary;

      return { type, severity, note };
    } catch (err) {
      console.warn('[LiteRT-LM] Inference failed or JSON malformed, falling back to CV telemetry:', err);
    }
  }

  // Step 3: Fast, robust deterministic fallback
  return generateCVBasedSuggestion(cues);
}
