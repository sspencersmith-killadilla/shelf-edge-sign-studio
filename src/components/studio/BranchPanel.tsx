import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { Building2, Copy, LogOut, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SignConfig } from "@/lib/signage/types";
import { DEFAULT_CONFIG } from "@/lib/signage/presets";
import { Field } from "./Field";

interface Lib { id: string; name: string; join_code: string }
interface Shared { id: string; name: string; config: SignConfig; created_by: string; created_at: string }

export function BranchPanel({ cfg, replace }: { cfg: SignConfig; replace: (c: SignConfig) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [libs, setLibs] = useState<Lib[]>([]);
  const [lib, setLib] = useState<string>("");
  const [signs, setSigns] = useState<Shared[]>([]);
  const [newName, setNewName] = useState(""); const [code, setCode] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") setUser(s?.user ?? null); });
    return () => data.subscription.unsubscribe();
  }, []);
  const loadLibs = useCallback(async () => {
    const { data, error } = await supabase.from("libraries").select("id,name,join_code").order("name");
    if (error) { toast.error("Couldn't load your libraries"); return; }
    setLibs(data); setLib((l) => (data.some((d) => d.id === l) ? l : data[0]?.id ?? ""));
  }, []);
  const loadSigns = useCallback(async (id: string) => {
    if (!id) { setSigns([]); return; }
    const { data, error } = await supabase.from("shared_signs").select("id,name,config,created_by,created_at").eq("library_id", id).order("created_at", { ascending: false });
    if (error) { toast.error("Couldn't load shared signs"); return; }
    setSigns(data.map((d) => ({ ...d, config: { ...DEFAULT_CONFIG, ...(d.config as object) } as SignConfig })));
  }, []);
  useEffect(() => { if (user) void loadLibs(); else { setLibs([]); setLib(""); } }, [user, loadLibs]);
  useEffect(() => { void loadSigns(lib); }, [lib, loadSigns]);

  if (!user) return (
    <Field label="Share across branches">
      <p className="text-xs text-muted-foreground">Sign in to share designs with staff at every branch. Signs saved above stay on this computer either way.</p>
      <Button asChild size="sm" variant="secondary" className="w-full"><Link to="/auth"><Building2 /> Sign in to share</Link></Button>
    </Field>
  );
  const create = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase.rpc("create_library", { _name: newName });
    if (error) { toast.error(error.message); return; }
    setNewName(""); await loadLibs(); setLib(data); toast.success("Library created. Share the join code with your branches.");
  };
  const join = async () => {
    if (!code.trim()) return;
    const { data, error } = await supabase.rpc("join_library", { _code: code });
    if (error) { toast.error(error.message); return; }
    setCode(""); await loadLibs(); setLib(data); toast.success("Joined library");
  };
  const share = async () => {
    const { error } = await supabase.from("shared_signs").insert({ library_id: lib, name: `${cfg.title} ${cfg.range}`.trim() || "Sign", config: { ...cfg, image: cfg.image && cfg.image.length > 1_500_000 ? null : cfg.image } as never });
    if (error) { toast.error(error.message); return; }
    toast.success("Shared with your library"); void loadSigns(lib);
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("shared_signs").delete().eq("id", id);
    if (error) toast.error(error.message); else void loadSigns(lib);
  };
  const current = libs.find((l) => l.id === lib);
  return (
    <Field label="Share across branches">
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="truncate">Signed in as {user.email}</span><button onClick={() => void supabase.auth.signOut()} className="flex items-center gap-1 hover:text-foreground"><LogOut className="size-3" />Sign out</button></div>
      {libs.length > 0 && (<>
        <select aria-label="Library" value={lib} onChange={(e) => setLib(e.target.value)} className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm">{libs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        {current && <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5 text-xs"><span>Join code: <b className="font-mono">{current.join_code}</b></span><button aria-label="Copy join code" onClick={() => { void navigator.clipboard.writeText(current.join_code); toast("Code copied"); }}><Copy className="size-3.5" /></button></div>}
        <Button size="sm" className="w-full" onClick={() => void share()}><Share2 /> Share current sign</Button>
        {signs.length === 0 ? <p className="text-center text-xs text-muted-foreground">Nothing shared yet.</p> : (
          <ul className="space-y-1.5">{signs.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
              <span className="h-8 w-2 shrink-0 rounded-sm" style={{ background: s.config.palette.primary }} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{s.name}</div><div className="text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</div></div>
              <Button size="sm" variant="secondary" onClick={() => { replace(s.config); toast(`Loaded "${s.name}"`); }}>Load</Button>
              {s.created_by === user.id && <Button size="icon" variant="ghost" aria-label="Delete shared sign" onClick={() => void del(s.id)}><Trash2 /></Button>}
            </li>))}</ul>
        )}
      </>)}
      <div className="flex gap-2"><Input placeholder="New library system name" value={newName} onChange={(e) => setNewName(e.target.value)} /><Button size="sm" variant="outline" onClick={() => void create()}>Create</Button></div>
      <div className="flex gap-2"><Input placeholder="Join code from another branch" value={code} onChange={(e) => setCode(e.target.value)} /><Button size="sm" variant="outline" onClick={() => void join()}>Join</Button></div>
    </Field>
  );
}
