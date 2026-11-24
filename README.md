# Shelf Edge Sign Studio

Build a complete, print-ready **Library End-Panel Signage Studio** web application for public libraries

### 1. Core Layout & UX
- **Two-Pane Studio Interface:**
  - **Left Sidebar (Collapsible/Scrollable Editor Panel, ~380px wide):** Organized into clean tabs: **Content**, **Template & Style**, **Size & Layout**, and **Batch / Saved**.
  - **Right Main Canvas (Live Preview Area):** Centered, zoomable, pan-friendly live preview of the sign rendered at exact physical aspect ratio, with a top toolbar showing current dimensions (in inches), zoom controls (Fit, 50%, 75%, 100%), toggle for **Print Safe-Zone / Bleed Guides**, and primary **Export PNG (300 DPI)**, **Export PDF**, and **Print** buttons.
- **UI Aesthetic:** Clean, modern civic design tool (light mode workspace with subtle slate borders, crisp typography, and a neutral gray canvas backdrop so the sign pops).

### 2. Pre-Built Collections & 5 Distinct Templates
- **Collection Presets (7 Quick-Load Profiles):** Clicking a preset populates sensible default titles, call number ranges, icons, and color palettes (all fully editable):
  1. **Adult Fiction** (e.g., `FIC A – FIC G`, deep navy & warm gold)
  2. **Adult Nonfiction** (e.g., `000 – 399`, slate blue & terracotta)
  3. **Young Adult** (e.g., `YA FIC A – M`, vibrant teal & coral)
  4. **Mid Grade** (e.g., `J FIC A – Z`, energetic cobalt & amber)
  5. **Kids Books** (e.g., `E A – M` / Picture Books, playful emerald & sunshine yellow)
  6. **Genealogy** (e.g., `GEN 929.1 – 976.4`, heritage burgundy & cream)
  7. **Holds** (e.g., `HOLDS A – Z`, high-contrast charcoal & McKinney civic blue)
- **5 Switchable Visual Templates:** Any collection can be rendered in any of these 5 distinct layouts:
  1. **Modern Civic Bold:** High-contrast top header band, oversized call-number hero block, clean footer with library branding.
  2. **Editorial Classic:** Refined double-border frame, serif display heading, subtle divider rules, ideal for Genealogy & Fiction.
  3. **Wayfinding Split:** Asymmetric vertical color bar on the left with large aisle number/arrow, crisp right-hand content stack.
  4. **Playful Geometric:** Rounded accent shapes, bold badge for call numbers, friendly icon header—ideal for Kids & Mid Grade.
  5. **Full-Bleed Image Overlay:** Edge-to-edge background photo with a frosted/tinted glass card or gradient scrim for maximum legibility.

### 3. Editor Controls (Left Sidebar)
- **Tab 1: Content**
  - Library Header Text (default: `ROY & HELEN HALL MEMORIAL LIBRARY` — toggleable on/off)
  - Collection / Section Title (e.g., `ADULT FICTION`)
  - Primary Call Number Range (e.g., `A – G` or `500 – 599`)
  - Secondary Call Number / Sub-ranges (multiline support for listing multiple Dewey ranges or genres)
  - Aisle / Bay / Range Number (e.g., `AISLE 04`, toggleable)
  - Floor / Zone Tag (e.g., `2ND FLOOR • WEST WING`, toggleable)
  - Directional Arrow Selector (`None`, `Left`, `Right`, `Up`, `Down`, `Both Ways`)
  - Optional Footer Note (e.g., `"Need help? Ask at the Reference Desk"`)
  - Optional Icon Selector (curated Lucide icons for books, compass, magnifying glass, star, clock, etc., toggleable)
- **Tab 2: Template & Style**
  - 5-Template visual picker (mini thumbnail cards)
  - **Color Palette:** Primary color, Accent color, Text color, and Background color pickers + quick "Reset to Collection Default" button.
  - **Typography / Font Selection:** Load Google Fonts dynamically and allow independent selection for **Heading Font** and **Body/Call-Number Font** from a curated list: `Inter`, `Montserrat`, `Playfair Display`, `Merriweather`, `Oswald`, `Space Grotesk`, `Fredoka`, `Lora`, `DM Sans`, and `Roboto Slab`.
  - **Font Size Sliders:** Independent scale sliders for Title Size, Call Number Size, and Body/Subtitle Size, plus Alignment (`Left`, `Center`, `Right`).
  - **Background Image Upload:**
    - Drag-and-drop or file picker to upload a custom background image (PNG, JPG, WebP) with a "Remove Image" button.
    - Image Fit controls (`Cover`, `Contain`, `Tile`) and Focal Position (`Center`, `Top`, `Bottom`, `Left`, `Right`).
    - **Legibility Controls:** Overlay Tint Color picker, Overlay Opacity slider (0%–95%), and Background Blur slider (0px–20px) so text always stays ADA-compliant and readable over photos.
- **Tab 3: Size & Layout**
  - **Preset Print Sizes:**
    - Letter (`8.5" × 11"`)
    - Tabloid / Ledger (`11" × 17"`)
    - Standard End-Panel (`12" × 18"`)
    - Narrow End-Panel (`6" × 18"`)
    - Large Poster (`18" × 24"`)
    - Custom Size (numeric inputs for Width and Height in inches, 3" to 48")
  - **Orientation Toggle:** Portrait / Landscape (automatically swaps width & height).
  - **Padding / Margin Slider** and **Border / Frame Toggle** (None, Thin, Thick, Double).
- **Tab 4: Batch & Saved Signs**
  - Save current sign configuration to `localStorage` with a custom name (e.g., `"Fiction Aisle 1 (A-C)"`).
  - List of saved signs with **Load**, **Duplicate**, and **Delete** actions—making it fast to build a whole run of 20+ aisle signs with consistent branding.
  - JSON Export / Import button so staff can share template sets between computers.

### 4. Print & High-Resolution Export
- Use `html-to-image` (or `html2canvas`) and `jsPDF` so exports render at crisp **300 DPI** matching the exact selected inch dimensions, with all loaded Google Fonts and uploaded background images embedded cleanly.
- Include a `@media print` stylesheet that hides all UI chrome and prints the sign at exact size.
- Ensure the app works 100% client-side with zero backend dependencies required.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shelf-edge-sign-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e33d09d2-a3a1-4e2c-957b-9500dbfbfa00).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
