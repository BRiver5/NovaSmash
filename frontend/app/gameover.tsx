/**
 * Game Over (spec §5.6): run summary with animated coin count-up, NEW BEST
 * badge when earned, Retry / Upgrades / Main Menu. The run was already
 * persisted by the play screen before navigating here.
 */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { PixelText } from '@/components/ui/PixelText';
import { StarField } from '@/components/ui/StarField';
import { Hub, Space, Spacing } from '@/constants/theme';
import { useRunStore } from '@/stores/useRunStore';
import { formatSurvival } from '@/utils/format';

function StatRow({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Hub.panel,
        borderBottomWidth: 4,
        borderBottomColor: Hub.panelBevel,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
      }}
    >
      <PixelText size={9} color={Hub.textDim}>
        {label}
      </PixelText>
      <PixelText size={9} color={Hub.white}>
        {value}
      </PixelText>
    </Animated.View>
  );
}

export default function GameOver() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lastRun = useRunStore((s) => s.lastRun);
  const isNewBest = useRunStore((s) => s.lastRunIsNewBest);

  // Coin count-up animation (spec §8).
  const [shownCoins, setShownCoins] = useState(0);
  const coins = lastRun?.coinsEarned ?? 0;
  useEffect(() => {
    if (coins === 0) return;
    const duration = 900;
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setShownCoins(Math.round(coins * p));
      if (p >= 1) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [coins]);

  // Deep-linked here without a run (shouldn't happen in-flow) — go home.
  useEffect(() => {
    if (!lastRun) router.replace('/menu');
  }, [lastRun, router]);
  if (!lastRun) return <View style={{ flex: 1, backgroundColor: Space.background }} />;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Space.background,
        paddingTop: insets.top + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.md,
        paddingHorizontal: Spacing.md,
      }}
    >
      <StarField seed={21} />
      <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
        <PixelText size={20} color={Space.danger} center>
          GAME OVER
        </PixelText>
        {isNewBest && (
          <Animated.View
            entering={ZoomIn.delay(500).duration(300)}
            style={{
              backgroundColor: Hub.yellow,
              paddingVertical: 6,
              paddingHorizontal: 12,
              marginTop: Spacing.md,
            }}
          >
            <PixelText size={9} color={Hub.background}>
              NEW BEST!
            </PixelText>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
        <PixelText size={8} color={Hub.textDim} center>
          COINS EARNED
        </PixelText>
        <PixelText size={28} color={Hub.yellow} center style={{ marginTop: 6 }}>
          {shownCoins}
        </PixelText>
      </Animated.View>

      <StatRow label="SURVIVAL TIME" value={formatSurvival(lastRun.survivalSeconds)} delay={300} />
      <StatRow label="ASTEROIDS SMASHED" value={String(lastRun.asteroidsDestroyed)} delay={400} />

      <View style={{ flex: 1 }} />

      <View style={{ gap: Spacing.md }}>
        <ChunkyButton label="RETRY" onPress={() => router.replace('/play')} fontSize={14} />
        <ChunkyButton
          label="UPGRADES"
          color={Hub.panel}
          bevelColor={Hub.panelBevel}
          onPress={() => router.push('/upgrades')}
        />
        <ChunkyButton
          label="MAIN MENU"
          color={Hub.panel}
          bevelColor={Hub.panelBevel}
          onPress={() => router.replace('/menu')}
        />
      </View>
    </View>
  );
}
