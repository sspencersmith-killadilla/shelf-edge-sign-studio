import type { Palette } from "./types";
import { contrastRatio } from "./contrast";

type RGB = [number, number, number];
const hex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const lum = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const sat = ([r, g, b]: RGB) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const hue = ([r, g, b]: RGB) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hueDist = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** Builds a readable sign palette from RGBA pixel data (e.g. a downscaled photo). */
export function paletteFromPixels(data: ArrayLike<number>): Palette {
  const buckets = new Map<number, { n: number; s: RGB }>();
  for (let i = 0; i + 3 < data.length; i += 4) {
    if ((data[i + 3] ?? 255) < 128) continue;
    const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
    const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const e = buckets.get(k) ?? { n: 0, s: [0, 0, 0] as RGB };
    e.n++; e.s[0] += r; e.s[1] += g; e.s[2] += b; buckets.set(k, e);
  }
  const cols = [...buckets.values()].map((e) => ({ n: e.n, c: [e.s[0] / e.n, e.s[1] / e.n, e.s[2] / e.n] as RGB })).sort((a, b) => b.n - a.n).slice(0, 24);
  if (!cols.length) return { primary: "#1f3a5f", accent: "#d4a017", text: "#111111", background: "#ffffff" };
  const score = (x: { n: number; c: RGB }, f: (c: RGB) => number) => Math.sqrt(x.n) * f(x.c);
  const best = (f: (c: RGB) => number) => cols.reduce((a, b) => (score(b, f) > score(a, f) ? b : a)).c;
  let primary = best((c) => (0.3 + sat(c)) * (1.2 - lum(c)));
  while (lum(primary) > 0.32) primary = mix(primary, [0, 0, 0], 0.2);
  const ph = hue(primary);
  let accent = best((c) => (0.05 + sat(c)) ** 2 * (lum(c) > 0.2 && lum(c) < 0.85 ? 1 : 0.1) * (0.2 + hueDist(hue(c), ph) / 180));
  if (sat(accent) < 0.25) accent = mix(accent, [230, 170, 40], 0.5);
  let background = mix(best((c) => lum(c) + 0.2), [255, 255, 255], 0.82);
  let text: RGB = mix(primary, [0, 0, 0], 0.55);
  const out = { primary: hex(primary), accent: hex(accent), text: hex(text), background: hex(background) };
  if (contrastRatio(out.text, out.background) < 4.5) { text = [17, 17, 17]; background = [255, 255, 255]; out.text = hex(text); out.background = hex(background); }
  if (contrastRatio(out.background, out.primary) < 4.5) out.primary = hex(mix(primary, [0, 0, 0], 0.5));
  return out;
}

/** Loads an image URL in the browser, downscales it and extracts a palette. */
export async function paletteFromImage(src: string): Promise<Palette> {
  const img = new Image(); img.src = src; await img.decode();
  const s = 64 / Math.max(img.width, img.height, 1);
  const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
  const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, c.width, c.height);
  return paletteFromPixels(ctx.getImageData(0, 0, c.width, c.height).data);
}
