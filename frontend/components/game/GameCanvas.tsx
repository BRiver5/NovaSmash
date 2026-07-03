/**
 * Gameplay renderer: owns a GameEngine instance, advances it on a
 * requestAnimationFrame loop, and paints the normalized engine state into
 * absolutely-positioned pixel sprites. Input is two invisible press-and-hold
 * touch zones (left/right halves of the screen) — spec §4's simplest scheme.
 */
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AsteroidSprite } from '@/components/game/AsteroidSprite';
import { ScrollingStars } from '@/components/game/ScrollingStars';
import { PixelShip } from '@/components/ui/PixelShip';
import { PixelText } from '@/components/ui/PixelText';
import { GAME, SHIP_SKINS, ShipSkin } from '@/constants/gameConfig';
import { Hub, Space } from '@/constants/theme';
import { EngineInput, GameEngine } from '@/game/engine';
import { ControlScheme } from '@/stores/useSettingsStore';
import { RunResult } from '@/types';

interface Props {
  width: number;
  height: number;
  skinId: string;
  fireRateLevel: number;
  turnSpeedLevel: number;
  damageLevel: number;
  controlScheme: ControlScheme;
  paused: boolean;
  onFrame?: (elapsed: number, coins: number) => void;
  onGameOver: (result: RunResult) => void;
}

const SHATTER_OFFSETS = [
  [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1.4], [0, 1.4], [-1.4, 0], [1.4, 0],
];

/** Dim pixel arrow hint shown at the bottom corners in buttons mode. */
function ArrowHint({ dir }: { dir: -1 | 1 }) {
  const bars = [12, 20, 28, 20, 12];
  return (
    <View style={{ alignItems: dir === 1 ? 'flex-start' : 'flex-end', opacity: 0.3 }}>
      {bars.map((w, i) => (
        <View key={i} style={{ width: w, height: 5, backgroundColor: Space.cyan, marginVertical: 0.5 }} />
      ))}
    </View>
  );
}

export const GameCanvas = memo(function GameCanvas({
  width,
  height,
  skinId,
  fireRateLevel,
  turnSpeedLevel,
  damageLevel,
  controlScheme,
  paused,
  onFrame,
  onGameOver,
}: Props) {
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<EngineInput>({ dir: 0, targetX: null });
  const overFiredRef = useRef(false);
  const [, setTick] = useState(0);

  if (!engineRef.current) {
    engineRef.current = new GameEngine({
      fireRateLevel,
      turnSpeedLevel,
      damageLevel,
      aspect: height / width,
    });
  }
  const engine = engineRef.current;
  const skin: ShipSkin = SHIP_SKINS.find((s) => s.id === skinId) ?? SHIP_SKINS[0];

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (last === 0) last = now;
      // Clamp pathological frame gaps; the engine substeps internally so a
      // large dt still simulates without bullets tunneling through asteroids.
      const dt = Math.min((now - last) / 1000, 1 / 10);
      last = now;
      const s = engine.step(dt, inputRef.current);
      onFrame?.(s.elapsedSeconds, s.coinsThisRun);
      setTick((t) => t + 1);
      if (s.gameOver && !overFiredRef.current) {
        overFiredRef.current = true;
        // Keep the loop running so the ship's shatter burst animates,
        // then hand the result off after it has played.
        setTimeout(() => {
          onGameOver({
            survivalSeconds: s.elapsedSeconds,
            coinsEarned: s.coinsThisRun,
            asteroidsDestroyed: s.asteroidsDestroyed,
          });
        }, 450);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, engine]);

  const s = engine.state;
  const shipW = GAME.shipWidthFrac * width * 1.6; // sprite is drawn wider than hitbox
  const shipX = s.shipX * width - shipW / 2;
  const shipY = engine.shipY() * height - shipW / 2;

  return (
    <View style={{ width, height, backgroundColor: Space.background, overflow: 'hidden' }}>
      <ScrollingStars height={height} />

      {/* bullets */}
      {s.bullets.map((b) => (
        <View
          key={b.id}
          style={{
            position: 'absolute',
            left: b.x * width - (GAME.bulletWidthFrac * width) / 2,
            top: b.y * height,
            width: GAME.bulletWidthFrac * width,
            height: GAME.bulletHeightFrac * height,
            backgroundColor: Space.cyan,
          }}
        />
      ))}

      {/* asteroids — rotation lives on this cheap wrapper transform so the
          memoized sprite (its ~40 cell Views) is never re-rendered per frame */}
      {s.asteroids.map((a) => {
        const d = a.radius * 2 * width;
        return (
          <View
            key={a.id}
            style={{
              position: 'absolute',
              left: a.x * width - d / 2,
              top: a.y * height - d / 2,
              transform: [{ rotate: `${Math.round(a.rotation)}deg` }],
            }}
          >
            <AsteroidSprite variant={a.variant} size={d} damaged={a.hp / a.maxHp < 0.6} />
          </View>
        );
      })}

      {/* shatter bursts: 8 squares flying outward, fading with age */}
      {s.shatters.map((sh) => {
        const prog = sh.age / GAME.shatterDuration;
        const dist = sh.radius * width * (0.6 + prog * 2.2);
        const sq = Math.max(3, sh.radius * width * 0.35 * (1 - prog));
        return SHATTER_OFFSETS.map(([ox, oy], i) => (
          <View
            key={`${sh.id}-${i}`}
            style={{
              position: 'absolute',
              left: sh.x * width + ox * dist - sq / 2,
              top: sh.y * height + oy * dist - sq / 2,
              width: sq,
              height: sq,
              backgroundColor: i % 2 ? Space.purple : Hub.textDim,
              opacity: 1 - prog,
            }}
          />
        ));
      })}

      {/* coin pop-ups: "+N" floats up and fades */}
      {s.coinPops.map((cp) => (
        <View
          key={cp.id}
          style={{
            position: 'absolute',
            left: cp.x * width - 30,
            top: cp.y * height - cp.age * 60,
            width: 60,
            alignItems: 'center',
            opacity: 1 - cp.age / 0.8,
          }}
        >
          <PixelText size={9} color={Hub.yellow}>
            +{cp.amount}
          </PixelText>
        </View>
      ))}

      {/* ship (hidden once destroyed — the shatter burst replaces it) */}
      {!s.gameOver && (
        <View style={{ position: 'absolute', left: shipX, top: shipY }}>
          <PixelShip skin={skin} size={shipW} />
        </View>
      )}

      {/* steering input layer */}
      {controlScheme === 'buttons' ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Pressable
              style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 28, paddingLeft: 20 }}
              onPressIn={() => { inputRef.current.dir = -1; }}
              onPressOut={() => { if (inputRef.current.dir === -1) inputRef.current.dir = 0; }}
            >
              <ArrowHint dir={-1} />
            </Pressable>
            <Pressable
              style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 28, paddingRight: 20, alignItems: 'flex-end' }}
              onPressIn={() => { inputRef.current.dir = 1; }}
              onPressOut={() => { if (inputRef.current.dir === 1) inputRef.current.dir = 0; }}
            >
              <ArrowHint dir={1} />
            </Pressable>
          </View>
        </View>
      ) : (
        // Follow mode: the ship chases the finger's x anywhere on screen.
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => { inputRef.current.targetX = e.nativeEvent.locationX / width; }}
          onResponderMove={(e) => { inputRef.current.targetX = e.nativeEvent.locationX / width; }}
          onResponderRelease={() => { inputRef.current.targetX = null; }}
          onResponderTerminate={() => { inputRef.current.targetX = null; }}
        />
      )}
    </View>
  );
});
