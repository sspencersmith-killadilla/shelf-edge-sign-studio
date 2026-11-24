import { DEFAULT_CONFIG } from "./presets";
import type { SavedSign } from "./types";

const KEY = "signage-studio:saved";

export function loadSaved(): SavedSign[] {
  try { return parseImport(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function persistSaved(list: SavedSign[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

/** Validates JSON from export files; fills any missing settings with defaults. Throws on bad input. */
export function parseImport(text: string): SavedSign[] {
  const data: unknown = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data as { signs?: unknown })?.signs;
  if (!Array.isArray(arr)) throw new Error("File doesn't contain a list of signs");
  return arr.map((raw, i) => {
    const s = raw as Partial<SavedSign>;
    if (!s || typeof s.name !== "string" || typeof s.config !== "object" || !s.config) throw new Error(`Sign #${i + 1} is invalid`);
    return { id: typeof s.id === "string" ? s.id : `imp-${Date.now()}-${i}`, name: s.name, savedAt: typeof s.savedAt === "number" ? s.savedAt : Date.now(), config: { ...DEFAULT_CONFIG, ...s.config } };
  });
}

const BRAND_KEY = "signage-studio:brand";
export interface Brand { header: string; footer: string }
export function loadBrand(): Brand | null { try { const b = JSON.parse(localStorage.getItem(BRAND_KEY) ?? "null"); return b && typeof b.header === "string" ? b : null; } catch { return null; } }
export function persistBrand(b: Brand) { localStorage.setItem(BRAND_KEY, JSON.stringify(b)); }
