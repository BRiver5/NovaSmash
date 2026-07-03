/**
 * Gameplay (spec §5.5): full-screen canvas, live HUD (run coins + survival
 * timer), pause overlay (Resume / Quit to Menu). On death the run is
 * persisted through useRunStore and we move to the Game Over screen.
 */
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameCanvas } from '@/components/game/GameCanvas';
import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { PixelText } from '@/components/ui/PixelText';
import { Hub, Space, Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useRunStore } from '@/stores/useRunStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { RunResult } from '@/types';
import { formatSurvival } from '@/utils/format';

export default function Play() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const player = usePlayerStore((s) => s.player);
  const submitRun = useRunStore((s) => s.submitRun);
  const controlScheme = useSettingsStore((s) => s.controlScheme);

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({ time: 0, coins: 0 });
  const lastHudSecond = useRef(-1);
  const finishing = useRef(false);

  const onFrame = useCallback((elapsed: number, coins: number) => {
    // Repaint HUD at most ~5x/s — the canvas already re-renders every frame.
    const bucket = Math.floor(elapsed * 5);
    if (bucket !== lastHudSecond.current) {
      lastHudSecond.current = bucket;
      setHud({ time: elapsed, coins });
    }
  }, []);

  const onGameOver = useCallback(
    async (result: RunResult) => {
      if (finishing.current) return;
      finishing.current = true;
      await submitRun(result);
      router.replace('/gameover');
    },
    [submitRun, router],
  );

  if (!player) return <View style={{ flex: 1, backgroundColor: Space.background }} />;

  return (
    <View
      style={{ flex: 1, backgroundColor: Space.background }}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size && (
        <GameCanvas
          width={size.w}
          height={size.h}
          skinId={player.selectedShip}
          fireRateLevel={player.fireRateLevel}
          turnSpeedLevel={player.turnSpeedLevel}
          damageLevel={player.damageLevel}
          controlScheme={controlScheme}
          paused={paused}
          onFrame={onFrame}
          onGameOver={onGameOver}
        />
      )}

      {/* HUD */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + 10,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.md,
        }}
      >
        <PixelText size={10} color={Hub.yellow}>
          {hud.coins} C
        </PixelText>
        <PixelText size={10} color={Space.cyan}>
          {formatSurvival(hud.time)}
        </PixelText>
        <Pressable onPress={() => setPaused(true)} hitSlop={14}>
          {/* pixel pause icon */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <View style={{ width: 6, height: 18, backgroundColor: Hub.white }} />
            <View style={{ width: 6, height: 18, backgroundColor: Hub.white }} />
          </View>
        </Pressable>
      </View>

      {/* pause overlay */}
      {paused && (
        <View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 6, 18, 0.88)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing.xl,
          }}
        >
          <PixelText size={18} color={Hub.white} center style={{ marginBottom: Spacing.xl }}>
            PAUSED
          </PixelText>
          <View style={{ alignSelf: 'stretch', gap: Spacing.md }}>
            <ChunkyButton label="RESUME" onPress={() => setPaused(false)} />
            <ChunkyButton
              label="QUIT TO MENU"
              color={Hub.panel}
              bevelColor={Hub.panelBevel}
              onPress={() => router.replace('/menu')}
            />
          </View>
        </View>
      )}
    </View>
  );
}
