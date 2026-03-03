import type { FilterParams } from "../store/photoboothStore";

/**
 * Convert FilterParams to a CSS filter string for live preview.
 */
export function filterParamsToCss(params: FilterParams): string {
  const brightness = 1 + params.exposure;
  const contrast = params.contrast;
  // temperature: positive = warm (saturate + sepia slight), negative = cool (hue-rotate)
  const saturate = 1 + params.temperature * 0.3;
  const hueRotate =
    params.temperature < 0 ? Math.abs(params.temperature) * 15 : 0;
  // fade = lift shadows via brightness+sepia combo (approximate via brightness)
  const fadeBrightness = 1 + params.fade * 0.15;
  // sharpness inverse (blur for low sharpness)
  const blur = params.sharpness < 0.3 ? (0.3 - params.sharpness) * 1.5 : 0;

  // sepia for warm tones
  const sepia = Math.max(0, params.temperature) * 0.2;

  const parts = [
    `brightness(${(brightness * fadeBrightness).toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturate.toFixed(3)})`,
    `sepia(${sepia.toFixed(3)})`,
  ];

  if (hueRotate > 0) parts.push(`hue-rotate(${hueRotate.toFixed(1)}deg)`);
  if (blur > 0) parts.push(`blur(${blur.toFixed(2)}px)`);

  return parts.join(" ");
}

/**
 * Build a CSS style object including filter + grain/vignette via mix-blend-mode overlays.
 * Used for preview containers.
 */
export function buildFilterStyle(params: FilterParams): React.CSSProperties {
  return {
    filter: filterParamsToCss(params),
  };
}

/**
 * Canvas-based grain overlay.
 * Draws noise on top of an existing canvas context.
 */
export function applyGrainToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const strength = intensity * 60;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * strength;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Canvas-based vignette overlay.
 */
export function applyVignetteToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.3,
    width / 2,
    height / 2,
    height * 0.85,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.75})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Apply fade (milky lift) by blending a semi-opaque white overlay on the canvas.
 */
export function applyFadeToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;
  ctx.fillStyle = `rgba(240,235,225,${intensity * 0.25})`;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Apply tint (green/magenta shift) via color overlay.
 */
export function applyTintToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tint: number, // -1 = magenta, +1 = green
): void {
  if (Math.abs(tint) < 0.01) return;
  if (tint > 0) {
    ctx.fillStyle = `rgba(0,180,0,${tint * 0.08})`;
  } else {
    ctx.fillStyle = `rgba(180,0,120,${Math.abs(tint) * 0.08})`;
  }
  ctx.fillRect(0, 0, width, height);
}

/**
 * Apply highlights recovery and shadow lift.
 */
export function applyHighlightsShadowsToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  highlights: number,
  shadows: number,
): void {
  // Shadow lift (add slight brightness to dark areas via overlay)
  if (shadows > 0.5) {
    const lift = (shadows - 0.5) * 0.3;
    ctx.fillStyle = `rgba(50,40,30,${lift * 0.4})`;
    ctx.globalCompositeOperation = "screen";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
  }

  // Highlight recovery (darken highlights slightly)
  if (highlights < 0.5) {
    const recover = (0.5 - highlights) * 0.3;
    ctx.fillStyle = `rgba(0,0,0,${recover * 0.3})`;
    ctx.fillRect(0, 0, width, height);
  }
}

/**
 * Full canvas apply: draws a source image and applies all filter effects.
 * Returns a data URL of the processed image.
 */
export async function applyFiltersToCanvas(
  sourceDataUrl: string,
  params: FilterParams,
  targetWidth: number,
  targetHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(sourceDataUrl);

    const img = new Image();
    img.onload = () => {
      // Apply CSS-based filters via offscreen canvas trick
      ctx.filter = filterParamsToCss(params);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      ctx.filter = "none";

      // Canvas-based effects
      applyTintToCanvas(ctx, targetWidth, targetHeight, params.tint);
      applyFadeToCanvas(ctx, targetWidth, targetHeight, params.fade);
      applyHighlightsShadowsToCanvas(
        ctx,
        targetWidth,
        targetHeight,
        params.highlights,
        params.shadows,
      );
      applyGrainToCanvas(ctx, targetWidth, targetHeight, params.grain);
      applyVignetteToCanvas(ctx, targetWidth, targetHeight, params.vignette);

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.src = sourceDataUrl;
  });
}
