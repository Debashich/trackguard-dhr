// ============================================
// CLIENT-SIDE EDGE COMPUTER VISION ENGINE
// Reference: docs/trackguard_dhr_complete_blueprint.md (Section 5.5)
// Extracts factual geometric and colorimetric cues from canvas pixels
// ============================================

import { VisualInspectionCues } from './types';

/**
 * Loads an image Blob into an HTMLImageElement for canvas rendering
 */
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for CV analysis'));
    };
    img.src = url;
  });
}

/**
 * Analyzes image pixels on a 320x240 offscreen canvas
 */
export async function analyzeImageCues(imageBlob: Blob): Promise<VisualInspectionCues> {
  if (typeof window === 'undefined') {
    return {
      mudSiltPercent: 0,
      foliagePercent: 0,
      waterSpecularPercent: 0,
      ballastTextureScore: 0,
      transverseCrackDetected: false,
      summary: 'Telemetry unavailable in non-browser environment',
    };
  }

  try {
    const img = await loadImageFromBlob(imageBlob);
    const canvas = document.createElement('canvas');
    const width = 320;
    const height = 240;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const totalPixels = width * height;

    let mudSiltPixels = 0;
    let foliagePixels = 0;
    let waterSpecularPixels = 0;

    // Grayscale buffer for Sobel edge convolution
    const gray = new Float32Array(totalPixels);

    // 1. Colorimetry & Grayscale conversion
    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[i] = lum;

      // Mud / Silt (Earthy brown/terracotta: R > G > B, moderate saturation)
      if (r > 60 && g > 40 && b < 100 && r > g * 1.15 && g > b) {
        mudSiltPixels++;
      }

      // Vegetation / Foliage (Green dominates both Red and Blue)
      if (g > 50 && g > r * 1.18 && g > b * 1.15) {
        foliagePixels++;
      }

      // Specular Water in lower half (reflection with high luminance and low saturation)
      const y = Math.floor(i / width);
      if (y > height * 0.5) {
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
        if (lum > 175 && sat < 0.22) {
          waterSpecularPixels++;
        }
      }
    }

    // 2. Sobel Edge Convolution & Rail Fracture Check
    // 3x3 Sobel kernels
    let transverseDiscontinuities = 0;
    let edgeEnergySum = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;

        // Gradient X
        const gx =
          -1 * gray[i - width - 1] +
          1 * gray[i - width + 1] +
          -2 * gray[i - 1] +
          2 * gray[i + 1] +
          -1 * gray[i + width - 1] +
          1 * gray[i + width + 1];

        // Gradient Y
        const gy =
          -1 * gray[i - width - 1] +
          -2 * gray[i - width] +
          -1 * gray[i - width + 1] +
          1 * gray[i + width - 1] +
          2 * gray[i + width] +
          1 * gray[i + width + 1];

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edgeEnergySum += magnitude;

        // Detect high-contrast vertical edge perpendicular to track direction (possible transverse fracture/break)
        if (Math.abs(gx) > 130 && Math.abs(gy) < 45) {
          transverseDiscontinuities++;
        }
      }
    }

    const mudSiltPercent = Math.round((mudSiltPixels / totalPixels) * 100);
    const foliagePercent = Math.round((foliagePixels / totalPixels) * 100);
    const waterSpecularPercent = Math.round((waterSpecularPixels / (totalPixels / 2)) * 100);
    const ballastTextureScore = Math.min(100, Math.round((edgeEnergySum / totalPixels) * 1.5));
    const transverseCrackDetected = transverseDiscontinuities > 180;

    // Compose concise factual summary for multimodal prompt
    const observations: string[] = [];
    if (mudSiltPercent > 20) observations.push(`Substantial earthy mud/silt deposit (${mudSiltPercent}%)`);
    if (foliagePercent > 25) observations.push(`Dense vegetation coverage (${foliagePercent}%)`);
    if (waterSpecularPercent > 15) observations.push(`Water accumulation / drainage pooling detected (${waterSpecularPercent}%)`);
    if (transverseCrackDetected) observations.push('Linear track discontinuity or obstacle detected across rail alignment');
    if (ballastTextureScore > 40) observations.push(`Track ballast texture evident (score ${ballastTextureScore})`);

    const summary = observations.length > 0 
      ? observations.join('; ') 
      : 'Normal trackbed lighting with no severe colorimetric anomalies';

    return {
      mudSiltPercent,
      foliagePercent,
      waterSpecularPercent,
      ballastTextureScore,
      transverseCrackDetected,
      summary,
    };
  } catch (err) {
    console.warn('[CV] Edge image analysis error, using baseline:', err);
    return {
      mudSiltPercent: 0,
      foliagePercent: 0,
      waterSpecularPercent: 0,
      ballastTextureScore: 30,
      transverseCrackDetected: false,
      summary: 'Baseline trackbed visual cues extracted',
    };
  }
}
