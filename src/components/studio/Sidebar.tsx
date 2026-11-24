import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowLeftRight, Ban, Copy, Download, Trash2, Upload, RotateCcw, ImagePlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { SavedSign, SignConfig, Arrow } from "@/lib/signage/types";
import { COLLECTIONS, ICONS, TEMPLATES, applyCollection, getCollection } from "@/lib/signage/presets";
import { FONTS, fontStack } from "@/lib/signage/fonts";
import { SIZE_PRESETS, clampInches, swapOrientation } from "@/lib/signage/size";
import { parseImport, persistBrand } from "@/lib/signage/storage";
import { contrastRatio } from "@/lib/signage/contrast";
import { signsFromCsv } from "@/lib/signage/csv";
import { fromUnit, toUnit, fmtSize, type Unit } from "@/lib/signage/size";
import { AlertTriangle, FileStack, Scissors, Columns2, ShieldCheck } from "lucide-react";
import { useT } from "@/lib/signage/i18n";
import { cmykRisk, readableDistanceFt } from "@/lib/signage/print";
import { CSS_PX_PER_IN } from "@/lib/signage/size";
import { ICON_MAP, SignRenderer } from "./SignRenderer";
import { BranchPanel } from "./BranchPanel";
import { WordingPanel } from "./WordingPanel";
import { Field, RangeField, Seg, ColorField } from "./Field";

interface Props { shopPdf: () => void; duplexPdf: () => void; unit: Unit; setUnit: (u: Unit) => void; exportAll: () => void; cfg: SignConfig; set: (p: Partial<SignConfig>) => void; replace: (c: SignConfig) => void; saved: SavedSign[]; setSaved: (s: SavedSign[]) => void }

const ARROW_OPTS: { v: Arrow; l: React.ReactNode }[] = [
  { v: "none", l: <Ban className="mx-auto size-3.5" /> }, { v: "left", l: <ArrowLeft className="mx-auto size-3.5" /> }, { v: "right", l: <ArrowRight className="mx-auto size-3.5" /> },
  { v: "up", l: <ArrowUp className="mx-auto size-3.5" /> }, { v: "down", l: <ArrowDown className="mx-auto size-3.5" /> }, { v: "both", l: <ArrowLeftRight className="mx-auto size-3.5" /> },
];

export function Sidebar({ cfg, set, replace, saved, setSaved, unit, setUnit, exportAll, shopPdf, duplexPdf }: Props) {
  const t = useT();
  return (
    <Tabs defaultValue="content" className="flex h-full flex-col">
      <TabsList className="mx-4 mt-3 grid grid-cols-4">
        <TabsTrigger value="content" className="text-xs">{t("Content")}</TabsTrigger>
        <TabsTrigger value="style" className="text-xs">{t("Style")}</TabsTrigger>
        <TabsTrigger value="size" className="text-xs">{t("Size")}</TabsTrigger>
        <TabsTrigger value="saved" className="text-xs">{t("Saved")}</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <TabsContent value="content" className="space-y-5 pt-3"><ContentTab cfg={cfg} set={set} replace={replace} /></TabsContent>
        <TabsContent value="style" className="space-y-5 pt-3"><StyleTab cfg={cfg} set={set} /></TabsContent>
        <TabsContent value="size" className="space-y-5 pt-3"><SizeTab cfg={cfg} set={set} unit={unit} setUnit={setUnit} shopPdf={shopPdf} duplexPdf={duplexPdf} /></TabsContent>
        <TabsContent value="saved" className="space-y-5 pt-3"><SavedTab cfg={cfg} replace={replace} saved={saved} setSaved={setSaved} exportAll={exportAll} /></TabsContent>
      </div>
    </Tabs>
  );
}

function ContentTab({ cfg, set, replace }: Pick<Props, "cfg" | "set" | "replace">) {
  return (<>
    <Field label="Collection preset">
      <div className="grid grid-cols-2 gap-1.5">
        {COLLECTIONS.map((c) => (
          <button key={c.id} onClick={() => replace(applyCollection(cfg, c.id))} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs font-medium transition hover:border-primary ${cfg.collection === c.id ? "border-primary bg-accent" : "border-border bg-card"}`}>
            <span className="flex shrink-0 overflow-hidden rounded-sm"><span className="size-3" style={{ background: c.palette.primary }} /><span className="size-3" style={{ background: c.palette.accent }} /></span>
            {c.name}
          </button>
        ))}
      </div>
    </Field>
    <WordingPanel cfg={cfg} set={set} />
    <Field label="Library header" toggle={cfg.showHeader} onToggle={(v) => set({ showHeader: v })}><Input value={cfg.header} onChange={(e) => set({ header: e.target.value })} />
      <button className="text-xs font-medium text-primary hover:underline" onClick={() => { persistBrand({ header: cfg.header, footer: cfg.footer }); toast.success("Saved as your library's default name and footer"); }}>Make this my library's default</button></Field>
    <Field label="Section title"><Input value={cfg.title} onChange={(e) => set({ title: e.target.value })} /></Field>
    <Field label="Call number range"><Input value={cfg.range} onChange={(e) => set({ range: e.target.value })} /></Field>
    <Field label="Sub-ranges / genres"><Textarea rows={3} value={cfg.subRanges} onChange={(e) => set({ subRanges: e.target.value })} /></Field>
    <Field label="Aisle / bay" toggle={cfg.showAisle} onToggle={(v) => set({ showAisle: v })}><Input value={cfg.aisle} onChange={(e) => set({ aisle: e.target.value })} /></Field>
    <Field label="Floor / zone" toggle={cfg.showZone} onToggle={(v) => set({ showZone: v })}><Input value={cfg.zone} onChange={(e) => set({ zone: e.target.value })} /></Field>
    <Field label="Direction arrow"><Seg value={cfg.arrow} options={ARROW_OPTS} onChange={(v) => set({ arrow: v })} /></Field>
    <Field label="Footer note"><Input value={cfg.footer} onChange={(e) => set({ footer: e.target.value })} /></Field>
    <Field label="QR code link"><Input placeholder="https://catalog.yourlibrary.org/…" value={cfg.qr ?? ""} onChange={(e) => set({ qr: e.target.value })} />
      <p className="text-xs text-muted-foreground">Adds a scannable code in the bottom corner. Leave empty to hide.</p></Field>
    <Field label="Braille preview" toggle={!!cfg.braille} onToggle={(v) => set({ braille: v })}>
      <p className="text-xs text-muted-foreground">Shows the call number range in Grade 1 braille as a reference for your sign maker. Printed dots are not tactile, so ADA signs need a fabricated raised-braille panel.</p></Field>
    <Field label="Text direction"><Seg value={cfg.dir ?? "ltr"} options={[{ v: "ltr", l: "Left to right" }, { v: "rtl", l: "Right to left" }]} onChange={(v) => set({ dir: v })} /></Field>
    <Field label="Icon" toggle={cfg.showIcon} onToggle={(v) => set({ showIcon: v })}>
      <div className="grid grid-cols-6 gap-1.5">
        {ICONS.map((n) => { const I = ICON_MAP[n]!; return (
          <button key={n} aria-label={n} onClick={() => set({ icon: n })} className={`flex aspect-square items-center justify-center rounded-md border transition hover:border-primary ${cfg.icon === n ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground"}`}><I className="size-4" /></button>
        ); })}
      </div>
    </Field>
  </>);
}

function StyleTab({ cfg, set }: Pick<Props, "cfg" | "set">) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const p = cfg.palette;
  const readFile = (f?: File) => {
    if (!f) return;
    if (!/image\/(png|jpe?g|webp)/.test(f.type)) { toast.error("Please use a PNG, JPG or WebP image"); return; }
    const r = new FileReader();
    r.onload = () => set({ image: String(r.result) });
    r.readAsDataURL(f);
  };
  const fontSel = (label: string, key: "headingFont" | "bodyFont") => (
    <Field label={label}>
      <Select value={cfg[key]} onValueChange={(v) => set({ [key]: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}><span style={{ fontFamily: fontStack(f) }}>{f}</span></SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
  return (<>
    <Field label="Template">
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => set({ template: t.id })} className={`overflow-hidden rounded-md border text-left transition hover:border-primary ${cfg.template === t.id ? "border-primary ring-2 ring-ring" : "border-border"}`}>
            <div className="flex h-24 items-start justify-center overflow-hidden bg-muted pt-1.5">
              <div style={{ transform: `scale(${80 / (18 * 96)})`, transformOrigin: "top center", width: 12 * 96, height: 18 * 96, flexShrink: 0 }}>
                <SignRenderer cfg={{ ...cfg, template: t.id, width: 12, height: 18 }} />
              </div>
            </div>
            <div className="p-1.5"><div className="text-xs font-semibold">{t.name}</div><div className="text-[10px] text-muted-foreground">{t.blurb}</div></div>
          </button>
        ))}
      </div>
    </Field>
    <Field label="Colors">
      <div className="grid grid-cols-2 gap-1.5">
        <ColorField label="Primary" value={p.primary} onChange={(v) => set({ palette: { ...p, primary: v } })} />
        <ColorField label="Accent" value={p.accent} onChange={(v) => set({ palette: { ...p, accent: v } })} />
        <ColorField label="Text" value={p.text} onChange={(v) => set({ palette: { ...p, text: v } })} />
        <ColorField label="Background" value={p.background} onChange={(v) => set({ palette: { ...p, background: v } })} />
      </div>
      {[["Text on background", p.text, p.background], ["Accent on background", p.accent, p.background]].map(([l, a, b]) => { const r = contrastRatio(a!, b!); return r < 3 ? (
        <p key={l} className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{l}: contrast {r}:1 is hard to read. Aim for at least 3:1 (4.5:1 for small text).</p>
      ) : null; })}
      {Object.entries(p).filter(([, v]) => cmykRisk(v)).map(([k]) => <p key={k} className="flex items-start gap-1.5 rounded-md border border-border bg-muted p-2 text-xs text-muted-foreground"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />The {k} color is very bright and may print duller than on screen.</p>)}
      <Button variant="outline" size="sm" className="w-full" onClick={() => set({ palette: { ...getCollection(cfg.collection).palette } })}><RotateCcw /> Reset to collection default</Button>
    </Field>
    {fontSel("Heading font", "headingFont")}
    {fontSel("Body / call-number font", "bodyFont")}
    <RangeField label="Title size" value={cfg.titleScale} min={0.4} max={2} step={0.05} onChange={(v) => set({ titleScale: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
    <RangeField label="Call number size" value={cfg.rangeScale} min={0.4} max={2} step={0.05} onChange={(v) => set({ rangeScale: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
    <p className="-mt-3 text-xs text-muted-foreground">Call numbers readable from about {readableDistanceFt((Math.min(cfg.width, cfg.height) * CSS_PX_PER_IN / 100) * (cfg.width / cfg.height < 0.45 ? 15 : 13) * cfg.rangeScale)} ft (1" letters per 10 ft).</p>
    <RangeField label="Body size" value={cfg.bodyScale} min={0.4} max={2} step={0.05} onChange={(v) => set({ bodyScale: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
    <Field label="Alignment"><Seg value={cfg.align} options={[{ v: "left", l: "Left" }, { v: "center", l: "Center" }, { v: "right", l: "Right" }]} onChange={(v) => set({ align: v })} /></Field>
    <Field label="Background image">
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed p-4 text-center text-xs transition ${drag ? "border-primary bg-accent" : "border-border bg-card hover:border-primary"}`}>
        {cfg.image ? <img src={cfg.image} alt="Background" className="h-16 rounded object-cover" /> : <ImagePlus className="size-5 text-muted-foreground" />}
        <span className="text-muted-foreground">Drop a PNG, JPG or WebP, or click to choose</span>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
      </div>
      {cfg.image && (<div className="space-y-4 pt-2">
        <Button variant="outline" size="sm" className="w-full" onClick={() => set({ image: null })}><Trash2 /> Remove image</Button>
        <Seg value={cfg.imageFit} options={[{ v: "cover", l: "Cover" }, { v: "contain", l: "Contain" }, { v: "tile", l: "Tile" }]} onChange={(v) => set({ imageFit: v })} />
        <Seg value={cfg.focal} options={(["center", "top", "bottom", "left", "right"] as const).map((v) => ({ v, l: v[0]!.toUpperCase() + v.slice(1) }))} onChange={(v) => set({ focal: v })} />
        <ColorField label="Overlay tint" value={cfg.tint} onChange={(v) => set({ tint: v })} />
        <RangeField label="Overlay opacity" value={cfg.tintOpacity} min={0} max={0.95} step={0.01} onChange={(v) => set({ tintOpacity: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
        <RangeField label="Background blur" value={cfg.blur} min={0} max={20} step={1} onChange={(v) => set({ blur: v })} fmt={(v) => `${v}px`} />
      </div>)}
    </Field>
  </>);
}

function SizeTab({ cfg, set, unit, setUnit, shopPdf, duplexPdf }: Pick<Props, "cfg" | "set" | "unit" | "setUnit" | "shopPdf" | "duplexPdf">) {
  const portrait = cfg.height >= cfg.width;
  return (<>
    <Field label="Units"><Seg value={unit} options={[{ v: "in", l: "Inches" }, { v: "cm", l: "Centimeters" }]} onChange={setUnit} /></Field>
    <p className="text-xs text-muted-foreground">Current: {fmtSize(cfg.width, cfg.height, unit)}</p>
    <Field label="Print size">
      <div className="space-y-1.5">
        {SIZE_PRESETS.map((s) => (
          <button key={s.id} onClick={() => set(s.id === "custom" ? { sizePreset: "custom" } : { sizePreset: s.id, ...swapOrientation(s.w, s.h, portrait ? "portrait" : "landscape") })}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition hover:border-primary ${cfg.sizePreset === s.id ? "border-primary bg-accent font-medium" : "border-border bg-card"}`}>{s.label}</button>
        ))}
      </div>
    </Field>
    {cfg.sizePreset === "custom" && (
      <div className="grid grid-cols-2 gap-2">
        {(["width", "height"] as const).map((k) => (
          <Field key={k + unit} label={`${k === "width" ? "Width" : "Height"} (${unit})`}><Input type="number" step={unit === "cm" ? 0.5 : 0.25} defaultValue={toUnit(cfg[k], unit)} onBlur={(e) => { const v = clampInches(fromUnit(+e.target.value, unit)); e.target.value = String(toUnit(v, unit)); set({ [k]: v }); }} /></Field>
        ))}
        <p className="col-span-2 text-xs text-muted-foreground">Between 3" and 48" (7.6–122 cm). Applies when you leave the field.</p>
      </div>
    )}
    <Field label="Orientation"><Seg value={portrait ? "portrait" : "landscape"} options={[{ v: "portrait", l: "Portrait" }, { v: "landscape", l: "Landscape" }]} onChange={(o) => set(swapOrientation(cfg.width, cfg.height, o))} /></Field>
    <RangeField label="Padding" value={cfg.padding} min={0.25} max={3} step={0.05} onChange={(v) => set({ padding: v })} fmt={(v) => `${v.toFixed(2)}"`} />
    <Field label="Border / frame"><Seg value={cfg.frame} options={[{ v: "none", l: "None" }, { v: "thin", l: "Thin" }, { v: "thick", l: "Thick" }, { v: "double", l: "Double" }]} onChange={(v) => set({ frame: v })} /></Field>
    <Field label="Print shop">
      <div className="grid gap-2">
        <Button variant="outline" size="sm" onClick={shopPdf}><Scissors /> PDF with bleed & crop marks</Button>
        <Button variant="outline" size="sm" onClick={duplexPdf}><Columns2 /> Double-sided PDF (front + back)</Button>
      </div>
      <p className="text-xs text-muted-foreground">Bleed adds 0.125" of background on every side. The back page flips left/right arrows for the other side of the shelf.</p>
    </Field>
  </>);
}

function SavedTab({ cfg, replace, saved, setSaved, exportAll }: Pick<Props, "cfg" | "replace" | "saved" | "setSaved" | "exportAll">) {
  const [name, setName] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const importCsv = async (f?: File) => {
    if (!f) return;
    if (f.size > 2_000_000) { toast.error("That spreadsheet is too large (2 MB max)"); return; }
    try { const { signs, skipped } = signsFromCsv(await f.text(), cfg); setSaved([...signs, ...saved]); toast.success(`Created ${signs.length} sign${signs.length === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} row${skipped === 1 ? "" : "s"} with no range` : ""}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not read that spreadsheet"); }
  };
  const save = () => {
    const n = name.trim() || `${cfg.title} ${cfg.range}`.trim();
    setSaved([{ id: `s-${Date.now()}`, name: n, savedAt: Date.now(), config: cfg }, ...saved]);
    setName(""); toast.success(`Saved "${n}"`);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "library-signage-studio", version: 1, signs: saved }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "library-signs.json"; a.click(); URL.revokeObjectURL(a.href);
  };
  const importJson = async (f?: File) => {
    if (!f) return;
    try { const list = parseImport(await f.text()); setSaved([...list, ...saved.filter((s) => !list.some((l) => l.id === s.id))]); toast.success(`Imported ${list.length} sign${list.length === 1 ? "" : "s"}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not read that file"); }
  };
  return (<>
    <Field label="Save current sign">
      <div className="flex gap-2"><Input placeholder="e.g. Fiction Aisle 1 (A–C)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} /><Button onClick={save}>Save</Button></div>
    </Field>
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm" onClick={exportJson} disabled={!saved.length}><Download /> Export JSON</Button>
      <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}><Upload /> Import JSON</Button>
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void importJson(e.target.files?.[0]); e.target.value = ""; }} />
      <Button variant="outline" size="sm" onClick={() => csvRef.current?.click()}><Upload /> Import CSV run</Button>
      <Button variant="outline" size="sm" onClick={exportAll} disabled={!saved.length}><FileStack /> All as one PDF</Button>
      <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void importCsv(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
    <BranchPanel cfg={cfg} replace={replace} />
    <p className="flex gap-1.5 rounded-md bg-muted p-2 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 shrink-0" />Private by design: saved signs stay in this browser unless you share them with your library. No patron data is collected.</p>
    <p className="text-xs text-muted-foreground">CSV columns: title, range, sub-ranges (separate lines with |), aisle, zone, footer. Each row becomes a sign using the current design.</p>
    <Field label={`Saved signs (${saved.length})`}>
      {saved.length === 0 ? <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">No saved signs yet. Save one to build a whole aisle run.</p> : (
        <ul className="space-y-1.5">
          {saved.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
              <span className="flex shrink-0 overflow-hidden rounded-sm"><span className="h-8 w-2" style={{ background: s.config.palette.primary }} /><span className="h-8 w-1" style={{ background: s.config.palette.accent }} /></span>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.config.width}" × {s.config.height}" · {TEMPLATES.find((t) => t.id === s.config.template)?.name}</div></div>
              <Button size="sm" variant="secondary" onClick={() => { replace(s.config); toast(`Loaded "${s.name}"`); }}>Load</Button>
              <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => setSaved([{ ...s, id: `s-${Date.now()}`, name: `${s.name} (copy)`, savedAt: Date.now() }, ...saved])}><Copy /></Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setSaved(saved.filter((x) => x.id !== s.id))}><Trash2 /></Button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  </>);
}
