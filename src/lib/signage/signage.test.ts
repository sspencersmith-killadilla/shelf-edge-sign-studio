import { describe, it, expect } from "vitest";
import { clampInches, swapOrientation, exportPixelRatio } from "./size";
import { parseImport } from "./storage";

describe("size rules", () => {
  it("landscape swaps 12x18 to 18x12", () => expect(swapOrientation(12, 18, "landscape")).toEqual({ width: 18, height: 12 }));
  it("portrait keeps the long side vertical", () => expect(swapOrientation(18, 12, "portrait")).toEqual({ width: 12, height: 18 }));
  it("custom size clamps to 3–48 inches", () => { expect(clampInches(1)).toBe(3); expect(clampInches(60)).toBe(48); expect(clampInches(10)).toBe(10); });
  it("12x18 exports at full 300 DPI (3600x5400 px)", () => {
    const r = exportPixelRatio(12, 18);
    expect(r.capped).toBe(false);
    expect(Math.round(12 * 96 * r.ratio)).toBe(3600);
    expect(Math.round(18 * 96 * r.ratio)).toBe(5400);
  });
  it("48-inch signs are capped below browser limits", () => expect(exportPixelRatio(48, 48).capped).toBe(true));
});

describe("JSON import", () => {
  it("rejects files that aren't a sign list", () => expect(() => parseImport('{"foo":1}')).toThrow());
  it("rejects a sign with no name", () => expect(() => parseImport('[{"config":{}}]')).toThrow());
  it("accepts a valid sign and fills defaults", () => {
    const [s] = parseImport('[{"name":"Aisle 1","config":{"title":"X"}}]');
    expect(s?.name).toBe("Aisle 1");
    expect(s?.config.title).toBe("X");
    expect(s?.config.width).toBe(12);
  });
});
