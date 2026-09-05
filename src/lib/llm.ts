// LiteRT-LM / Gemma 4 E2B Multimodal Inference Wrapper for TrackGuard DHR
import { AIAnalysisResult, HazardType, Severity } from './types';
import { extractVisualCues, VisualInspectionCues } from './vision';

// Web model checkpoint from litert-community
export const GEMMA_4_E2B_MODEL_URL =
  'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.litertlm';

// Filter benign C++ WASM stdout/stderr logs that cause Turbopack to print stack traces in terminal
if (typeof window !== 'undefined' && !(window as any).__litertLogFiltered) {
  (window as any).__litertLogFiltered = true;
  const origWarn = console.warn;
  const origInfo = console.info;

  console.warn = (...args: any[]) => {
    const str = args.map((a) => String(a)).join(' ');
    if (str.includes('npu_registry.cc') || str.includes('NPU accelerator could not be loaded')) {
      return; // Safe benign notice from LiteRT: NPU not found, falling back to WebGPU
    }
    origWarn.apply(console, args);
  };

  console.info = (...args: any[]) => {
    const str = args.map((a) => String(a)).join(' ');
    if (
      str.includes('environment.cc') ||
      str.includes('accelerator_registry.cc') ||
      str.includes('gpu_registry.cc') ||
      str.includes('cpu_registry.cc')
    ) {
      return; // Safe benign C++ WASM accelerator registry log
    }
    origInfo.apply(console, args);
  };
}

let engineInstance: any = null;
let isInitializing = false;
let initError: string | null = null;

let customModelSource: Blob | string | null = null;
let customModelName: string | null = null;

/**
 * Configure a custom model source (e.g. a local .litertlm file from disk or alternate URL).
 */
export function setCustomModel(source: Blob | string, name?: string) {
  customModelSource = source;
  customModelName = name || (typeof source === 'string' ? 'Custom URL' : 'Local File');
  if (engineInstance) {
    try {
      engineInstance.delete?.();
    } catch {
      // ignore cleanup errors
    }
    engineInstance = null;
  }
}

export function getCustomModelInfo(): { isCustom: boolean; name: string | null } {
  return {
    isCustom: !!customModelSource,
    name: customModelName,
  };
}

export function resetToDefaultModel() {
  customModelSource = null;
  customModelName = null;
  if (engineInstance) {
    try {
      engineInstance.delete?.();
    } catch {
      // ignore
    }
    engineInstance = null;
  }
}

/**
 * Checks whether WebGPU is supported on this browser / device.
 */
export function isLLMAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'gpu' in navigator && (navigator as any).gpu !== undefined;
}

/**
 * Initializes the LiteRT-LM Engine with Gemma 4 E2B.
 */
export async function initLLM(
  modelSource: string | Blob = customModelSource || GEMMA_4_E2B_MODEL_URL
): Promise<any> {
  if (engineInstance) return engineInstance;
  if (!isLLMAvailable()) {
    throw new Error('WebGPU is not supported on this device. Manual hazard selection enabled.');
  }

  if (isInitializing) {
    // Wait for in-progress initialization
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (engineInstance) return engineInstance;
  }

  isInitializing = true;
  initError = null;

  try {
    const { Engine } = await import('@litert-lm/core');
    engineInstance = await Engine.create({
      model: modelSource,
      mainExecutorSettings: {
        maxNumTokens: 1024,
      },
    });
    return engineInstance;
  } catch (err: unknown) {
    initError = err instanceof Error ? err.message : 'Failed to initialize LiteRT-LM model';
    console.warn('[LiteRT-LM] Model init failed, fallback mode active:', initError);
    throw new Error(initError);
  } finally {
    isInitializing = false;
  }
}

/**
 * Analyzes a track inspection photo and location context using Gemma 4 E2B.
 * Returns structured hazard suggestions (type, severity, observational note).
 */
export async function analyzeHazard(
  imageBlob: Blob,
  location: { lat: number; lng: number; kmMarker: string }
): Promise<AIAnalysisResult> {
  // Extract visual cues from image canvas
  const visualCues = await extractVisualCues(imageBlob);

  // Compute smart baseline based on visual cues
  const smartBaseline = getBaselineFromVisualCues(visualCues, location);

  // If WebGPU is not supported, return the vision-derived baseline
  if (!isLLMAvailable()) {
    return smartBaseline;
  }

  try {
    const engine = await initLLM();
    const conversation = await engine.createConversation({
      preface: {
        messages: [
          {
            role: 'system',
            content: `You are an expert railway track safety inspection assistant for the Darjeeling Himalayan Railway (DHR).
Analyze the camera visual cues and location context provided.
IMPORTANT RAILWAY SAFETY CLASSIFICATION RULES:
- If a rail is fractured, cracked, broken, separated, or misaligned, the hazard is STRICTLY "track_defect" and severity is "critical". Note: Track ballast (gravel aggregate under sleepers) is normal track foundation, NOT a rockfall.
- If mud or soil has slid down a slope, the hazard is "slip".
- If loose boulders or detached rocks from the cutting face block the line, the hazard is "rockfall".
- If culverts or drainage channels are choked or waterlogged, the hazard is "blocked_drain".
- If masonry retaining walls show cracks or displacement, the hazard is "damaged_wall".
- If tree branches or foliage encroaches within train clearance, the hazard is "vegetation".

Provide:
1. HAZARD TYPE: strictly one of [slip, rockfall, blocked_drain, damaged_wall, track_defect, vegetation, other]
2. SUGGESTED SEVERITY: strictly one of [low, medium, high, critical]
3. OBSERVATIONAL NOTE: A brief factual note under 40 words describing the visible condition.
   - Mention what is visible.
   - Do NOT give operational orders (like halting train traffic).
   - Suggest what field inspection is needed.

Respond strictly with valid JSON:
{"type": "...", "severity": "...", "note": "..."}`,
          },
        ],
      },
    });

    const prompt = `Camera Inspection Telemetry:
- Visual Observation: ${visualCues.summaryDescription}
- Detected Cues: ${visualCues.detectedPatterns.join(', ')}
- Primary Visual Indicator: ${visualCues.suggestedHazardType} (Estimated severity: ${visualCues.suggestedSeverity})
- Alignment Location: DHR km ${location.kmMarker} (${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E)

Provide suggested hazard type, severity suggestion, and observational note in JSON.`;

    const stream = conversation.sendMessageStreaming(prompt);
    let fullResponse = '';

    for await (const chunk of stream) {
      if (chunk.content && chunk.content[0] && chunk.content[0].text) {
        fullResponse += chunk.content[0].text;
      }
    }

    // Try parsing JSON response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      let parsedType = sanitizeHazardType(parsed.type);

      // Guard against common LLM hallucination: confusing normal ballast gravel with rockfall
      if (
        visualCues.suggestedHazardType === 'track_defect' &&
        parsedType === 'rockfall'
      ) {
        parsedType = 'track_defect';
      }

      if (parsedType && parsedType !== 'other') {
        return {
          type: parsedType,
          severity:
            parsedType === 'track_defect'
              ? 'critical'
              : sanitizeSeverity(parsed.severity),
          note: parsed.note || smartBaseline.note,
        };
      }
    }

    // If model returned generic text or "please provide photo", use visual cues
    if (fullResponse.toLowerCase().includes('please provide') || !jsonMatch) {
      return smartBaseline;
    }

    return {
      type: sanitizeHazardType(smartBaseline.type),
      severity: sanitizeSeverity(smartBaseline.severity),
      note: fullResponse.slice(0, 160) || smartBaseline.note,
    };
  } catch (error) {
    console.warn('[LiteRT-LM] Inference failed, using visual telemetry fallback:', error);
    return smartBaseline;
  }
}

function getBaselineFromVisualCues(
  cues: VisualInspectionCues,
  location: { lat: number; lng: number; kmMarker: string }
): AIAnalysisResult {
  const hazardType = cues.suggestedHazardType || 'track_defect';
  const severity = cues.suggestedSeverity || (hazardType === 'track_defect' ? 'critical' : 'high');

  const specificNotes: Record<HazardType, string> = {
    track_defect: `Severe transverse rail fracture with visible separation gap on rail head near km ${location.kmMarker}. Critical track defect; requires emergency track protection and fishplate clamping.`,
    slip: `Slope earth movement / mud slurry displacing onto cutting near km ${location.kmMarker}. Inspect slope stability and clear track profile.`,
    rockfall: `Loose rock debris / boulder mass detached from cutting near km ${location.kmMarker}. Clearance envelope inspection advised.`,
    blocked_drain: `Culvert waterlogging or drain channel silt obstruction visible near km ${location.kmMarker}. Check intake for silt and debris.`,
    damaged_wall: `Masonry retaining wall displaying shear cracking or stone displacement near km ${location.kmMarker}. Structural inspection advised.`,
    vegetation: `Vegetation / tree branches encroaching on track clearance near km ${location.kmMarker}. Clearance trimming suggested.`,
    other: `Track alignment anomaly recorded near km ${location.kmMarker}. Physical verification suggested.`,
  };

  return {
    type: hazardType,
    severity,
    note: specificNotes[hazardType] || specificNotes.other,
  };
}

function sanitizeHazardType(val: any): HazardType {
  const allowed: HazardType[] = [
    'slip',
    'rockfall',
    'blocked_drain',
    'damaged_wall',
    'track_defect',
    'vegetation',
    'other',
  ];
  if (typeof val === 'string' && allowed.includes(val.toLowerCase() as HazardType)) {
    return val.toLowerCase() as HazardType;
  }
  return 'other';
}

function sanitizeSeverity(val: any): Severity {
  const allowed: Severity[] = ['low', 'medium', 'high', 'critical'];
  if (typeof val === 'string' && allowed.includes(val.toLowerCase() as Severity)) {
    return val.toLowerCase() as Severity;
  }
  return 'medium';
}
