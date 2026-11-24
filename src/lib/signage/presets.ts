import type { CollectionId, Palette, SignConfig, TemplateId } from "./types";

export const ICONS = ["BookOpen", "Library", "Compass", "Search", "Star", "Clock", "BookMarked", "Users", "Sparkles", "Landmark", "TreePine", "Map"] as const;

export const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: "civic", name: "Modern Civic Bold", blurb: "Header band, huge call numbers" },
  { id: "editorial", name: "Editorial Classic", blurb: "Double frame, serif heading" },
  { id: "wayfinding", name: "Wayfinding Split", blurb: "Side bar with aisle & arrow" },
  { id: "playful", name: "Playful Geometric", blurb: "Rounded shapes, badge" },
  { id: "overlay", name: "Full-Bleed Image", blurb: "Photo with glass card" },
];

interface Collection { id: CollectionId; name: string; title: string; range: string; sub: string; icon: string; palette: Palette; template: TemplateId; headingFont: string; bodyFont: string }

export const COLLECTIONS: Collection[] = [
  { id: "adult-fiction", name: "Adult Fiction", title: "ADULT FICTION", range: "FIC A – FIC G", sub: "Authors A through G\nMystery • Literary • Romance", icon: "BookOpen", palette: { primary: "#1B2A4A", accent: "#C9A14A", text: "#1B2A4A", background: "#FBF8F1" }, template: "civic", headingFont: "Montserrat", bodyFont: "Inter" },
  { id: "adult-nonfiction", name: "Adult Nonfiction", title: "ADULT NONFICTION", range: "000 – 399", sub: "000 Computers & Information\n100 Philosophy & Psychology\n200 Religion\n300 Social Sciences", icon: "Library", palette: { primary: "#3F5873", accent: "#C8643B", text: "#22303F", background: "#F5F3EF" }, template: "wayfinding", headingFont: "Space Grotesk", bodyFont: "DM Sans" },
  { id: "young-adult", name: "Young Adult", title: "YOUNG ADULT", range: "YA FIC A – M", sub: "Fantasy • Sci-Fi • Contemporary", icon: "Sparkles", palette: { primary: "#0F8B8D", accent: "#F2705E", text: "#10333A", background: "#F2FBFA" }, template: "civic", headingFont: "Oswald", bodyFont: "DM Sans" },
  { id: "mid-grade", name: "Mid Grade", title: "MID GRADE", range: "J FIC A – Z", sub: "Chapter books for ages 8–12", icon: "Compass", palette: { primary: "#1F4FD1", accent: "#F5A623", text: "#132A6B", background: "#F4F7FF" }, template: "playful", headingFont: "Fredoka", bodyFont: "DM Sans" },
  { id: "kids", name: "Kids Books", title: "PICTURE BOOKS", range: "E A – M", sub: "Easy readers & picture books", icon: "Star", palette: { primary: "#14915B", accent: "#FFD23F", text: "#0D3B27", background: "#F3FBF5" }, template: "playful", headingFont: "Fredoka", bodyFont: "Fredoka" },
  { id: "genealogy", name: "Genealogy", title: "GENEALOGY", range: "GEN 929.1 – 976.4", sub: "Family histories\nCounty records • Cemetery indexes", icon: "TreePine", palette: { primary: "#6E1F2E", accent: "#B8955A", text: "#3D1219", background: "#F6EEDC" }, template: "editorial", headingFont: "Playfair Display", bodyFont: "Lora" },
  { id: "holds", name: "Holds", title: "HOLDS", range: "HOLDS A – Z", sub: "Shelved by patron last name", icon: "Clock", palette: { primary: "#2B2F33", accent: "#0A5EB0", text: "#1C1F22", background: "#FFFFFF" }, template: "civic", headingFont: "Inter", bodyFont: "Inter" },
];

export function getCollection(id: CollectionId) { return COLLECTIONS.find((c) => c.id === id) ?? COLLECTIONS[0]!; }

export function applyCollection(cfg: SignConfig, id: CollectionId): SignConfig {
  const c = getCollection(id);
  return { ...cfg, collection: id, title: c.title, range: c.range, subRanges: c.sub, icon: c.icon, palette: { ...c.palette }, template: c.template, headingFont: c.headingFont, bodyFont: c.bodyFont, tint: c.palette.primary };
}

export const DEFAULT_CONFIG: SignConfig = applyCollection({
  collection: "adult-fiction", template: "civic", showHeader: true, header: "ROY & HELEN HALL MEMORIAL LIBRARY",
  title: "", range: "", subRanges: "", showAisle: true, aisle: "AISLE 04", showZone: true, zone: "2ND FLOOR • WEST WING",
  arrow: "right", footer: "Need help? Ask at the Reference Desk", showIcon: true, icon: "BookOpen",
  palette: { primary: "#000", accent: "#000", text: "#000", background: "#fff" }, headingFont: "Inter", bodyFont: "Inter",
  titleScale: 1, rangeScale: 1, bodyScale: 1, align: "center", image: null, imageFit: "cover", focal: "center",
  tint: "#000000", tintOpacity: 0.45, blur: 0, sizePreset: "end-panel", width: 12, height: 18, padding: 1, frame: "none",
}, "adult-fiction");
