/**
 * Ship Select (spec §5.3): horizontal carousel with chunky arrows, cosmetic
 * skins only, animated preview (idle hover bob), persists selection.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { HubScreen } from '@/components/ui/HubScreen';
import { PixelShip } from '@/components/ui/PixelShip';
import { PixelText } from '@/components/ui/PixelText';
import { SHIP_SKINS } from '@/constants/gameConfig';
import { Hub, Space, Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/stores/usePlayerStore';

function Arrow({ dir, onPress }: { dir: -1 | 1; onPress: () => void }) {
  // Chunky pixel arrow built from stacked bars.
  const bars = [16, 26, 36, 26, 16];
  return (
    <Pressable onPress={onPress} hitSlop={16} style={{ padding: 8 }}>
      <View style={{ alignItems: dir === 1 ? 'flex-start' : 'flex-end' }}>
        {bars.map((w, i) => (
          <View key={i} style={{ width: w, height: 7, backgroundColor: Space.cyan, marginVertical: 0.5 }} />
        ))}
      </View>
    </Pressable>
  );
}

export default function Ships() {
  const selectShip = usePlayerStore((s) => s.selectShip);
  const selectedShip = usePlayerStore((s) => s.player?.selectedShip ?? 'sharkfin');
  const startIdx = Math.max(0, SHIP_SKINS.findIndex((s) => s.id === selectedShip));
  const [idx, setIdx] = useState(startIdx);
  const skin = SHIP_SKINS[idx];
  const isSelected = skin.id === selectedShip;

  // Idle hover bob for the preview.
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  const step = (d: -1 | 1) => setIdx((i) => (i + d + SHIP_SKINS.length) % SHIP_SKINS.length);

  return (
    <HubScreen title="SELECT SHIP" scroll={false} starSeed={9}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <PixelText size={12} color={Space.cyan} center>
          {skin.name}
        </PixelText>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: Spacing.xl,
            paddingHorizontal: Spacing.sm,
          }}
        >
          <Arrow dir={-1} onPress={() => step(-1)} />
          <Animated.View key={skin.id} entering={ZoomIn.duration(220)} style={bobStyle}>
            <PixelShip skin={skin} size={120} />
          </Animated.View>
          <Arrow dir={1} onPress={() => step(1)} />
        </View>

        {/* carousel dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: Spacing.xl }}>
          {SHIP_SKINS.map((s, i) => (
            <View
              key={s.id}
              style={{
                width: 10,
                height: 10,
                backgroundColor: i === idx ? Hub.yellow : Hub.disabled,
              }}
            />
          ))}
        </View>

        <ChunkyButton
          label={isSelected ? 'SELECTED' : 'SELECT'}
          disabled={isSelected}
          onPress={() => void selectShip(skin.id)}
        />
      </View>
    </HubScreen>
  );
}
