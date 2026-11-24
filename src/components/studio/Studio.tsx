import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download, FileText, Printer, PanelLeftClose, PanelLeftOpen, Maximize, ScanLine, Library } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { SavedSign, SignConfig } from "@/lib/signage/types";
import { DEFAULT_CONFIG } from "@/lib/signage/presets";
import { FONTS, ensureFont } from "@/lib/signage/fonts";
import { CSS_PX_PER_IN, exportPixelRatio } from "@/lib/signage/size";
import { loadSaved, persistSaved } from "@/lib/signage/storage";
import { SignRenderer } from "./SignRenderer";
import { Sidebar } from "./Sidebar";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Studio() {
  const [cfg, setCfg] = useState<SignConfig>(DEFAULT_CONFIG);
  const [saved, setSavedState] = useState<SavedSign[]>([]);
  const [open, setOpen] = useState(true);
  const [guides, setGuides] = useState(true);
  const [zoom, setZoom] = useState(0.3);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const W = cfg.width * CSS_PX_PER_IN, H = cfg.height * CSS_PX_PER_IN;

  useEffect(() => { FONTS.forEach(ensureFont); setSavedState(loadSaved()); }, []);
  const set = useCallback((p: Partial<SignConfig>) => setCfg((c) => ({ ...c, ...p })), []);
  const setSaved = (s: SavedSign[]) => { setSavedState(s); persistSaved(s); };

  const fit = useCallback(() => {
    const el = viewRef.current; if (!el) return;
    const z = Math.min((el.clientWidth - 80) / W, (el.clientHeight - 80) / H);
    setZoom(z);
    setOffset({ x: (el.clientWidth - W * z) / 2, y: (el.clientHeight - H * z) / 2 });
  }, [W, H]);
  useLayoutEffect(() => { fit(); }, [fit, open]);
  useEffect(() => { const h = () => fit(); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, [fit]);

  const zoomTo = (next: number, px?: number, py?: number) => {
    const el = viewRef.current; if (!el) return;
    const n = clamp(next, 0.05, 3);
    const cx = px ?? el.clientWidth / 2, cy = py ?? el.clientHeight / 2;
    setZoom((z) => { const k = n / z; setOffset((o) => ({ x: cx - (cx - o.x) * k, y: cy - (cy - o.y) * k })); return n; });
  };
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  wheelRef.current = (e) => {
    const el = viewRef.current!; const r = el.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey || true) {
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      if (e.ctrlKey || e.metaKey) zoomTo(zoom * Math.exp(-dy * 0.01), e.clientX - r.left, e.clientY - r.top);
      else setOffset((o) => ({ x: o.x - e.deltaX, y: o.y - dy }));
    }
  };
  useEffect(() => {
    const el = viewRef.current; if (!el) return;
    const h = (e: WheelEvent) => { e.preventDefault(); wheelRef.current(e); };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const render = async () => {
    const node = signRef.current; if (!node) throw new Error("no sign");
    await document.fonts.ready;
    const { toPng } = await import("html-to-image");
    const r = exportPixelRatio(cfg.width, cfg.height);
    if (r.capped) toast.message(`Large sign: exporting at ${r.dpi} DPI to stay within browser limits.`);
    const url = await toPng(node, { pixelRatio: r.ratio, width: W, height: H, cacheBust: true });
    return url;
  };
  const fileBase = (cfg.title || "sign").toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-${cfg.width}x${cfg.height}in`;
  const exportPng = async () => {
    setBusy("png");
    try { const url = await render(); const a = document.createElement("a"); a.href = url; a.download = `${fileBase}.png`; a.click(); toast.success("PNG exported"); }
    catch (e) { console.error(e); toast.error("Export failed. Try again or remove the background image."); } finally { setBusy(null); }
  };
  const exportPdf = async () => {
    setBusy("pdf");
    try {
      const url = await render();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "in", format: [cfg.width, cfg.height], orientation: cfg.width > cfg.height ? "landscape" : "portrait" });
      pdf.addImage(url, "PNG", 0, 0, cfg.width, cfg.height, undefined, "FAST");
      pdf.save(`${fileBase}.pdf`); toast.success("PDF exported");
    } catch (e) { console.error(e); toast.error("PDF export failed."); } finally { setBusy(null); }
  };
  const print = () => {
    let s = document.getElementById("page-size-style");
    if (!s) { s = document.createElement("style"); s.id = "page-size-style"; document.head.appendChild(s); }
    s.textContent = `@page { size: ${cfg.width}in ${cfg.height}in; margin: 0; }`;
    window.print();
  };

  const zooms: [string, () => void][] = [["Fit", fit], ["50%", () => zoomTo(0.5)], ["75%", () => zoomTo(0.75)], ["100%", () => zoomTo(1)]];
  const g = 0.25 * CSS_PX_PER_IN, b = 0.125 * CSS_PX_PER_IN;

  return (
    <>
      <div className="no-print flex h-screen flex-col bg-background text-foreground">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle editor">{open ? <PanelLeftClose /> : <PanelLeftOpen />}</Button>
          <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Library className="size-4" /></span><div className="leading-tight"><div className="font-display text-sm font-bold">Signage Studio</div><div className="text-[11px] text-muted-foreground">Library end-panels</div></div></div>
          <div className="mx-2 h-6 w-px bg-border" />
          <span className="rounded bg-muted px-2 py-1 font-mono text-xs tabular-nums">{cfg.width}" × {cfg.height}"</span>
          <div className="flex rounded-md border border-border">
            {zooms.map(([l, f]) => <button key={l} onClick={f} className="px-2.5 py-1 text-xs font-medium text-muted-foreground transition first:rounded-l-md last:rounded-r-md hover:bg-muted hover:text-foreground">{l}</button>)}
          </div>
          <span className="w-12 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <label className="flex items-center gap-2 text-xs font-medium"><Switch checked={guides} onCheckedChange={setGuides} /> <ScanLine className="size-3.5" /> Guides</label>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={print}><Printer /> Print</Button>
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={!!busy}><FileText /> {busy === "pdf" ? "Exporting…" : "Export PDF"}</Button>
            <Button size="sm" onClick={exportPng} disabled={!!busy}><Download /> {busy === "png" ? "Exporting…" : "Export PNG (300 DPI)"}</Button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          {open && <aside className="w-[380px] shrink-0 border-r border-border bg-sidebar"><Sidebar cfg={cfg} set={set} replace={setCfg} saved={saved} setSaved={setSaved} /></aside>}
          <main ref={viewRef} className="canvas-backdrop relative min-w-0 flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
            onPointerDown={(e) => { drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => { if (drag.current) setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }}
            onPointerUp={() => { drag.current = null; }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "0 0", width: W, height: H }} className="shadow-sign">
              <SignRenderer ref={signRef} cfg={cfg} />
              {guides && (<div className="pointer-events-none absolute inset-0">
                <div className="guide-bleed absolute" style={{ inset: b, borderWidth: 1 / zoom }} />
                <div className="guide-safe absolute" style={{ inset: g, borderWidth: 1 / zoom }} />
              </div>)}
            </div>
            {guides && <div className="pointer-events-none absolute bottom-3 left-3 flex gap-3 rounded-md bg-card/90 px-3 py-1.5 text-[11px] shadow-sm"><span className="flex items-center gap-1"><span className="guide-bleed inline-block size-2.5 border" />Bleed 0.125"</span><span className="flex items-center gap-1"><span className="guide-safe inline-block size-2.5 border" />Safe 0.25"</span></div>}
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-card/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm"><Maximize className="mr-1 inline size-3" />Drag to pan · Ctrl/⌘ + scroll to zoom</div>
          </main>
        </div>
      </div>
      <div className="print-only"><SignRenderer cfg={cfg} /></div>
    </>
  );
}
