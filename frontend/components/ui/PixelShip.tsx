/**
 * Pixel-art sharkfin ship rendered from a 12x12 grid of colored squares.
 * Used at any size: gameplay sprite, ship-select preview, game-over icon.
 * Pure Views (no images) so skins recolor freely.
 */
import { memo } from 'react';
import { View } from 'react-native';

import { ShipSkin } from '@/constants/gameConfig';

// Legend: .=empty  B=body  S=stripe  F=fin(thrusters)  W=white highlight
const GRID = [
  '.....W......',
  '.....B......',
  '....BBB.....',
  '....BSB.....',
  '...BBSBB....',
  '...BBSBB....',
  '..BBBSBBB...',
  '..BBBBBBB...',
  '.BBB.B.BBB..',
  '.BB..B..BB..',
  '..F..F..F...',
  '..F.....F...',
];

interface Props {
  skin: ShipSkin;
  size: number; // rendered width/height in px
}

export const PixelShip = memo(function PixelShip({ skin, size }: Props) {
  const cell = size / 12;
  const colorFor = (ch: string): string | null => {
    switch (ch) {
      case 'B': return skin.body;
      case 'S': return skin.stripe;
      case 'F': return skin.fin;
      case 'W': return '#FFFFFF';
      default: return null;
    }
  };
  return (
    <View style={{ width: size, height: size }}>
      {GRID.map((row, y) =>
        row.split('').map((ch, x) => {
          const color = colorFor(ch);
          if (!color) return null;
          return (
            <View
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * cell,
                top: y * cell,
                width: cell + 0.5, // slight overlap kills subpixel seams
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
