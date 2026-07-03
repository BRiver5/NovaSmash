/**
 * Insights (spec §5.7): charts built from REAL local run history — survival
 * per run (line), coins per run (line), asteroids per run (bar) — plus
 * lifetime summary cards. A friendly empty state shows for brand-new players.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ChartFrame } from '@/components/charts/ChartFrame';
import { PixelBarChart } from '@/components/charts/PixelBarChart';
import { PixelLineChart } from '@/components/charts/PixelLineChart';
import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { HubScreen } from '@/components/ui/HubScreen';
import { PixelText } from '@/components/ui/PixelText';
import { Hub, Space, Spacing } from '@/constants/theme';
import { useRunStore } from '@/stores/useRunStore';
import { formatSurvival, shortDate } from '@/utils/format';

function SummaryCard({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(80 * index).duration(350)}
      style={{
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: Hub.panel,
        borderBottomWidth: 4,
        borderBottomColor: Hub.panelBevel,
        padding: Spacing.md,
      }}
    >
      <PixelText size={7} color={Hub.textDim}>
        {label}
      </PixelText>
      <PixelText size={13} color={Hub.white} style={{ marginTop: 8 }}>
        {value}
      </PixelText>
    </Animated.View>
  );
}

export default function Insights() {
  const router = useRouter();
  const runs = useRunStore((s) => s.runs);
  const stats = useRunStore((s) => s.stats);
  const loadHistory = useRunStore((s) => s.loadHistory);

  // Refresh from SQLite every time the screen gains focus.
  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  if (runs.length === 0) {
    return (
      <HubScreen title="INSIGHTS" starSeed={17}>
        <View style={{ flex: 1, justifyContent: 'center', gap: Spacing.lg }}>
          <PixelText size={11} color={Hub.white} center>
            NO RUNS YET
          </PixelText>
          <PixelText size={8} color={Hub.textDim} center>
            PLAY YOUR FIRST RUN TO SEE STATS HERE
          </PixelText>
          <ChunkyButton label="START" onPress={() => router.replace('/play')} />
        </View>
      </HubScreen>
    );
  }

  const labels = runs.map((r) => shortDate(r.createdAt));

  return (
    <HubScreen title="INSIGHTS" scroll starSeed={17}>
      {/* summary cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <SummaryCard index={0} label="BEST SURVIVAL" value={formatSurvival(stats?.bestSurvivalSeconds ?? 0)} />
        <SummaryCard index={1} label="TOTAL RUNS" value={String(stats?.totalRuns ?? 0)} />
        <SummaryCard index={2} label="ASTEROIDS SMASHED" value={String(stats?.totalAsteroidsDestroyed ?? 0)} />
        <SummaryCard index={3} label="LIFETIME COINS" value={String(stats?.lifetimeCoinsEarned ?? 0)} />
      </View>

      <ChartFrame title="SURVIVAL TIME PER RUN" accent={Space.cyan} index={1}>
        {(w) => (
          <PixelLineChart
            width={w}
            values={runs.map((r) => r.survivalSeconds)}
            labels={labels}
            color={Space.cyan}
            formatValue={formatSurvival}
          />
        )}
      </ChartFrame>

      <ChartFrame title="COINS EARNED PER RUN" accent={Hub.yellow} index={2}>
        {(w) => (
          <PixelLineChart
            width={w}
            values={runs.map((r) => r.coinsEarned)}
            labels={labels}
            color={Hub.yellow}
          />
        )}
      </ChartFrame>

      <ChartFrame title="ASTEROIDS DESTROYED PER RUN" accent={Hub.pink} index={3}>
        {(w) => (
          <PixelBarChart
            width={w}
            values={runs.map((r) => r.asteroidsDestroyed)}
            labels={labels}
            color={Hub.pink}
          />
        )}
      </ChartFrame>
    </HubScreen>
  );
}
