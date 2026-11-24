import { CSS_PX_PER_IN } from "./size";

/** Rule of thumb used in wayfinding: 1 inch of letter height per 10 ft of viewing distance. Cap height ≈ 0.7 of font size. */
export function readableDistanceFt(fontSizePx: number) {
  const capIn = (fontSizePx * 0.7) / CSS_PX_PER_IN;
  return Math.round(capIn * 10);
}

const L = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
const D = "⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊"; // 0-9 (a–j)
/** Uncontracted (Grade 1) braille preview using Unicode cells. Reference only; a sign fabricator produces tactile braille. */
export function toBraille(text: string) {
  let out = "", num = false;
  for (const ch of text) {
    const c = ch.toLowerCase();
    if (/[0-9]/.test(c)) { if (!num) { out += "⠼"; num = true; } out += D[+c]; continue; }
    num = false;
    if (c >= "a" && c <= "z") out += (ch !== c ? "⠠" : "") + L[c.charCodeAt(0) - 97];
    else if (c === " ") out += "⠀";
    else if (c === "." ) out += "⠲";
    else if (c === "-" || c === "–") out += "⠤";
    else if (c === ",") out += "⠂";
  }
  return out;
}

/** Very bright, saturated screen colors (RGB) often print noticeably duller in CMYK. */
export function cmykRisk(hex: string) {
  const h = hex.replace("#", "").padEnd(6, "0");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat > 0.8 && max > 0.85;
}
