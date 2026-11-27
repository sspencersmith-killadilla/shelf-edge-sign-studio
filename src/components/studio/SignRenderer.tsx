import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { placeOverlays, type Rect } from "@/lib/signage/placement";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowLeftRight, BookOpen, Library, Compass, Search, Star, Clock, BookMarked, Users, Sparkles, Landmark, TreePine, Map, type LucideIcon } from "lucide-react";
import type { SignConfig } from "@/lib/signage/types";
import { fontStack } from "@/lib/signage/fonts";
import qrcode from "qrcode-generator";
import { toBraille } from "@/lib/signage/print";
import { CSS_PX_PER_IN } from "@/lib/signage/size";
import { arcGeometry } from "@/lib/signage/layout";

export const ICON_MAP: Record<string, LucideIcon> = { BookOpen, Library, Compass, Search, Star, Clock, BookMarked, Users, Sparkles, Landmark, TreePine, Map };
const ARROWS: Record<string, LucideIcon> = { left: ArrowLeft, right: ArrowRight, up: ArrowUp, down: ArrowDown, both: ArrowLeftRight };

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const SignRenderer = forwardRef<HTMLDivElement, { cfg: SignConfig }>(function SignRenderer({ cfg }, ref) {
  const W = cfg.width * CSS_PX_PER_IN, H = cfg.height * CSS_PX_PER_IN;
  const u = Math.min(W, H) / 100;
  const pad = cfg.padding * CSS_PX_PER_IN * 0.6;
  const p = cfg.palette;
  const Icon = ICON_MAP[cfg.icon] ?? BookOpen;
  const ArrowI = cfg.arrow !== "none" ? ARROWS[cfg.arrow] : undefined;
  const head = fontStack(cfg.headingFont), body = fontStack(cfg.bodyFont);
  const narrow = W / H < 0.45;
  const titleSize = u * (narrow ? 11 : 9) * cfg.titleScale;
  const rangeSize = u * (narrow ? 15 : 13) * cfg.rangeScale;
  const bodySize = u * (narrow ? 5 : 3.6) * cfg.bodyScale;
  const ta = cfg.align;
  const items = ta === "left" ? "flex-start" : ta === "right" ? "flex-end" : "center";
  const frameW = { none: 0, thin: u * 0.6, thick: u * 1.8, double: u * 0.6 }[cfg.frame];

  const root: CSSProperties = { width: W, height: H, position: "relative", overflow: "hidden", background: p.background, color: p.text, fontFamily: body, boxSizing: "border-box", direction: cfg.dir ?? "ltr" };
  const bgImg = cfg.image ? (
    <div style={{ position: "absolute", inset: cfg.blur ? -cfg.blur * 2 : 0, backgroundImage: `url(${cfg.image})`, backgroundSize: cfg.imageFit === "tile" ? `${u * 30}px` : cfg.imageFit, backgroundRepeat: cfg.imageFit === "tile" ? "repeat" : "no-repeat", backgroundPosition: cfg.focal, filter: cfg.blur ? `blur(${cfg.blur}px)` : undefined }} />
  ) : null;
  const tint = cfg.image ? <div style={{ position: "absolute", inset: 0, background: hexA(cfg.tint, cfg.tintOpacity) }} /> : null;
  const frame = cfg.frame !== "none" ? (
    <div style={{ position: "absolute", inset: u * 2, border: `${frameW}px solid ${p.accent}`, outline: cfg.frame === "double" ? `${u * 0.6}px solid ${p.accent}` : undefined, outlineOffset: u * 1.2, pointerEvents: "none", zIndex: 5 }} />
  ) : null;

  const tf = (n: string): CSSProperties => { const l = cfg.layout?.[n]; return l ? { transform: `translate(${l.x * CSS_PX_PER_IN}px, ${l.y * CSS_PX_PER_IN}px) scale(${l.s ?? 1})`, position: "relative", zIndex: 4 } : {}; };
  const T = (s: CSSProperties, c: ReactNode, n?: string) => {
    const curve = n ? cfg.layout?.[n]?.curve : 0;
    if (n && curve && typeof c === "string") return <div style={{ ...tf(n), display: "flex", justifyContent: "center" }} data-part={n} data-txt={n}><CurvedText text={c} style={s} deg={curve} /></div>;
    return <div style={{ ...s, ...(n ? tf(n) : {}) }} data-txt={n} data-part={n}>{c}</div>;
  };
  const header = cfg.showHeader && cfg.header ? T({ fontFamily: head, fontWeight: 700, letterSpacing: "0.14em", fontSize: bodySize * 0.8, textTransform: "uppercase" }, cfg.header, "header") : null;
  const titleEl = T({ fontFamily: head, fontWeight: 800, fontSize: titleSize, lineHeight: 1.02, letterSpacing: "-0.01em", textAlign: ta }, cfg.title, "title");
  const rangeEl = T({ fontFamily: body, fontWeight: 800, fontSize: rangeSize, lineHeight: 1, letterSpacing: "-0.02em", textAlign: ta, whiteSpace: "pre-wrap" }, cfg.range, "range");
  const subEl = cfg.subRanges ? T({ fontSize: bodySize, lineHeight: 1.45, whiteSpace: "pre-line", textAlign: ta, opacity: 0.9 }, cfg.subRanges, "sub") : null;
  const zoneEl = cfg.showZone && cfg.zone ? T({ fontSize: bodySize * 0.85, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }, cfg.zone, "zone") : null;
  const aisleEl = cfg.showAisle && cfg.aisle ? cfg.aisle : null;
  const footerEl = cfg.footer ? T({ fontSize: bodySize * 0.8, opacity: 0.85, textAlign: ta }, cfg.footer, "footer") : null;
  const arrowEl = (size: number, color: string) => (ArrowI ? <div data-part="arrow" style={{ display: "flex", ...tf("arrow") }}><ArrowI size={size} color={color} strokeWidth={2.4} /></div> : null);
  const iconEl = (size: number, color: string) => (cfg.showIcon ? <div data-part="icon" style={{ display: "flex", ...tf("icon") }}><Icon size={size} color={color} strokeWidth={1.8} /></div> : null);
  const col = (gap: number): CSSProperties => ({ display: "flex", flexDirection: "column", alignItems: items, gap, textAlign: ta });

  let content: ReactNode;
  switch (cfg.template) {
    case "civic":
      content = (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ background: p.primary, color: p.background, padding: `${pad * 0.7}px ${pad}px`, ...col(u * 2) }}>
            {header}
            <div style={{ display: "flex", alignItems: "center", gap: u * 3, justifyContent: items }}>{iconEl(titleSize * 0.9, p.accent)}{titleEl}</div>
          </div>
          <div style={{ height: u * 2, background: p.accent }} />
          <div style={{ flex: 1, padding: pad, ...col(u * 4), justifyContent: "center" }}>
            {aisleEl && T({ fontFamily: head, fontWeight: 700, fontSize: bodySize, letterSpacing: "0.2em", color: p.primary }, aisleEl, "aisle")}
            <div style={{ color: p.primary }}>{rangeEl}</div>
            {subEl}
            {arrowEl(rangeSize * 0.9, p.accent)}
          </div>
          <div style={{ borderTop: `${u * 0.4}px solid ${hexA(p.text, 0.2)}`, padding: `${pad * 0.5}px ${pad}px`, ...col(u), }}>{zoneEl}{footerEl}</div>
        </div>
      );
      break;
    case "editorial":
      content = (
        <div style={{ position: "absolute", inset: u * 3, border: `${u * 0.5}px solid ${p.primary}`, padding: u * 1.2 }}>
          <div style={{ height: "100%", border: `${u * 0.2}px solid ${p.accent}`, padding: pad, ...col(u * 3.5), justifyContent: "center", boxSizing: "border-box" }}>
            {header && <div style={{ color: p.primary }}>{header}</div>}
            {iconEl(titleSize * 0.8, p.accent)}
            <div style={{ color: p.primary, fontStyle: "italic" }}>{titleEl}</div>
            <div style={{ width: u * 30, height: u * 0.4, background: p.accent }} />
            {rangeEl}
            <div style={{ width: u * 12, height: u * 0.4, background: p.accent }} />
            {subEl}
            {aisleEl && T({ fontFamily: head, fontSize: bodySize, letterSpacing: "0.25em", color: p.primary }, aisleEl, "aisle")}
            {arrowEl(rangeSize * 0.7, p.primary)}
            <div style={{ marginTop: "auto", ...col(u) }}>{zoneEl}{footerEl}</div>
          </div>
        </div>
      );
      break;
    case "wayfinding": {
      const bar = Math.max(W * 0.28, u * 22);
      content = (
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ width: bar, background: p.primary, color: p.background, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: `${pad}px ${u * 2}px` }}>
            {iconEl(bar * 0.4, p.accent)}
            {aisleEl && <div style={{ textAlign: "center", fontFamily: head, ...tf("aisle") }} data-txt="aisle" data-part="aisle">
              <div style={{ fontSize: bar * 0.11, letterSpacing: "0.2em", fontWeight: 600 }}>{aisleEl.replace(/[\d\s]+$/, "") || "AISLE"}</div>
              <div style={{ fontSize: bar * 0.55, fontWeight: 800, lineHeight: 1, color: p.accent }}>{aisleEl.match(/\d+/)?.[0] ?? aisleEl}</div>
            </div>}
            {arrowEl(bar * 0.55, p.background)}
          </div>
          <div style={{ flex: 1, padding: pad, ...col(u * 4), justifyContent: "space-between" }}>
            {header}
            <div style={col(u * 4)}>
              <div style={{ color: p.primary }}>{titleEl}</div>
              <div style={{ width: u * 14, height: u * 1.2, background: p.accent }} />
              {rangeEl}
              {subEl}
            </div>
            <div style={col(u)}>{zoneEl}{footerEl}</div>
          </div>
        </div>
      );
      break;
    }
    case "playful":
      content = (
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", width: u * 60, height: u * 60, borderRadius: "50%", background: p.accent, top: -u * 22, right: -u * 18, opacity: 0.9 }} />
          <div style={{ position: "absolute", width: u * 45, height: u * 45, borderRadius: u * 10, background: hexA(p.primary, 0.15), bottom: -u * 12, left: -u * 10, transform: "rotate(18deg)" }} />
          <div style={{ position: "absolute", width: u * 14, height: u * 14, borderRadius: "50%", background: p.primary, bottom: u * 30, right: u * 8, opacity: 0.25 }} />
          <div style={{ position: "relative", height: "100%", padding: pad, boxSizing: "border-box", ...col(u * 4), justifyContent: "center" }}>
            {header && <div style={{ color: p.primary }}>{header}</div>}
            {cfg.showIcon && <div style={{ background: p.primary, borderRadius: "50%", padding: u * 4, display: "flex" }}>{iconEl(titleSize, p.accent)}</div>}
            <div style={{ color: p.primary }}>{titleEl}</div>
            <div style={{ background: p.primary, color: p.background, borderRadius: u * 6, padding: `${u * 3}px ${u * 6}px`, boxShadow: `0 ${u}px 0 ${p.accent}` }}>{rangeEl}</div>
            {subEl}
            <div style={{ display: "flex", gap: u * 3, alignItems: "center" }}>
              {aisleEl && <div data-txt="aisle" data-part="aisle" style={{ ...tf("aisle"), border: `${u * 0.6}px solid ${p.primary}`, borderRadius: 999, padding: `${u}px ${u * 4}px`, fontWeight: 700, fontSize: bodySize, fontFamily: head, color: p.primary }}>{aisleEl}</div>}
              {arrowEl(rangeSize * 0.7, p.primary)}
            </div>
            {zoneEl}{footerEl}
          </div>
        </div>
      );
      break;
    case "overlay":
      content = (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: pad, background: cfg.image ? `linear-gradient(to top, ${hexA(p.primary, 0.75)}, transparent 60%)` : `linear-gradient(160deg, ${p.primary}, ${p.accent})` }}>
          <div style={{ background: hexA(p.background, 0.82), backdropFilter: "blur(8px)", borderRadius: u * 3, padding: pad * 0.8, borderTop: `${u * 1.2}px solid ${p.accent}`, ...col(u * 3) }}>
            {header && <div style={{ color: p.primary }}>{header}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: u * 3 }}>{iconEl(titleSize * 0.8, p.accent)}<div style={{ color: p.primary }}>{titleEl}</div></div>
            {rangeEl}
            {subEl}
            <div style={{ display: "flex", gap: u * 4, alignItems: "center" }}>
              {aisleEl && T({ fontFamily: head, fontWeight: 700, fontSize: bodySize, letterSpacing: "0.2em", color: p.primary }, aisleEl, "aisle")}
              {arrowEl(rangeSize * 0.6, p.primary)}
            </div>
            {zoneEl}{footerEl}
          </div>
        </div>
      );
      break;
  }

  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);
  const qrRef = useRef<HTMLDivElement>(null), brRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ qr?: Rect | undefined; br?: Rect | undefined; overlap: boolean }>({ overlap: false });
  const showBr = !!(cfg.braille && cfg.range), qrText = cfg.qr?.trim() ?? "";
  useLayoutEffect(() => {
    const el = rootRef.current; if (!el || (!showBr && !qrText)) { setPos({ overlap: false }); return; }
    const box = el.getBoundingClientRect(); const k = box.width / W || 1;
    const obstacles: Rect[] = [];
    el.querySelectorAll("[data-txt]").forEach((t) => {
      const r = document.createRange(); r.selectNodeContents(t);
      for (const c of r.getClientRects()) if (c.width && c.height) obstacles.push({ x: (c.left - box.left) / k, y: (c.top - box.top) / k, w: c.width / k, h: c.height / k });
    });
    const items = [qrText ? qrRef.current : null, showBr ? brRef.current : null];
    const sizes = items.filter(Boolean).map((n) => ({ w: n!.offsetWidth, h: n!.offsetHeight }));
    const placed = placeOverlays(W, H, u * 4, u * 1.5, obstacles, sizes);
    let i = 0; const next = { qr: qrText ? placed[i++] : undefined, br: showBr ? placed[i++] : undefined, overlap: placed.some((p) => p.overlap) };
    setPos((p) => (JSON.stringify(p) === JSON.stringify(next) ? p : next));
  }, [cfg, W, H, u, showBr, qrText]);
  const at = (r?: Rect): CSSProperties => (r ? { position: "absolute", left: r.x, top: r.y, zIndex: 6 } : { position: "absolute", right: u * 4, bottom: u * 4, zIndex: 6, visibility: "hidden" });

  return (
    <div ref={rootRef} style={root} data-sign data-overlap={pos.overlap ? "1" : undefined}>
      {bgImg}{tint}
      {content}
      {frame}
      {showBr && <div ref={brRef} style={{ ...at(pos.br), background: "#fff", color: "#111", borderRadius: u, padding: `${u}px ${u * 2}px`, fontSize: u * 4, lineHeight: 1.1, fontFamily: "system-ui, sans-serif", maxWidth: W * 0.5, overflowWrap: "anywhere", wordBreak: "break-all" }} title="Braille reference">{toBraille(cfg.range)}</div>}
      {qrText && <div ref={qrRef} style={at(pos.qr)}><Qr text={qrText} size={Math.max(u * 14, 0.9 * CSS_PX_PER_IN)} /></div>}
    </div>
  );
});

function CurvedText({ text, style, deg }: { text: string; style: CSSProperties; deg: number }) {
  const fs = Number(style.fontSize) || 16;
  const line = text.replace(/\s*\n\s*/g, "  ·  ");
  const ls = typeof style.letterSpacing === "string" && style.letterSpacing.endsWith("em") ? parseFloat(style.letterSpacing) * fs : 0;
  const width = line.length * (fs * 0.6 + ls);
  const g = arcGeometry(width, fs, deg);
  const id = "arc-" + Math.abs(Math.round(deg * 1000 + line.length * 7 + fs));
  return (
    <svg width={g.w} height={g.h} style={{ overflow: "visible", display: "block" }}>
      <path id={id} d={g.d} fill="none" />
      <text fill="currentColor" style={{ fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontSize: fs, letterSpacing: style.letterSpacing, fontStyle: style.fontStyle, textTransform: style.textTransform, opacity: style.opacity } as CSSProperties} textAnchor="middle">
        <textPath href={`#${id}`} startOffset="50%">{line}</textPath>
      </text>
    </svg>
  );
}

function Qr({ text, size }: { text: string; size: number }) {
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(), m = 2;
  const rects: ReactNode[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) rects.push(<rect key={r * n + c} x={c + m} y={r + m} width={1.02} height={1.02} />);
  return <svg width={size} height={size} viewBox={`0 0 ${n + m * 2} ${n + m * 2}`} style={{ background: "#fff", display: "block" }} shapeRendering="crispEdges"><g fill="#000">{rects}</g></svg>;
}
