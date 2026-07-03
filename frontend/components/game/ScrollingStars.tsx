/**
 * Endless downward-scrolling star background for gameplay: two stacked
 * star layers looped with reanimated. Runs on the UI thread — no JS-frame cost.
 */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { makeStars } from '@/constants/theme';

function StarLayer({ seed }: { seed: number }) {
  const stars = makeStars(seed, 26);
  return (
    <View style={StyleSheet.absoluteFill}>
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

export function ScrollingStars({ height }: { height: number }) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(height, { duration: 14000, easing: Easing.linear }),
      -1,
    );
  }, [height, offset]);

  const styleA = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));
  const styleB = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value - height }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styleA]}>
        <StarLayer seed={7} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styleB]}>
        <StarLayer seed={13} />
      </Animated.View>
    </View>
  );
}
