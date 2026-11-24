import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { suggestSignWording } from "@/lib/ai/wording.functions";
import type { SignConfig } from "@/lib/signage/types";

type Wording = { title: string; range: string; subRanges: string[]; footer: string; titleScale: number; rangeScale: number; bodyScale: number; rationale: string };
const READERS = ["Adults", "Teens", "Children (ages 8–12)", "Young children", "Academic / researchers", "English learners", "All ages"];

export function WordingPanel({ cfg, set }: { cfg: SignConfig; set: (p: Partial<SignConfig>) => void }) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [collection, setCollection] = useState(cfg.title);
  const [range, setRange] = useState(cfg.range);
  const [readers, setReaders] = useState(READERS[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<Wording | null>(null);
  const suggest = useServerFn(suggestSignWording);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  const go = async () => {
    setBusy(true); setError(null); setOut(null);
    try { const r = await suggest({ data: { collection, range, readers } }); if (r.ok) setOut(r.wording); else setError(r.error); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't get suggestions."); }
    finally { setBusy(false); }
  };
  const apply = () => { if (!out) return; set({ title: out.title, range: out.range, subRanges: out.subRanges.join("\n"), footer: out.footer || cfg.footer, titleScale: out.titleScale, rangeScale: out.rangeScale, bodyScale: out.bodyScale }); toast.success("Wording applied"); };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <button className="flex w-full items-center gap-2 text-left text-sm font-semibold" onClick={() => { setOpen(!open); setCollection(cfg.title); setRange(cfg.range); }}>
        <Sparkles className="size-4 text-primary" /> Suggest wording with AI
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <Input aria-label="Collection name" placeholder="Collection name" value={collection} onChange={(e) => setCollection(e.target.value)} />
          <Input aria-label="Call number range" placeholder="Call number range" value={range} onChange={(e) => setRange(e.target.value)} />
          <select aria-label="Intended readers" value={readers} onChange={(e) => setReaders(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {READERS.map((r) => <option key={r}>{r}</option>)}
          </select>
          {signedIn
            ? <Button size="sm" className="w-full" onClick={() => void go()} disabled={busy || !collection.trim() || !range.trim()}>{busy ? "Thinking…" : "Suggest wording"}</Button>
            : <p className="text-xs text-muted-foreground">Sign in on the Saved tab to use AI suggestions.</p>}
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          {out && (
            <div className="space-y-1 rounded-md bg-muted p-2 text-sm">
              <div className="font-display font-bold" style={{ fontSize: `${0.8 + out.titleScale * 0.3}rem` }}>{out.title}</div>
              <div className="font-bold" style={{ fontSize: `${0.8 + out.rangeScale * 0.3}rem` }}>{out.range}</div>
              <ul className="text-xs">{out.subRanges.map((s) => <li key={s}>{s}</li>)}</ul>
              {out.footer && <div className="text-xs opacity-80">{out.footer}</div>}
              <p className="pt-1 text-xs text-muted-foreground">{out.rationale}</p>
              <Button size="sm" className="mt-1 w-full" onClick={apply}>Apply to sign</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
