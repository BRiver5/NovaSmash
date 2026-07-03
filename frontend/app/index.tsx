/**
 * Splash: pixel NovaSmash wordmark on deep-space black, tagline, star shimmer.
 * Auto-advances to the menu after ~1.6s, or immediately on tap (spec §5.1).
 */
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PixelText } from '@/components/ui/PixelText';
import { StarField } from '@/components/ui/StarField';
import { Hub, Space } from '@/constants/theme';

function ShimmerStar({ left, top, size, delay }: { left: number; top: number; size: number; delay: number }) {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 + delay, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.2, { duration: 500 + delay, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: `${left}%`, top: `${top}%` },
        style,
      ]}
    >
      {/* pixel 4-point starburst */}
      <View style={{ width: size * 3, height: size * 3 }}>
        <View style={{ position: 'absolute', left: size, top: 0, width: size, height: size * 3, backgroundColor: Space.purple }} />
        <View style={{ position: 'absolute', left: 0, top: size, width: size * 3, height: size, backgroundColor: Space.purple }} />
      </View>
    </Animated.View>
  );
}

export default function Splash() {
  const router = useRouter();
  const navigated = useRef(false);

  const go = () => {
    if (navigated.current) return;
    navigated.current = true;
    router.replace('/menu');
  };

  useEffect(() => {
    const t = setTimeout(go, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={{ flex: 1, backgroundColor: Space.background }} onPress={go}>
      <StarField seed={42} count={40} />
      <ShimmerStar left={12} top={16} size={6} delay={0} />
      <ShimmerStar left={78} top={12} size={4} delay={220} />
      <ShimmerStar left={70} top={70} size={5} delay={120} />
      <ShimmerStar left={16} top={76} size={4} delay={320} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center' }}>
          <PixelText size={30} color={Hub.pink} center>
            NOVA
          </PixelText>
          <PixelText size={30} color={Hub.yellow} center>
            SMASH
          </PixelText>
          <View style={{ height: 24 }} />
          <PixelText size={8} color={Space.cyan} center>
            NO ASTEROID CAN STOP YOU
          </PixelText>
        </Animated.View>
      </View>
    </Pressable>
  );
}
