import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Wording } from "./wording.server";

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");

export const suggestSignWording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { collection: string; range: string; readers: string }) => {
    const v = { collection: clip(d?.collection, 120), range: clip(d?.range, 120), readers: clip(d?.readers, 160) };
    if (!v.collection || !v.range || !v.readers) throw new Error("Fill in the collection, range and readers.");
    return v;
  })
  .handler(async ({ data }): Promise<{ ok: true; wording: Wording } | { ok: false; error: string }> => {
    const { suggestWording } = await import("./wording.server");
    try { return { ok: true, wording: await suggestWording(data) }; }
    catch (e) {
      const status = (e as { statusCode?: number; status?: number }).statusCode ?? (e as { status?: number }).status;
      console.error("suggestWording failed", status, e);
      if (status === 402) return { ok: false, error: "Your workspace is out of AI credits. Add credits in Settings → Plans & credits." };
      if (status === 429) return { ok: false, error: "Too many requests right now. Wait a minute and try again." };
      if (status === 403) return { ok: false, error: "AI access is blocked for this workspace." };
      return { ok: false, error: "Couldn't get suggestions. Try again in a moment." };
    }
  });
