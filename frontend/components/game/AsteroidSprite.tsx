/**
 * Pixel-art asteroid rendered from an 8x8 block grid (3 shape variants).
 * Damaged asteroids flush toward red as HP drops.
 */
import { memo } from 'react';
import { View } from 'react-native';

// Legend: .=empty  O=outline  R=rock  H=highlight
const VARIANTS = [
  [
    '..OOOO..',
    '.ORRRRO.',
    'ORHRRRRO',
    'ORRRRHRO',
    'ORRRRRRO',
    'ORHRRRRO',
    '.ORRRRO.',
    '..OOOO..',
  ],
  [
    '...OOO..',
    '..ORRRO.',
    '.ORRHRRO',
    'ORRRRRRO',
    'ORHRRRO.',
    'ORRRRRO.',
    '.ORRRO..',
    '..OOO...',
  ],
  [
    '..OOO...',
    '.ORRROO.',
    'ORRHRRRO',
    'ORRRRRRO',
    '.ORRRHRO',
    '.ORRRRRO',
    '..ORRRO.',
    '...OOO..',
  ],
];

const ROCK = '#6E6E8A';
const OUTLINE = '#3A3A55';
const HIGHLIGHT = '#9A9AB8';
const DAMAGED_ROCK = '#8A5A5A';

interface Props {
  variant: number;
  size: number; // px (diameter)
  /** Quantized damage flag (not raw hp) so memo() actually caches the cells. */
  damaged: boolean;
}

/**
 * NOTE: rotation is deliberately NOT a prop — the parent applies it on a
 * cheap wrapper transform. Passing per-frame rotation here would defeat
 * memoization and re-create all ~40 cell Views for every asteroid each frame.
 */
export const AsteroidSprite = memo(function AsteroidSprite({ variant, size, damaged }: Props) {
  const grid = VARIANTS[variant % VARIANTS.length];
  const cell = size / 8;
  const rock = damaged ? DAMAGED_ROCK : ROCK;
  return (
    <View style={{ width: size, height: size }}>
      {grid.map((row, y) =>
        row.split('').map((ch, x) => {
          if (ch === '.') return null;
          const color = ch === 'O' ? OUTLINE : ch === 'H' ? HIGHLIGHT : rock;
          return (
            <View
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * cell,
                top: y * cell,
                width: cell + 0.5,
                height: cell + 0.5,
                backgroundColor: color,
              }}
            />
          );
        }),
      )}
    </View>
  );
});
