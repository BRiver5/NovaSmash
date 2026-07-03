/**
 * NovaSmash design tokens.
 * Two alternating palette moods (spec §2):
 * - Hub (menu/shop):  hot pink & yellow on deep navy.
 * - Deep Space (gameplay/splash): cyan & purple on near-black.
 * Pixel font is bundled locally (Press Start 2P) — headers are UPPERCASE.
 */
import { TextStyle } from 'react-native';

export const Hub = {
  background: '#14142B',
  pink: '#F0338B',
  pinkBevel: '#B01F63',
  yellow: '#FFE94A',
  yellowBevel: '#C7B12A',
  white: '#FFFFFF',
  textDim: '#8C8CA8',
  panel: '#1E1E3F',
  panelBevel: '#0D0D1E',
  disabled: '#4A4A66',
  disabledBevel: '#33334A',
} as const;

export const Space = {
  background: '#0A0612',
  purple: '#8B2FD1',
  cyan: '#3FE0E8',
  cyanDim: '#1E7A80',
  white: '#FFFFFF',
  danger: '#FF4757',
} as const;

export const PIXEL_FONT = 'PressStart2P';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Chunky 3D button bottom "lip" height (spec §2: ~6-8px). */
export const BUTTON_LIP = 6;

export const Type: Record<string, TextStyle> = {
  h1: { fontFamily: PIXEL_FONT, fontSize: 22, color: Hub.white, letterSpacing: 1 },
  h2: { fontFamily: PIXEL_FONT, fontSize: 16, color: Hub.white },
  title: { fontFamily: PIXEL_FONT, fontSize: 12, color: Hub.white },
  body: { fontFamily: PIXEL_FONT, fontSize: 10, color: Hub.white, lineHeight: 16 },
  label: { fontFamily: PIXEL_FONT, fontSize: 8, color: Hub.textDim, lineHeight: 13 },
};

/** Deterministic decorative star field: fractions of the container, static. */
export interface StarDot {
  x: number; // 0..1
  y: number; // 0..1
  size: number; // px
  color: string;
}

export function makeStars(seed: number, count: number): StarDot[] {
  // Tiny LCG so every screen gets a stable, unique scatter without RNG at render.
  let s = seed >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const palette = ['#FFFFFF', '#8C8CA8', '#5A5A78'];
  return Array.from({ length: count }, () => ({
    x: next(),
    y: next(),
    size: next() < 0.25 ? 4 : 2,
    color: palette[Math.floor(next() * palette.length)],
  }));
}
