import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useT } from "@/lib/signage/i18n";

export function Field({ label, children, toggle, onToggle }: { label: string; children: ReactNode; toggle?: boolean; onToggle?: (v: boolean) => void }) {
  const t = useT(); label = t(label);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
        {onToggle && <Switch checked={!!toggle} onCheckedChange={onToggle} aria-label={`Show ${label}`} />}
      </div>
      {(!onToggle || toggle) && children}
    </div>
  );
}

export function RangeField({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  const t = useT(); label = t(label);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs"><span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span><span className="tabular-nums text-foreground">{fmt ? fmt(value) : value}</span></div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0] ?? value)} />
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-md border border-border bg-muted p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={`flex-1 rounded px-2 py-1.5 text-xs font-medium transition ${value === o.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{o.l}</button>
      ))}
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-border bg-card p-1.5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" />
      <span className="text-xs"><span className="block font-medium">{label}</span><span className="font-mono text-muted-foreground">{value.toUpperCase()}</span></span>
    </label>
  );
}
