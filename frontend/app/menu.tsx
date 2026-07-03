/**
 * Main menu (spec §5.2): title art, START / SHIP SELECT / UPGRADES / INSIGHTS /
 * SETTINGS, coin balance pinned top.
 */
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { HubScreen } from '@/components/ui/HubScreen';
import { PixelShip } from '@/components/ui/PixelShip';
import { PixelText } from '@/components/ui/PixelText';
import { SHIP_SKINS } from '@/constants/gameConfig';
import { Hub, Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/stores/usePlayerStore';

export default function Menu() {
  const router = useRouter();
  const selectedShip = usePlayerStore((s) => s.player?.selectedShip ?? 'sharkfin');
  const skin = SHIP_SKINS.find((s) => s.id === selectedShip) ?? SHIP_SKINS[0];

  return (
    <HubScreen showBack={false} scroll starSeed={5}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', marginTop: Spacing.lg }}>
        <PixelText size={26} color={Hub.pink}>
          NOVA
        </PixelText>
        <PixelText size={26} color={Hub.yellow}>
          SMASH
        </PixelText>
        <View style={{ marginVertical: Spacing.lg }}>
          <PixelShip skin={skin} size={72} />
        </View>
      </Animated.View>

      <View style={{ gap: Spacing.md }}>
        <Animated.View entering={FadeInDown.delay(80).duration(350)}>
          <ChunkyButton label="START" onPress={() => router.push('/play')} fontSize={16} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
          <ChunkyButton
            label="SHIP SELECT"
            onPress={() => router.push('/ships')}
            color={Hub.panel}
            bevelColor={Hub.panelBevel}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <ChunkyButton
            label="UPGRADES"
            onPress={() => router.push('/upgrades')}
            color={Hub.panel}
            bevelColor={Hub.panelBevel}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(260).duration(350)}>
          <ChunkyButton
            label="INSIGHTS"
            onPress={() => router.push('/insights')}
            color={Hub.panel}
            bevelColor={Hub.panelBevel}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(320).duration(350)}>
          <ChunkyButton
            label="SETTINGS"
            onPress={() => router.push('/settings')}
            color={Hub.panel}
            bevelColor={Hub.panelBevel}
          />
        </Animated.View>
      </View>
    </HubScreen>
  );
}
