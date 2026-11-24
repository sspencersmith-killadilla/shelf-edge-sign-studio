export const FONTS = ["Inter", "Montserrat", "Playfair Display", "Merriweather", "Oswald", "Space Grotesk", "Fredoka", "Lora", "DM Sans", "Roboto Slab"];

export function fontStack(f: string) {
  const serif = ["Playfair Display", "Merriweather", "Lora", "Roboto Slab"].includes(f);
  return `"${f}", ${serif ? "Georgia, serif" : "system-ui, sans-serif"}`;
}

export function ensureFont(f: string) {
  if (typeof document === "undefined") return;
  const id = "gf-" + f.replace(/\s+/g, "-");
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet"; l.crossOrigin = "anonymous";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(l);
}
