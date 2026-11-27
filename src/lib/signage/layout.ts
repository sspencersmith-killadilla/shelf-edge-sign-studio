/** Per-element layout overrides. Offsets are stored in inches so they survive size changes and exports. */
export interface ElementLayout { x: number; y: number; s?: number; curve?: number }
export type Layout = Record<string, ElementLayout>;

export const ELEMENT_LABELS: Record<string, string> = { header: "Library header", title: "Title", range: "Call number", sub: "Sub-ranges", aisle: "Aisle", zone: "Floor / zone", footer: "Footer", icon: "Icon", arrow: "Arrow" };
/** Elements that are plain text and can be curved along an arc. */
export const CURVABLE = ["header", "title", "range", "sub", "zone", "footer"];

/** Snaps a value in inches to the nearest grid step; a step of 0 disables snapping. */
export function snap(v: number, step: number) {
  if (!step) return Math.round(v * 1000) / 1000;
  return Math.round(Math.round(v / step) * step * 1000) / 1000;
}

export function moveElement(layout: Layout | undefined, name: string, x: number, y: number, step: number): Layout {
  const cur = layout?.[name] ?? { x: 0, y: 0 };
  return { ...layout, [name]: { ...cur, x: snap(x, step), y: snap(y, step) } };
}

/** Geometry for text laid on a circular arc spanning `deg` degrees (positive arches up, negative smiles). */
export function arcGeometry(textWidth: number, fontSize: number, deg: number) {
  const a = Math.min(Math.abs(deg), 340) * Math.PI / 180;
  const r = textWidth / a;
  const half = a / 2;
  const chord = half >= Math.PI / 2 ? 2 * r : 2 * r * Math.sin(half);
  const sag = r * (1 - Math.cos(half));
  const pad = fontSize * 0.6;
  const w = chord + pad * 2, h = sag + fontSize * 1.6;
  const cx = w / 2, large = a > Math.PI ? 1 : 0;
  const x1 = cx - r * Math.sin(Math.min(half, Math.PI)), x2 = cx + r * Math.sin(Math.min(half, Math.PI));
  let d: string;
  if (deg > 0) { const yEnd = sag + fontSize * 1.1, yc = yEnd - sag + r; void yc; d = `M ${x1} ${yEnd} A ${r} ${r} 0 ${large} 1 ${x2} ${yEnd}`; }
  else { const yEnd = fontSize * 1.1; d = `M ${x1} ${yEnd} A ${r} ${r} 0 ${large} 0 ${x2} ${yEnd}`; }
  return { w, h, d, r };
}
