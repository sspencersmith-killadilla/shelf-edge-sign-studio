# Library End-Panel Signage Studio

A fully client-side design tool at `/` for building print-ready library shelf end-panel signs. No backend; saved signs live in the browser.

## Layout
- **Left sidebar (~380px, scrollable, collapsible)** with 4 tabs: Content, Template & Style, Size & Layout, Batch / Saved.
- **Right canvas**: neutral gray backdrop, sign rendered at true physical aspect ratio, wheel/pinch zoom + drag pan.
- **Top toolbar**: current size in inches, zoom (Fit / 50% / 75% / 100%), Safe-Zone & Bleed guide toggle, Export PNG (300 DPI), Export PDF, Print.
- Look: light civic workspace, slate borders, crisp type (Space Grotesk UI headings + IBM Plex Sans body), a single civic-blue accent.

## Collections (7 presets, all editable)
Adult Fiction (navy/gold), Adult Nonfiction (slate blue/terracotta), Young Adult (teal/coral), Mid Grade (cobalt/amber), Kids Books (emerald/sunshine), Genealogy (burgundy/cream), Holds (charcoal/civic blue). Each sets title, call ranges, sub-ranges, icon, palette, and a suggested template.

## 5 Templates
1. Modern Civic Bold — header band, oversized call-number hero, branded footer.
2. Editorial Classic — double-border frame, serif heading, divider rules.
3. Wayfinding Split — left color bar with aisle number + arrow, right content stack.
4. Playful Geometric — rounded accent shapes, call-number badge, icon header.
5. Full-Bleed Image Overlay — edge-to-edge photo with frosted card / gradient scrim.

Every template scales by physical size (units in inches → px at a base scale) so it works from 6"×18" narrow panels to 18"×24" posters.

## Editor controls
- **Content**: library header (toggle, default "ROY & HELEN HALL MEMORIAL LIBRARY"), title, primary range, multiline sub-ranges, aisle (toggle), floor/zone (toggle), arrow (None/Left/Right/Up/Down/Both), footer note, icon picker (~12 curated Lucide icons, toggle).
- **Template & Style**: thumbnail template picker; primary/accent/text/background pickers + Reset to collection default; heading & body fonts from the 10 Google Fonts listed (loaded on demand via link tags); sliders for title, call-number and body size; alignment; background image drag-drop/upload (PNG/JPG/WebP, stored as data URL), Remove, fit (Cover/Contain/Tile), focal position, overlay tint, opacity 0–95%, blur 0–20px.
- **Size & Layout**: Letter, Tabloid, 12×18, 6×18, 18×24, Custom (3–48" validated), orientation swap, padding slider, frame (None/Thin/Thick/Double).
- **Batch / Saved**: save with name, list with Load / Duplicate / Delete, JSON export & import of all saved signs (validated on import).

## Export & print
- PNG: `html-to-image` renders the sign node at exact inches × 300 px (pixelRatio computed), fonts embedded.
- PDF: `jsPDF` page sized in inches, the 300 DPI image placed full page.
- Print: `@media print` hides all UI, sets `@page` size to the sign dimensions, prints the sign at 100%.
- Guides (safe zone 0.25", bleed 0.125") are never included in exports.

## Technical details
- Packages: `html-to-image`, `jspdf`.
- Files: `src/lib/signage/{types,presets,fonts,storage}.ts`, `src/components/studio/*` (Sidebar tabs, Canvas, Toolbar, `templates/*.tsx`, `SignRenderer.tsx`), state via a single `useReducer` in the index route.
- localStorage read in `useEffect` only (SSR-safe); export libs dynamically imported in click handlers.
- Very large sizes (48") cap pixelRatio to keep canvas under browser limits, with a toast note.
- Small vitest tests for: orientation swap, custom size clamping (3–48"), 300 DPI pixel math, JSON import validation.
- Route head() with app-specific title/description.
