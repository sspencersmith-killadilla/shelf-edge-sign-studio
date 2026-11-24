import type { SignConfig } from "./types";
import { CSS_PX_PER_IN, SIZE_PRESETS, exportPixelRatio } from "./size";

export interface Issue { level: "error" | "warn"; title: string; detail: string }
export const MIN_BG_DPI = 150;

/** Effective print resolution of a background photo as it is laid out on the sign. */
export function backgroundDpi(nw: number, nh: number, cfg: Pick<SignConfig, "width" | "height" | "imageFit">) {
  if (cfg.imageFit === "tile") {
    const tileIn = (Math.min(cfg.width, cfg.height) * CSS_PX_PER_IN / 100 * 30) / CSS_PX_PER_IN;
    return Math.round(nw / tileIn);
  }
  const s = cfg.imageFit === "cover" ? Math.max(cfg.width / nw, cfg.height / nh) : Math.min(cfg.width / nw, cfg.height / nh);
  return Math.round(1 / s);
}

/** Page-size problems: preset label not matching the dimensions, or export falling below 300 DPI. */
export function pageSizeIssues(cfg: Pick<SignConfig, "sizePreset" | "width" | "height">): Issue[] {
  const out: Issue[] = [];
  const p = SIZE_PRESETS.find((s) => s.id === cfg.sizePreset);
  if (p && p.id !== "custom") {
    const ok = (a: number, b: number) => Math.abs(a - b) < 0.02;
    if (!((ok(p.w, cfg.width) && ok(p.h, cfg.height)) || (ok(p.h, cfg.width) && ok(p.w, cfg.height))))
      out.push({ level: "error", title: "Page size doesn't match", detail: `The size is set to ${p.label}, but the sign is ${cfg.width}" × ${cfg.height}". Pick the size again or switch to Custom.` });
  }
  const r = exportPixelRatio(cfg.width, cfg.height);
  if (r.capped) out.push({ level: "warn", title: "Lower export resolution", detail: `At this size the file exports at ${r.dpi} DPI instead of 300.` });
  return out;
}

const NAMES: Record<string, string> = { header: "Library header", title: "Section title", range: "Call number range", sub: "Sub-ranges", aisle: "Aisle", zone: "Floor / zone", footer: "Footer note" };
const GENERIC = new Set(["serif", "sans-serif", "monospace", "system-ui", "georgia"]);

function textRects(el: Element) { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()]; }

function missingGlyphs(text: string, family: string) {
  const ctx = document.createElement("canvas").getContext("2d"); if (!ctx) return [];
  const miss = new Set<string>();
  for (const ch of new Set(text.replace(/\s/g, ""))) {
    const w = (fb: string) => { ctx.font = `40px "${family}", ${fb}`; return ctx.measureText(ch).width; };
    const a = w("monospace"), b = w("serif"), c = w("sans-serif");
    if (a !== b || a !== c) miss.add(ch);
  }
  return [...miss];
}

async function imageSize(src: string) {
  return new Promise<{ w: number; h: number } | null>((res) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res(null); i.src = src; });
}

/** Inspects the live rendered sign before export. */
export async function runPreflight(node: HTMLElement, cfg: SignConfig): Promise<Issue[]> {
  const out: Issue[] = [];
  await document.fonts.ready;
  const root = node.getBoundingClientRect();
  const k = root.width / (cfg.width * CSS_PX_PER_IN) || 1;
  const safe = 0.25 * CSS_PX_PER_IN * k;
  const els = [...node.querySelectorAll<HTMLElement>("[data-txt]")];
  for (const el of els) {
    const name = NAMES[el.dataset["txt"] ?? ""] ?? "Text";
    const rects = textRects(el);
    const cut = rects.some((r) => r.left < root.left - 1 || r.right > root.right + 1 || r.top < root.top - 1 || r.bottom > root.bottom + 1);
    if (cut) out.push({ level: "error", title: `${name} is cut off`, detail: "Part of this text runs past the sign edge. Shorten it or lower its size." });
    else if (rects.some((r) => r.left < root.left + safe || r.right > root.right - safe || r.top < root.top + safe || r.bottom > root.bottom - safe))
      out.push({ level: "warn", title: `${name} is near the trim edge`, detail: "It sits inside the 0.25\" safe margin and may be trimmed by a print shop." });
  }
  const checked = new Map<string, string>();
  for (const el of els) {
    const fam = getComputedStyle(el).fontFamily.split(",")[0]!.trim().replace(/^["']|["']$/g, "");
    if (!fam || GENERIC.has(fam.toLowerCase())) continue;
    checked.set(fam, (checked.get(fam) ?? "") + (el.textContent ?? ""));
  }
  for (const [fam, text] of checked) {
    await document.fonts.load(`40px "${fam}"`, text).catch(() => []);
    const miss = missingGlyphs(text, fam);
    if (miss.length) out.push({ level: "error", title: `Missing letters in ${fam}`, detail: `${fam} has no ${miss.slice(0, 8).join(" ")}. These print in a fallback font. Try a Noto font.` });
  }
  if (node.dataset["overlap"] === "1") out.push({ level: "error", title: "QR code or braille covers text", detail: "There is no free space for them on this layout. Shorten text, make the sign larger or turn one off." });
  if (cfg.image) {
    const s = await imageSize(cfg.image);
    if (!s) out.push({ level: "error", title: "Background photo won't load", detail: "Upload the photo again." });
    else { const dpi = backgroundDpi(s.w, s.h, cfg); if (dpi < MIN_BG_DPI) out.push({ level: "warn", title: "Low-resolution background", detail: `The photo prints at about ${dpi} DPI (${s.w} × ${s.h} px). Aim for ${MIN_BG_DPI}+ DPI so it isn't blurry.` }); }
  }
  out.push(...pageSizeIssues(cfg));
  if (Math.abs(root.width / k - cfg.width * CSS_PX_PER_IN) > 1) out.push({ level: "error", title: "Rendered size is wrong", detail: "The preview doesn't match the chosen page size. Reload and try again." });
  return out;
}
