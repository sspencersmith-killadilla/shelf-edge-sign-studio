import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Download, FileText, Printer, PanelLeftClose, PanelLeftOpen, Maximize, ScanLine, Library } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { SavedSign, SignConfig } from "@/lib/signage/types";
import { DEFAULT_CONFIG } from "@/lib/signage/presets";
import { FONTS, ensureFont } from "@/lib/signage/fonts";
import { CSS_PX_PER_IN, exportPixelRatio, fmtSize, type Unit } from "@/lib/signage/size";
import { loadBrand, loadSaved, persistSaved } from "@/lib/signage/storage";
import { Undo2, Redo2, Languages, X } from "lucide-react";
import { LANGS, LangContext, translate, type Lang } from "@/lib/signage/i18n";
import { SignRenderer } from "./SignRenderer";
import { Sidebar } from "./Sidebar";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function Studio() {
  const [cfg, setCfgRaw] = useState<SignConfig>(DEFAULT_CONFIG);
  const hist = useRef<{ past: SignConfig[]; future: SignConfig[]; t: number }>({ past: [], future: [], t: 0 });
  const setCfg = useCallback((u: SignConfig | ((c: SignConfig) => SignConfig)) => setCfgRaw((c) => {
    const n = typeof u === "function" ? u(c) : u; const h = hist.current; const now = Date.now();
    if (now - h.t > 500) { h.past = [...h.past.slice(-49), c]; } h.t = now; h.future = []; return n;
  }), []);
  const undo = useCallback(() => setCfgRaw((c) => { const h = hist.current; const p = h.past.pop(); if (!p) return c; h.future.push(c); h.t = 0; return p; }), []);
  const redo = useCallback(() => setCfgRaw((c) => { const h = hist.current; const f = h.future.pop(); if (!f) return c; h.past.push(c); h.t = 0; return f; }), []);
  const [lang, setLangState] = useState<Lang>("en");
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("signage-studio:lang", l); };
  const t = (s: string) => translate(lang, s);
  const [tour, setTour] = useState<number | null>(null);
  const endTour = () => { setTour(null); localStorage.setItem("signage-studio:toured", "1"); };
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const [unit, setUnitState] = useState<Unit>("in");
  const setUnit = (u: Unit) => { setUnitState(u); localStorage.setItem("signage-studio:unit", u); };
  const [saved, setSavedState] = useState<SavedSign[]>([]);
  const [open, setOpen] = useState(true);
  const [guides, setGuides] = useState(true);
  const [zoom, setZoom] = useState(0.3);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const W = cfg.width * CSS_PX_PER_IN, H = cfg.height * CSS_PX_PER_IN;

  useEffect(() => {
    FONTS.forEach(ensureFont); setSavedState(loadSaved());
    const b = loadBrand(); if (b) setCfgRaw((c) => ({ ...c, header: b.header, footer: b.footer }));
    if (localStorage.getItem("signage-studio:unit") === "cm") setUnitState("cm");
    const l = localStorage.getItem("signage-studio:lang"); if (l === "es" || l === "fr") setLangState(l);
    if (!localStorage.getItem("signage-studio:toured")) setTour(0);
    if (window.innerWidth < 900) setOpen(false);
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (t.closest("input, textarea, [contenteditable]")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [undo, redo]);
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
  const pdfFrom = async (list: SignConfig[], name: string, shop = false) => {
    if (!list.length) return;
    setBusy("all"); const t = toast.loading(`Rendering ${list.length} page${list.length === 1 ? "" : "s"}…`);
    const host = document.createElement("div"); host.style.cssText = "position:fixed;left:-100000px;top:0;";
    document.body.appendChild(host);
    const { createRoot } = await import("react-dom/client"); const { flushSync } = await import("react-dom");
    try {
      const { toPng } = await import("html-to-image"); const { jsPDF } = await import("jspdf");
      let pdf: InstanceType<typeof jsPDF> | null = null;
      const BL = 0.125, MK = 0.375; // bleed, crop-mark margin (inches)
      for (const [i, c] of list.entries()) {
        ensureFont(c.headingFont); ensureFont(c.bodyFont);
        const el = document.createElement("div"); host.appendChild(el);
        const root = createRoot(el); flushSync(() => root.render(<SignRenderer cfg={c} />));
        await document.fonts.ready;
        const r = exportPixelRatio(c.width, c.height);
        const url = await toPng(el.firstElementChild as HTMLElement, { pixelRatio: r.ratio, width: c.width * CSS_PX_PER_IN, height: c.height * CSS_PX_PER_IN });
        const off = shop ? BL + MK : 0;
        const pw = c.width + off * 2, ph = c.height + off * 2;
        const o = pw > ph ? "landscape" : "portrait";
        if (!pdf) pdf = new jsPDF({ unit: "in", format: [pw, ph], orientation: o }); else pdf.addPage([pw, ph], o);
        if (shop) { pdf.setFillColor(c.palette.background); pdf.rect(MK, MK, c.width + BL * 2, c.height + BL * 2, "F"); }
        pdf.addImage(url, "PNG", off, off, c.width, c.height, undefined, "FAST");
        if (shop) {
          pdf.setDrawColor(0); pdf.setLineWidth(0.01);
          const xs = [off, off + c.width], ys = [off, off + c.height];
          for (const x of xs) { pdf.line(x, 0, x, MK - 0.05); pdf.line(x, ph - MK + 0.05, x, ph); }
          for (const y of ys) { pdf.line(0, y, MK - 0.05, y); pdf.line(pw - MK + 0.05, y, pw, y); }
        }
        root.unmount(); el.remove();
        toast.loading(`Rendered ${i + 1} of ${list.length}…`, { id: t });
      }
      pdf?.save(name); toast.success(`Exported ${list.length} page${list.length === 1 ? "" : "s"}`, { id: t });
    } catch (e) { console.error(e); toast.error("PDF export failed.", { id: t }); }
    finally { host.remove(); setBusy(null); }
  };
  const flip = { left: "right", right: "left" } as const;
  const exportAll = () => pdfFrom(saved.map((s) => s.config), "library-signs.pdf");
  const shopPdf = () => pdfFrom([cfg], `${fileBase}-print-shop.pdf`, true);
  const duplexPdf = () => pdfFrom([cfg, { ...cfg, arrow: cfg.arrow === "left" || cfg.arrow === "right" ? flip[cfg.arrow] : cfg.arrow }], `${fileBase}-double-sided.pdf`);
  const print = () => {
    let s = document.getElementById("page-size-style");
    if (!s) { s = document.createElement("style"); s.id = "page-size-style"; document.head.appendChild(s); }
    s.textContent = `@page { size: ${cfg.width}in ${cfg.height}in; margin: 0; }`;
    window.print();
  };

  const zooms: [string, () => void][] = [["Fit", fit], ["50%", () => zoomTo(0.5)], ["75%", () => zoomTo(0.75)], ["100%", () => zoomTo(1)]];
  const g = 0.25 * CSS_PX_PER_IN, b = 0.125 * CSS_PX_PER_IN;

  const steps = [
    ["Pick a collection", "Start on the Content tab: choose a collection, then edit the title, call numbers and aisle."],
    ["Make it yours", "Style changes the layout, colors and fonts. Use \"Make this my library's default\" to save your library name."],
    ["Print or batch", "Export a 300 DPI PNG or PDF, or import a spreadsheet on the Saved tab to make a whole aisle run at once."],
  ] as const;
  return (
    <LangContext.Provider value={lang}>
      <div className="no-print flex h-screen flex-col bg-background text-foreground">
        <header className="flex h-14 shrink-0 items-center gap-3 overflow-x-auto border-b border-border bg-card px-3">
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle editor">{open ? <PanelLeftClose /> : <PanelLeftOpen />}</Button>
          <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Library className="size-4" /></span><div className="shrink-0 whitespace-nowrap leading-tight"><div className="font-display text-sm font-bold">Signage Studio</div><div className="text-[11px] text-muted-foreground">Library end-panels</div></div></div>
          <div className="mx-2 h-6 w-px bg-border" />
          <span className="rounded bg-muted px-2 py-1 font-mono text-xs tabular-nums">{fmtSize(cfg.width, cfg.height, unit)}</span>
          <Button variant="ghost" size="icon" onClick={undo} aria-label="Undo (Ctrl+Z)"><Undo2 /></Button>
          <Button variant="ghost" size="icon" onClick={redo} aria-label="Redo (Ctrl+Shift+Z)"><Redo2 /></Button>
          <div className="flex rounded-md border border-border">
            {zooms.map(([l, f]) => <button key={l} onClick={f} className="px-2.5 py-1 text-xs font-medium text-muted-foreground transition first:rounded-l-md last:rounded-r-md hover:bg-muted hover:text-foreground">{l}</button>)}
          </div>
          <span className="w-12 text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <label className="flex items-center gap-2 text-xs font-medium"><Switch checked={guides} onCheckedChange={setGuides} /> <ScanLine className="size-3.5" /> {t("Guides")}</label>
          <label className="flex items-center gap-1 text-xs"><Languages className="size-3.5" /><select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded border border-border bg-card px-1 py-0.5">{LANGS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={print}><Printer /> <span className="hidden lg:inline">{t("Print")}</span></Button>
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={!!busy}><FileText /> {busy === "pdf" ? "Exporting…" : <span className="hidden lg:inline">{t("Export PDF")}</span>}</Button>
            <Button size="sm" onClick={exportPng} disabled={!!busy}><Download /> {busy === "png" ? "Exporting…" : t("Export PNG (300 DPI)")}</Button>
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1">
          {open && <aside className="absolute inset-y-0 left-0 z-20 w-[min(380px,90vw)] shrink-0 border-r border-border bg-sidebar shadow-lg md:static md:shadow-none"><Sidebar unit={unit} setUnit={setUnit} exportAll={() => void exportAll()} shopPdf={() => void shopPdf()} duplexPdf={() => void duplexPdf()} cfg={cfg} set={set} replace={setCfg} saved={saved} setSaved={setSaved} /></aside>}
          <main ref={viewRef} className="canvas-backdrop relative min-w-0 flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => { pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => {
              pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              if (pts.current.size === 2) {
                const [a, b] = [...pts.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
                const d = Math.hypot(a.x - b.x, a.y - b.y); const r = viewRef.current!.getBoundingClientRect();
                if (pinch.current) zoomTo(zoom * (d / pinch.current), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
                pinch.current = d; drag.current = null; return;
              }
              if (drag.current) setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
            }}
            onPointerUp={(e) => { pts.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}
            onPointerCancel={(e) => { pts.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}>
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
      {tour !== null && (
        <div role="dialog" aria-label="Welcome tour" className="no-print fixed bottom-6 right-6 z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-lg">
          <button aria-label="Close tour" onClick={endTour} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Step {tour + 1} of {steps.length}</div>
          <div className="mt-1 font-display font-bold">{steps[tour]![0]}</div>
          <p className="mt-1 text-sm text-muted-foreground">{steps[tour]![1]}</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={endTour}>Skip</Button>
            <Button size="sm" onClick={() => (tour + 1 < steps.length ? setTour(tour + 1) : endTour())}>{tour + 1 < steps.length ? "Next" : "Done"}</Button>
          </div>
        </div>
      )}
    </LangContext.Provider>
  );
}
