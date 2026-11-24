export interface Rect { x: number; y: number; w: number; h: number }

const area = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/**
 * Places overlay boxes (QR code, braille reference) inside a W×H sign so they avoid every
 * obstacle rect (sign text, footer) and each other. Positions nearest the bottom-right corner win.
 * Returns overlap:true when no clear spot exists; the least-overlapping spot is used then.
 */
export function placeOverlays(W: number, H: number, margin: number, gap: number, obstacles: Rect[], boxes: { w: number; h: number }[]) {
  const placed: (Rect & { overlap: boolean })[] = [];
  const step = Math.max(4, Math.min(W, H) / 48);
  for (const b of boxes) {
    const blockers = [...obstacles, ...placed].map((o) => ({ x: o.x - gap, y: o.y - gap, w: o.w + gap * 2, h: o.h + gap * 2 }));
    let best: { r: Rect; cost: number } | null = null;
    const maxX = W - margin - b.w, maxY = H - margin - b.h;
    for (let y = Math.max(margin, maxY); y >= margin - 0.01; y -= step) {
      for (let x = Math.max(margin, maxX); x >= margin - 0.01; x -= step) {
        const r = { x, y, w: b.w, h: b.h };
        const ov = blockers.reduce((s, o) => s + area(r, o), 0);
        const dist = (maxX - x) + (maxY - y);
        const cost = ov * 1e6 + dist;
        if (!best || cost < best.cost) best = { r, cost };
      }
    }
    const r = best?.r ?? { x: margin, y: margin, w: b.w, h: b.h };
    placed.push({ ...r, overlap: blockers.some((o) => area(r, o) > 0) });
  }
  return placed;
}
