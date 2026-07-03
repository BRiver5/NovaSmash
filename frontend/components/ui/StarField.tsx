/**
 * Static decorative pixel stars (spec §2): varying sizes, low density,
 * deterministic per-screen seed, zero per-frame cost.
 */
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { makeStars } from '@/constants/theme';

interface Props {
  seed?: number;
  count?: number;
}

export function StarField({ seed = 1, count = 34 }: Props) {
  const stars = useMemo(() => makeStars(seed, count), [seed, count]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
          }}
        />
      ))}
    </View>
  );
}
