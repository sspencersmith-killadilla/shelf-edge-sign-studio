import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in · Library Signage Studio" },
    { name: "description", content: "Sign in to share sign designs across your library branches." },
    { property: "og:title", content: "Sign in · Library Signage Studio" },
    { property: "og:description", content: "Sign in to share sign designs across your library branches." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

const G = <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error; toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error; nav({ to: "/" });
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Sign in failed"); } finally { setBusy(false); }
  };
  const social = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Sign in failed"); return; }
    if (r.redirected) return;
    nav({ to: "/" });
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Library className="size-4" /></span><span className="font-display font-bold">Signage Studio</span></div>
        <div><h1 className="font-display text-xl font-bold">{mode === "in" ? "Sign in" : "Create an account"}</h1><p className="text-sm text-muted-foreground">Share sign designs with every branch in your library system.</p></div>
        <div className="grid gap-2">
          <Button type="button" variant="outline" className="border-[#747775] bg-[#FFFFFF] text-[#1F1F1F] hover:bg-[#F2F2F2]" onClick={() => void social("google")}>{G} Continue with Google</Button>
          <Button type="button" variant="outline" onClick={() => void social("lovable")}><LovableMark /> Continue with Lovable</Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1"><Label htmlFor="em">Email</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
        </form>
        <div className="flex justify-between text-sm">
          <button className="text-primary hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create an account" : "I have an account"}</button>
          <Link to="/" className="text-muted-foreground hover:underline">Back to studio</Link>
        </div>
      </div>
    </div>
  );
}
