export const CSS_PX_PER_IN = 96;
export const EXPORT_DPI = 300;
export const MIN_IN = 3;
export const MAX_IN = 48;
export const MAX_CANVAS_SIDE = 12000;

export const SIZE_PRESETS = [
  { id: "letter", label: 'Letter (8.5" × 11")', w: 8.5, h: 11 },
  { id: "tabloid", label: 'Tabloid (11" × 17")', w: 11, h: 17 },
  { id: "end-panel", label: 'Standard End-Panel (12" × 18")', w: 12, h: 18 },
  { id: "narrow", label: 'Narrow End-Panel (6" × 18")', w: 6, h: 18 },
  { id: "poster", label: 'Large Poster (18" × 24")', w: 18, h: 24 },
  { id: "a4", label: "A4 (210 × 297 mm)", w: 8.27, h: 11.69 },
  { id: "a3", label: "A3 (297 × 420 mm)", w: 11.69, h: 16.54 },
  { id: "a2", label: "A2 (420 × 594 mm)", w: 16.54, h: 23.39 },
  { id: "a1", label: "A1 (594 × 841 mm)", w: 23.39, h: 33.11 },
  { id: "custom", label: "Custom size", w: 0, h: 0 },
] as const;

export function clampInches(v: number): number {
  if (!Number.isFinite(v)) return MIN_IN;
  return Math.min(MAX_IN, Math.max(MIN_IN, Math.round(v * 100) / 100));
}

export function swapOrientation(w: number, h: number, orientation: "portrait" | "landscape") {
  const short = Math.min(w, h), long = Math.max(w, h);
  return orientation === "portrait" ? { width: short, height: long } : { width: long, height: short };
}

/** Pixel ratio to render a CSS-inch-sized node at 300 DPI, capped for browser canvas limits. */
export function exportPixelRatio(wIn: number, hIn: number) {
  const ideal = EXPORT_DPI / CSS_PX_PER_IN;
  const longPx = Math.max(wIn, hIn) * CSS_PX_PER_IN;
  const cap = MAX_CANVAS_SIDE / longPx;
  const ratio = Math.min(ideal, cap);
  return { ratio, capped: ratio < ideal, dpi: Math.round(ratio * CSS_PX_PER_IN) };
}

export type Unit = "in" | "cm";
export const CM_PER_IN = 2.54;
export const toUnit = (inches: number, u: Unit) => u === "cm" ? Math.round(inches * CM_PER_IN * 10) / 10 : inches;
export const fromUnit = (v: number, u: Unit) => u === "cm" ? v / CM_PER_IN : v;
export const fmtSize = (w: number, h: number, u: Unit) => u === "cm" ? `${toUnit(w, u)} × ${toUnit(h, u)} cm` : `${w}" × ${h}"`;
