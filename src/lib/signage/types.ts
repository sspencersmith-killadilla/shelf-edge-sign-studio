export type TemplateId = "civic" | "editorial" | "wayfinding" | "playful" | "overlay";
export type Arrow = "none" | "left" | "right" | "up" | "down" | "both";
export type Align = "left" | "center" | "right";
export type Frame = "none" | "thin" | "thick" | "double";
export type ImageFit = "cover" | "contain" | "tile";
export type Focal = "center" | "top" | "bottom" | "left" | "right";
export type CollectionId = "adult-fiction" | "adult-nonfiction" | "young-adult" | "mid-grade" | "kids" | "genealogy" | "holds";

export interface Palette { primary: string; accent: string; text: string; background: string }

export interface SignConfig {
  collection: CollectionId;
  template: TemplateId;
  showHeader: boolean;
  header: string;
  title: string;
  range: string;
  subRanges: string;
  showAisle: boolean;
  aisle: string;
  showZone: boolean;
  zone: string;
  arrow: Arrow;
  footer: string;
  showIcon: boolean;
  icon: string;
  palette: Palette;
  headingFont: string;
  bodyFont: string;
  titleScale: number;
  rangeScale: number;
  bodyScale: number;
  align: Align;
  image: string | null;
  imageFit: ImageFit;
  focal: Focal;
  tint: string;
  tintOpacity: number;
  blur: number;
  sizePreset: string;
  width: number;
  height: number;
  padding: number;
  frame: Frame;
}

export interface SavedSign { id: string; name: string; savedAt: number; config: SignConfig }
