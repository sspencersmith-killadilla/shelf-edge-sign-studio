# Making Signage Studio ready for libraries worldwide

The studio works for one library today. Libraries everywhere would still need the items below, grouped by priority.

## 1. Must-have before wide release
- **Library branding setup:** a first-run "Your Library" screen for name, logo upload, and brand colors. Every new sign uses them, so the Roy & Helen Hall name is no longer the default.
- **Classification systems:** presets for Dewey (current), Library of Congress, and a generic "custom labels" set, plus optional BISAC-style genre names. Many academic and international libraries use LC or local schemes.
- **Metric and international paper sizes:** A4, A3, A2, and A1, with a choice of inches or centimeters. The sign size itself stays exact.
- **Accessibility checks:** a contrast warning (WCAG AA) when text and background colors are too close, a minimum text size hint based on viewing distance, and an optional Braille/tactile note for ADA signs.
- **Language and text support:** the interface in English, Spanish, and French to start. Fonts that cover accented letters, Cyrillic, Greek, and CJK (Noto family). Right-to-left layout for Arabic and Hebrew signs.
- **Test the untested flows:** PDF download, print, saving and loading, file sharing, and background photos.

## 2. Batch production (big time saver)
- **Spreadsheet import:** upload a CSV (aisle, range, sub-ranges) to create a whole stack run at once.
- **Batch export:** all saved signs as one multi-page PDF or a ZIP of PNGs.
- **Double-sided panels:** front and back versions of each sign.

## 3. Sharing across branches (needs Lovable Cloud)
- Optional accounts so a library system can share templates and brand settings between branches and staff.
- A public template gallery that libraries can contribute to.
- Everything still works offline and without signing in.

## 4. Polish
- Undo and redo, plus keyboard shortcuts.
- QR code block (catalog link, events page).
- Printer guidance: crop marks, bleed export option, and CMYK-safe color warnings for print shops.
- Works on tablets, and a short guided tour on first visit.
- A privacy note: no patron data is collected and everything stays on the device.

## Suggested order
Section 1 first, then CSV batch import and multi-page PDF. Cloud sharing only if you want branch-wide collaboration.

## Technical details
- Branding and unit preferences stored in localStorage alongside saved signs; units convert at the UI edge so the internal model stays in inches.
- i18n via a small message dictionary; RTL via `dir` on the sign root.
- Contrast check uses the WCAG relative luminance formula, covered by vitest.
- CSV parsing with papaparse; multi-page PDF via jsPDF addPage; ZIP via jszip.
- Cloud features would break the "100% client-side" rule and require updating AGENTS.md.
