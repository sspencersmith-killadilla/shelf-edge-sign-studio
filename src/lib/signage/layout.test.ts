import { describe, expect, it } from "vitest";
import { snap, moveElement } from "./layout";
import { paletteFromPixels } from "./photoPalette";
import { contrastRatio } from "./contrast";

describe("snap grid", () => {
  it("snaps to quarter-inch grid", () => { expect(snap(1.13, 0.25)).toBe(1.25); expect(snap(-0.6, 0.5)).toBe(-0.5); });
  it("grid 0 leaves position free", () => { expect(snap(1.137, 0)).toBe(1.137); });
  it("moveElement stores snapped offsets per element", () => {
    expect(moveElement({ title: { x: 0, y: 0, s: 1.5 } }, "title", 0.9, 2.1, 0.5)).toEqual({ title: { x: 1, y: 2, s: 1.5 } });
  });
});

describe("photo palette", () => {
  it("derives readable colors from a blue/orange photo", () => {
    const px: number[] = [];
    for (let i = 0; i < 300; i++) px.push(20, 60, 160, 255);
    for (let i = 0; i < 100; i++) px.push(240, 130, 20, 255);
    for (let i = 0; i < 200; i++) px.push(230, 235, 240, 255);
    const p = paletteFromPixels(px);
    expect(contrastRatio(p.text, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.background, p.primary)).toBeGreaterThanOrEqual(4.5);
    const [r, , b] = [1, 3, 5].map((i) => parseInt(p.primary.slice(i, i + 2), 16));
    expect(b!).toBeGreaterThan(r!);
  });
});
