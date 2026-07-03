/**
 * Upgrades (spec §5.4): three rows with 5 filled pixel-block level segments,
 * next-level cost from the mirrored cost table, disabled when unaffordable
 * or maxed. Purchases validate + deduct locally, then mirror to the backend.
 */
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { HubScreen } from '@/components/ui/HubScreen';
import { PixelText } from '@/components/ui/PixelText';
import {
  MAX_UPGRADE_LEVEL,
  UPGRADE_LABELS,
  UpgradeType,
} from '@/constants/gameConfig';
import { Hub, Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/stores/usePlayerStore';

const UPGRADE_ORDER: UpgradeType[] = ['fire_rate', 'turn_speed', 'damage'];

const DESCRIPTIONS: Record<UpgradeType, string> = {
  fire_rate: 'SHOOT FASTER',
  turn_speed: 'MOVE QUICKER',
  damage: 'HIT HARDER',
};

function LevelBlocks({ level }: { level: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
        <View
          key={i}
          style={{
            width: 18,
            height: 24,
            backgroundColor: i < level ? Hub.yellow : Hub.panelBevel,
            borderBottomWidth: 3,
            borderBottomColor: i < level ? Hub.yellowBevel : Hub.background,
          }}
        />
      ))}
    </View>
  );
}

function UpgradeRow({ type, index }: { type: UpgradeType; index: number }) {
  const player = usePlayerStore((s) => s.player);
  const purchase = usePlayerStore((s) => s.purchase);
  const nextCost = usePlayerStore((s) => s.nextCost);

  if (!player) return null;
  const level =
    type === 'fire_rate'
      ? player.fireRateLevel
      : type === 'turn_speed'
        ? player.turnSpeedLevel
        : player.damageLevel;
  const cost = nextCost(type);
  const maxed = level >= MAX_UPGRADE_LEVEL || cost === null;
  const affordable = !maxed && player.spaceCoins >= (cost ?? 0);

  return (
    <Animated.View
      entering={FadeInDown.delay(100 * index).duration(350)}
      style={{
        backgroundColor: Hub.panel,
        borderBottomWidth: 4,
        borderBottomColor: Hub.panelBevel,
        padding: Spacing.md,
        marginBottom: Spacing.md,
      }}
    >
      <PixelText size={11} color={Hub.white}>
        {UPGRADE_LABELS[type]}
      </PixelText>
      <PixelText size={7} color={Hub.textDim} style={{ marginTop: 4 }}>
        {DESCRIPTIONS[type]}
      </PixelText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: Spacing.md,
        }}
      >
        <LevelBlocks level={level} />
        <View style={{ width: 130 }}>
          <ChunkyButton
            label={maxed ? 'MAX' : `${cost} C`}
            fontSize={10}
            disabled={maxed || !affordable}
            onPress={() => void purchase(type)}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function Upgrades() {
  return (
    <HubScreen title="UPGRADES" scroll starSeed={11}>
      {UPGRADE_ORDER.map((t, i) => (
        <UpgradeRow key={t} type={t} index={i} />
      ))}
      <PixelText size={7} color={Hub.textDim} center style={{ marginTop: Spacing.sm }}>
        EARN SPACE COINS BY SMASHING ASTEROIDS
      </PixelText>
    </HubScreen>
  );
}
