// Client-side image feature analyzer for TrackGuard DHR
// Extracts visual characteristics from captured track photos so on-device models
// can accurately classify hazards (track defects, broken rails, slips, rockfalls, etc.).

import { HazardType, Severity } from './types';

export interface VisualInspectionCues {
  dominantHue: 'earth' | 'stone_grey' | 'vegetation_green' | 'water_dark' | 'metallic';
  edgeDensity: 'low' | 'medium' | 'high';
  detectedPatterns: string[];
  summaryDescription: string;
  suggestedHazardType: HazardType;
  suggestedSeverity: Severity;
}

/**
 * Analyzes an image Blob to extract visual cues (colors, textures, contrast, edges, rail continuity).
 */
export async function extractVisualCues(imageBlob: Blob): Promise<VisualInspectionCues> {
  if (typeof window === 'undefined') {
    return fallbackCues();
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 160; // 160x160 for high-fidelity edge & rail crack detection
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(fallbackCues());
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size);
        const data = imgData.data;

        let brownPixels = 0;
        let greenPixels = 0;
        let metallicOrSteelPixels = 0;
        let darkPixels = 0;
        let ballastGreyPixels = 0;

        // Grayscale luminance map for edge & structure analysis
        const lum = new Float32Array(size * size);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const pixelIdx = i / 4;

          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          lum[pixelIdx] = brightness;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max > 0 ? (max - min) / max : 0;

          // 1. Dark culvert / standing water / deep fissure shadow
          if (brightness < 40) {
            darkPixels++;
          }
          // 2. Vegetation green
          else if (g > r + 14 && g > b + 14) {
            greenPixels++;
          }
          // 3. Earth mud / landslide soil
          else if (r > 75 && r > g && g > b && r - b > 25 && sat > 0.2) {
            brownPixels++;
          }
          // 4. Polished rail steel or metallic structure
          else if (sat < 0.22 && brightness >= 70 && brightness <= 210) {
            metallicOrSteelPixels++;
          }
          // 5. Track ballast aggregate or stone
          else if (sat < 0.25 && brightness >= 40 && brightness < 150) {
            ballastGreyPixels++;
          }
        }

        const totalPixels = size * size;
        const greenRatio = greenPixels / totalPixels;
        const brownRatio = brownPixels / totalPixels;
        const metallicRatio = metallicOrSteelPixels / totalPixels;
        const darkRatio = darkPixels / totalPixels;
        const ballastRatio = ballastGreyPixels / totalPixels;

        // --- Edge Analysis (Sobel gradient filter) ---
        let edgeCount = 0;
        const gradX = new Float32Array(size * size);
        const gradY = new Float32Array(size * size);

        for (let y = 1; y < size - 1; y++) {
          for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;
            const gx =
              -lum[(y - 1) * size + (x - 1)] +
              lum[(y - 1) * size + (x + 1)] -
              2 * lum[y * size + (x - 1)] +
              2 * lum[y * size + (x + 1)] -
              lum[(y + 1) * size + (x - 1)] +
              lum[(y + 1) * size + (x + 1)];

            const gy =
              -lum[(y - 1) * size + (x - 1)] -
              2 * lum[(y - 1) * size + x] -
              lum[(y - 1) * size + (x + 1)] +
              lum[(y + 1) * size + (x - 1)] +
              2 * lum[(y + 1) * size + x] +
              lum[(y + 1) * size + (x + 1)];

            gradX[idx] = Math.abs(gx);
            gradY[idx] = Math.abs(gy);

            const mag = Math.sqrt(gx * gx + gy * gy);
            if (mag > 65) {
              edgeCount++;
            }
          }
        }

        const edgeDensityRatio = edgeCount / totalPixels;
        const edgeDensity: 'low' | 'medium' | 'high' =
          edgeDensityRatio > 0.18 ? 'high' : edgeDensityRatio > 0.08 ? 'medium' : 'low';

        // --- Railway Rail & Fracture / Discontinuity Detection ---
        // A railway track rail appears as a prominent longitudinal band (horizontal, diagonal, or vertical)
        // A rail fracture/crack appears as a distinct dark transverse notch interrupting the continuous rail head.

        // 1. Check for Horizontal/Diagonal Rail Band
        let maxRowStreak = 0;
        let railBandStartY = -1;
        let railBandEndY = -1;
        const rowLuminance = new Float32Array(size);

        for (let y = 0; y < size; y++) {
          let rowSum = 0;
          for (let x = 0; x < size; x++) {
            rowSum += lum[y * size + x];
          }
          rowLuminance[y] = rowSum / size;
        }

        // Find candidate rail row band
        let currentStreak = 0;
        let tempStart = 0;
        for (let y = 0; y < size; y++) {
          // Rail sections are typically brighter than ballast
          if (rowLuminance[y] > 60 && rowLuminance[y] < 210) {
            if (currentStreak === 0) tempStart = y;
            currentStreak++;
            if (currentStreak > maxRowStreak) {
              maxRowStreak = currentStreak;
              railBandStartY = tempStart;
              railBandEndY = y;
            }
          } else {
            currentStreak = 0;
          }
        }

        // 2. Search for Transverse Crack across the detected rail band
        let maxCrackDepth = 0;
        let crackLocationX = -1;

        if (maxRowStreak >= 15 && railBandStartY >= 0) {
          // Compute column luminance profile within the rail band
          const colLumInBand = new Float32Array(size);
          const bandHeight = railBandEndY - railBandStartY + 1;

          for (let x = 0; x < size; x++) {
            let colSum = 0;
            for (let y = railBandStartY; y <= railBandEndY; y++) {
              colSum += lum[y * size + x];
            }
            colLumInBand[x] = colSum / bandHeight;
          }

          // Look for sharp local drop in luminance (valley / notch representing a fracture)
          for (let x = 8; x < size - 8; x++) {
            const leftAvg = (colLumInBand[x - 4] + colLumInBand[x - 3] + colLumInBand[x - 2]) / 3;
            const rightAvg = (colLumInBand[x + 2] + colLumInBand[x + 3] + colLumInBand[x + 4]) / 3;
            const center = colLumInBand[x];
            const flank = Math.min(leftAvg, rightAvg);
            const depth = flank - center;

            if (depth > maxCrackDepth) {
              maxCrackDepth = depth;
              crackLocationX = x;
            }
          }
        }

        // Also check vertical rail profile with horizontal crack
        let maxVertCrackDepth = 0;
        for (let y = 8; y < size - 8; y++) {
          const aboveAvg = (rowLuminance[y - 3] + rowLuminance[y - 2]) / 2;
          const belowAvg = (rowLuminance[y + 2] + rowLuminance[y + 3]) / 2;
          const center = rowLuminance[y];
          const vDepth = Math.min(aboveAvg, belowAvg) - center;
          if (vDepth > maxVertCrackDepth) {
            maxVertCrackDepth = vDepth;
          }
        }

        const isTransverseRailFracture =
          (maxCrackDepth > 24 && crackLocationX > 15 && crackLocationX < size - 15) ||
          maxVertCrackDepth > 30;

        // Has rail steel characteristics
        const hasRailPresence =
          metallicRatio > 0.12 ||
          (ballastRatio > 0.25 && maxRowStreak > 15) ||
          isTransverseRailFracture;

        // --- Decision Hierarchy ---
        let dominant: VisualInspectionCues['dominantHue'] = 'stone_grey';
        let patterns: string[] = [];
        let desc = '';
        let hazardType: HazardType = 'other';
        let severity: Severity = 'medium';

        // 1. Broken Rail / Track Defect (High Priority safety hazard)
        if (isTransverseRailFracture || (hasRailPresence && maxCrackDepth > 18)) {
          dominant = 'metallic';
          hazardType = 'track_defect';
          severity = 'critical';
          patterns = [
            'transverse rail fracture',
            'broken rail head / gap',
            'track discontinuity',
            'ballast bed foundation',
          ];
          desc =
            'Severe transverse rail fracture with visible separation gap across the steel rail head. Critical structural track defect.';
        }
        // 2. Landslide / Mud Slope Failure
        else if (brownRatio > 0.28) {
          dominant = 'earth';
          hazardType = 'slip';
          severity = brownRatio > 0.45 ? 'critical' : 'high';
          patterns = ['slope earth movement', 'mud slurry on cutting', 'soil mass displacement'];
          desc = 'Earth / mud slope failure and soil movement visible encroaching on railway cutting.';
        }
        // 3. Dense Vegetation / Tree Fall
        else if (greenRatio > 0.22) {
          dominant = 'vegetation_green';
          hazardType = 'vegetation';
          severity = greenRatio > 0.4 ? 'medium' : 'low';
          patterns = ['dense foliage', 'overhanging branches', 'clearance envelope encroachment'];
          desc = 'Dense vegetation or leaning tree branches visible encroaching on track clearance.';
        }
        // 4. Blocked Drain / Standing Water / Silt
        else if (darkRatio > 0.26) {
          dominant = 'water_dark';
          hazardType = 'blocked_drain';
          severity = 'medium';
          patterns = ['waterlogged ditch', 'culvert inlet obstruction', 'drainage blockage'];
          desc = 'Dark culvert inlet or standing water / drainage channel obstruction detected.';
        }
        // 5. General Track Defect (Misalignment / Damaged Sleeper without full snap)
        else if (hasRailPresence && edgeDensity === 'high') {
          dominant = 'metallic';
          hazardType = 'track_defect';
          severity = 'high';
          patterns = ['rail joint irregularity', 'ballast displacement', 'track alignment defect'];
          desc = 'Track alignment irregularity, dislocated ballast, or damaged rail joint visible.';
        }
        // 6. Damaged Retaining Wall vs Rockfall
        else if (ballastRatio > 0.35 && edgeDensity === 'medium') {
          // Normal ballast track or loose stones on cutting
          dominant = 'stone_grey';
          hazardType = 'rockfall';
          severity = 'medium';
          patterns = ['loose rock debris', 'cutting slope stones', 'trackside aggregate'];
          desc = 'Loose stone debris or rock fragments adjacent to track alignment.';
        }
        // 7. Fallback to Rockfall
        else {
          dominant = 'stone_grey';
          hazardType = 'rockfall';
          severity = 'high';
          patterns = ['rock boulder debris', 'cutting slope fracture'];
          desc = 'Rock debris or detached stone mass adjacent to alignment clearance envelope.';
        }

        URL.revokeObjectURL(url);
        resolve({
          dominantHue: dominant,
          edgeDensity,
          detectedPatterns: patterns,
          summaryDescription: desc,
          suggestedHazardType: hazardType,
          suggestedSeverity: severity,
        });
      } catch {
        URL.revokeObjectURL(url);
        resolve(fallbackCues());
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fallbackCues());
    };

    img.src = url;
  });
}

function fallbackCues(): VisualInspectionCues {
  return {
    dominantHue: 'metallic',
    edgeDensity: 'medium',
    detectedPatterns: ['rail line', 'track alignment'],
    summaryDescription: 'Visual track inspection photo captured along railway alignment.',
    suggestedHazardType: 'track_defect',
    suggestedSeverity: 'high',
  };
}
