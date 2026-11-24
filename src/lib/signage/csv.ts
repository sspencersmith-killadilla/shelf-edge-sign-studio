import type { SavedSign, SignConfig } from "./types";

/** Minimal RFC4180 parser: quoted fields, escaped quotes, embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (q) throw new Error("Unclosed quote in CSV");
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

const COLS: Record<string, keyof SignConfig> = { title: "title", range: "range", "call number": "range", "sub-ranges": "subRanges", subranges: "subRanges", genres: "subRanges", aisle: "aisle", zone: "zone", floor: "zone", footer: "footer", header: "header" };

/** Creates one saved sign per CSV row, based on the current design. Needs a header row with at least "range". */
export function signsFromCsv(text: string, base: SignConfig): { signs: SavedSign[]; skipped: number } {
  const [head, ...rows] = parseCsv(text);
  if (!head) throw new Error("CSV is empty");
  const keys = head.map((h) => COLS[h.trim().toLowerCase()]);
  if (!keys.includes("range")) throw new Error('CSV needs a "range" column');
  let skipped = 0; const now = Date.now();
  const signs: SavedSign[] = [];
  rows.forEach((r, i) => {
    const cfg: SignConfig = { ...base };
    keys.forEach((k, j) => { const v = r[j]?.trim(); if (k && v) (cfg as unknown as Record<string, string>)[k] = k === "subRanges" ? v.replace(/\s*\|\s*/g, "\n") : v; });
    if (!r[keys.indexOf("range")]?.trim()) { skipped++; return; }
    signs.push({ id: `csv-${now}-${i}`, name: `${cfg.title} ${cfg.range}`.trim(), savedAt: now, config: cfg });
  });
  return { signs, skipped };
}
