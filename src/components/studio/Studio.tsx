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
import { Undo2, Redo2, Languages, X, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LANGS, LangContext, translate, type Lang } from "@/lib/signage/i18n";
import { SignRenderer } from "./SignRenderer";
import { CURVABLE, ELEMENT_LABELS, moveElement } from "@/lib/signage/layout";
import { Grid3x3, RotateCcw } from "lucide-react";
import { runPreflight, type Issue } from "@/lib/signage/preflight";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
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
  const elDrag = useRef<{ n: string; sx: number; sy: number; ox: number; oy: number; m: boolean } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const grid = cfg.grid ?? 0.25;
  const setEl = (n: string, p: Partial<{ x: number; y: number; s: number; curve: number }>) => setCfg((c) => ({ ...c, layout: { ...c.layout, [n]: { x: 0, y: 0, ...c.layout?.[n], ...p } } }));
  const resetEl = (n: string) => setCfg((c) => { const l = { ...c.layout }; delete l[n]; return { ...c, layout: l }; });

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

  const [pf, setPf] = useState<{ issues: Issue[]; run?: () => void } | null>(null);
  const check = async (run?: () => void) => {
    const node = signRef.current; if (!node) return run?.();
    const issues = await runPreflight(node, cfg).catch((e) => { console.error(e); return [] as Issue[]; });
    if (!issues.length && run) return run();
    setPf(run ? { issues, run } : { issues });
  };
  const guard = (f: () => void) => () => void check(f);

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
          <Button asChild variant="ghost" size="sm"><Link to="/manual"><BookOpen /> Manual</Link></Button>
          <label className="flex items-center gap-1 text-xs"><Languages className="size-3.5" /><select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded border border-border bg-card px-1 py-0.5">{LANGS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => void check()}><ClipboardCheck /> <span className="hidden lg:inline">Preflight</span></Button>
            <Button variant="outline" size="sm" onClick={guard(print)}><Printer /> <span className="hidden lg:inline">{t("Print")}</span></Button>
            <Button variant="outline" size="sm" onClick={guard(() => void exportPdf())} disabled={!!busy}><FileText /> {busy === "pdf" ? "Exporting…" : <span className="hidden lg:inline">{t("Export PDF")}</span>}</Button>
            <Button size="sm" onClick={guard(() => void exportPng())} disabled={!!busy}><Download /> {busy === "png" ? "Exporting…" : t("Export PNG (300 DPI)")}</Button>
          </div>
        </header>
        <div className="relative flex min-h-0 flex-1">
          {open && <aside className="absolute inset-y-0 left-0 z-20 w-[min(380px,90vw)] shrink-0 border-r border-border bg-sidebar shadow-lg md:static md:shadow-none"><Sidebar unit={unit} setUnit={setUnit} exportAll={() => void exportAll()} shopPdf={guard(() => void shopPdf())} duplexPdf={guard(() => void duplexPdf())} cfg={cfg} set={set} replace={setCfg} saved={saved} setSaved={setSaved} /></aside>}
          <main ref={viewRef} className="canvas-backdrop relative min-w-0 flex-1 cursor-grab select-none overflow-hidden active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => {
              const hit = (e.target as Element).closest?.("[data-part]") as HTMLElement | null;
              if (hit && signRef.current?.contains(hit)) { pts.current.clear();
                const n = hit.dataset["part"]!; const l = cfg.layout?.[n];
                elDrag.current = { n, sx: e.clientX, sy: e.clientY, ox: l?.x ?? 0, oy: l?.y ?? 0, m: false }; setSel(n);
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId); e.stopPropagation(); return;
              }
              if (!(e.target as Element).closest?.("[data-elpanel]")) setSel(null);
              pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => {
              const d = elDrag.current;
              if (d) { const k = zoom * CSS_PX_PER_IN; const up = d.m ? setCfgRaw : setCfg; d.m = true; up((c: SignConfig) => ({ ...c, layout: moveElement(c.layout, d.n, d.ox + (e.clientX - d.sx) / k, d.oy + (e.clientY - d.sy) / k, grid) })); return; }
              pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              if (pts.current.size === 2) {
                const [a, b] = [...pts.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
                const d = Math.hypot(a.x - b.x, a.y - b.y); const r = viewRef.current!.getBoundingClientRect();
                if (pinch.current) zoomTo(zoom * (d / pinch.current), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
                pinch.current = d; drag.current = null; return;
              }
              if (drag.current) setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
            }}
            onPointerUp={(e) => { if (elDrag.current) { elDrag.current = null; return; } pts.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}
            onPointerCancel={(e) => { pts.current.delete(e.pointerId); pinch.current = null; drag.current = null; }}>
            <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "0 0", width: W, height: H }} className="shadow-sign">
              <SignRenderer ref={signRef} cfg={cfg} />
              {grid > 0 && <div className="pointer-events-none absolute inset-0 snap-grid" style={{ backgroundSize: `${grid * CSS_PX_PER_IN}px ${grid * CSS_PX_PER_IN}px` }} />}
              {sel && <SelBox root={signRef.current} n={sel} zoom={zoom} cfg={cfg} />}
              {guides && (<div className="pointer-events-none absolute inset-0">
                <div className="guide-bleed absolute" style={{ inset: b, borderWidth: 1 / zoom }} />
                <div className="guide-safe absolute" style={{ inset: g, borderWidth: 1 / zoom }} />
              </div>)}
            </div>
            {guides && <div className="pointer-events-none absolute bottom-3 left-3 flex gap-3 rounded-md bg-card/90 px-3 py-1.5 text-[11px] shadow-sm"><span className="flex items-center gap-1"><span className="guide-bleed inline-block size-2.5 border" />Bleed 0.125"</span><span className="flex items-center gap-1"><span className="guide-safe inline-block size-2.5 border" />Safe 0.25"</span></div>}
            <div data-elpanel onPointerDown={(e) => e.stopPropagation()} className="absolute left-3 top-3 z-10 w-60 space-y-2 rounded-md border border-border bg-card/95 p-2.5 text-xs shadow-sm">
              <label className="flex items-center gap-2 font-medium"><Grid3x3 className="size-3.5" />Snap grid
                <select aria-label="Snap grid" value={grid} onChange={(e) => set({ grid: Number(e.target.value) })} className="ml-auto rounded border border-border bg-card px-1 py-0.5">
                  {[[0, "Off"], [0.125, '1/8"'], [0.25, '1/4"'], [0.5, '1/2"'], [1, '1"']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></label>
              {sel ? (<div className="space-y-2 border-t border-border pt-2">
                <div className="flex items-center font-semibold">{ELEMENT_LABELS[sel] ?? sel}<button className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Deselect" onClick={() => setSel(null)}><X className="size-3.5" /></button></div>
                <label className="block">Size {Math.round((cfg.layout?.[sel]?.s ?? 1) * 100)}%<input type="range" className="w-full" min={0.3} max={3} step={0.05} value={cfg.layout?.[sel]?.s ?? 1} onChange={(e) => setEl(sel, { s: Number(e.target.value) })} /></label>
                {CURVABLE.includes(sel) && <label className="block">Curve {cfg.layout?.[sel]?.curve ?? 0}°<input type="range" className="w-full" min={-300} max={300} step={5} value={cfg.layout?.[sel]?.curve ?? 0} onChange={(e) => setEl(sel, { curve: Number(e.target.value) })} /></label>}
                <div className="grid grid-cols-4 gap-1">{([["←", -1, 0], ["→", 1, 0], ["↑", 0, -1], ["↓", 0, 1]] as const).map(([l, dx, dy]) => <button key={l} aria-label={`Nudge ${l}`} className="rounded border border-border py-0.5 hover:bg-muted" onClick={() => { const c = cfg.layout?.[sel]; const st = grid || 0.0625; setCfg((cc) => ({ ...cc, layout: moveElement(cc.layout, sel, (c?.x ?? 0) + dx * st, (c?.y ?? 0) + dy * st, grid) })); }}>{l}</button>)}</div>
                <button className="flex w-full items-center justify-center gap-1 rounded border border-border py-1 hover:bg-muted" onClick={() => resetEl(sel)}><RotateCcw className="size-3" />Reset this element</button>
              </div>) : <p className="text-muted-foreground">Click any text, icon or arrow on the sign to move, resize or curve it.</p>}
              {cfg.layout && Object.keys(cfg.layout).length > 0 && <button className="w-full rounded py-0.5 text-muted-foreground underline hover:text-foreground" onClick={() => set({ layout: {} })}>Reset all positions</button>}
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-card/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm"><Maximize className="mr-1 inline size-3" />Drag to pan · Ctrl/⌘ + scroll to zoom</div>
          </main>
        </div>
      </div>
      <div className="print-only"><SignRenderer cfg={cfg} /></div>
      <Dialog open={!!pf} onOpenChange={(o) => !o && setPf(null)}>
        <DialogContent className="no-print max-w-lg">
          <DialogHeader>
            <DialogTitle>Print preflight</DialogTitle>
            <DialogDescription>{pf?.issues.length ? `${pf.issues.length} thing${pf.issues.length === 1 ? "" : "s"} to check before printing.` : "No problems found. This sign is ready to print."}</DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {pf?.issues.map((i, n) => (
              <li key={n} className="flex gap-2 rounded-md border border-border p-2 text-sm">
                <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${i.level === "error" ? "text-destructive" : "text-muted-foreground"}`} />
                <div><div className="font-medium">{i.title}</div><div className="text-xs text-muted-foreground">{i.detail}</div></div>
              </li>
            ))}
            {pf && !pf.issues.length && <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" /> Text, fonts, photo and page size all look good.</li>}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPf(null)}>{pf?.run ? "Cancel" : "Close"}</Button>
            {pf?.run && <Button onClick={() => { const r = pf.run; setPf(null); r?.(); }}>Export anyway</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function SelBox({ root, n, zoom, cfg }: { root: HTMLElement | null; n: string; zoom: number; cfg: SignConfig }) {
  const [r, setR] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = root?.querySelector(`[data-part="${n}"]`); if (!root || !el) { setR(null); return; }
    const b = root.getBoundingClientRect(), e = el.getBoundingClientRect(), k = b.width / (cfg.width * CSS_PX_PER_IN) || 1;
    setR({ x: (e.left - b.left) / k, y: (e.top - b.top) / k, w: e.width / k, h: e.height / k });
  }, [root, n, cfg, zoom]);
  if (!r) return null;
  return <div className="pointer-events-none absolute border-primary" style={{ left: r.x, top: r.y, width: r.w, height: r.h, borderWidth: 2 / zoom, borderStyle: "dashed" }} />;
}
