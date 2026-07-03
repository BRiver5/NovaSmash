/**
 * Settings (spec §5.8): sound/music toggles, reset progress with a
 * confirmation dialog, app version.
 */
import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ChunkyButton } from '@/components/ui/ChunkyButton';
import { HubScreen } from '@/components/ui/HubScreen';
import { PixelText } from '@/components/ui/PixelText';
import { Hub, Space, Spacing } from '@/constants/theme';
import { ControlScheme, useSettingsStore } from '@/stores/useSettingsStore';

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Hub.panel,
        borderBottomWidth: 4,
        borderBottomColor: Hub.panelBevel,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
      }}
    >
      <PixelText size={10} color={Hub.white}>
        {label}
      </PixelText>
      <Pressable onPress={() => onToggle(!value)} hitSlop={10}>
        <View
          style={{
            width: 58,
            height: 26,
            backgroundColor: value ? Space.cyan : Hub.disabled,
            justifyContent: 'center',
            padding: 3,
            alignItems: value ? 'flex-end' : 'flex-start',
          }}
        >
          <View style={{ width: 20, height: 20, backgroundColor: Hub.white }} />
        </View>
      </Pressable>
    </View>
  );
}

function SchemeOption({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  hint: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: active ? Hub.pink : Hub.panelBevel,
          borderBottomWidth: 3,
          borderBottomColor: active ? Hub.pinkBevel : Hub.background,
          paddingVertical: 10,
          paddingHorizontal: 6,
          alignItems: 'center',
          gap: 4,
        }}
      >
        <PixelText size={8} color={active ? Hub.white : Hub.textDim} center>
          {label}
        </PixelText>
        <PixelText size={6} color={active ? Hub.white : Hub.textDim} center>
          {hint}
        </PixelText>
      </View>
    </Pressable>
  );
}

export default function Settings() {
  const {
    soundEnabled,
    musicEnabled,
    controlScheme,
    setSound,
    setMusic,
    setControlScheme,
    resetProgress,
  } = useSettingsStore();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <HubScreen title="SETTINGS" scroll starSeed={29}>
      <ToggleRow label="SOUND" value={soundEnabled} onToggle={(v) => void setSound(v)} />
      <ToggleRow label="MUSIC" value={musicEnabled} onToggle={(v) => void setMusic(v)} />

      {/* control scheme selector */}
      <View
        style={{
          backgroundColor: Hub.panel,
          borderBottomWidth: 4,
          borderBottomColor: Hub.panelBevel,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
          gap: Spacing.md,
        }}
      >
        <PixelText size={10} color={Hub.white}>
          CONTROLS
        </PixelText>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <SchemeOption
            label="BUTTONS"
            hint="HOLD LEFT / RIGHT"
            active={controlScheme === 'buttons'}
            onPress={() => void setControlScheme('buttons' as ControlScheme)}
          />
          <SchemeOption
            label="FOLLOW"
            hint="SHIP CHASES FINGER"
            active={controlScheme === 'follow'}
            onPress={() => void setControlScheme('follow' as ControlScheme)}
          />
        </View>
      </View>

      <View style={{ marginTop: Spacing.lg }}>
        {!confirming ? (
          <ChunkyButton
            label="RESET PROGRESS"
            color={Hub.panel}
            bevelColor={Hub.panelBevel}
            textColor={Space.danger}
            onPress={() => {
              setResetDone(false);
              setConfirming(true);
            }}
          />
        ) : (
          <View
            style={{
              backgroundColor: Hub.panel,
              borderBottomWidth: 4,
              borderBottomColor: Hub.panelBevel,
              padding: Spacing.md,
              gap: Spacing.md,
            }}
          >
            <PixelText size={9} color={Hub.white} center>
              DELETE ALL PROGRESS?
            </PixelText>
            <PixelText size={7} color={Hub.textDim} center>
              COINS, UPGRADES AND RUN HISTORY WILL BE WIPED. THIS CANNOT BE UNDONE.
            </PixelText>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <ChunkyButton
                  label="CANCEL"
                  fontSize={9}
                  color={Hub.disabled}
                  bevelColor={Hub.disabledBevel}
                  onPress={() => setConfirming(false)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ChunkyButton
                  label="DELETE"
                  fontSize={9}
                  onPress={() => {
                    void resetProgress().then(() => {
                      setConfirming(false);
                      setResetDone(true);
                    });
                  }}
                />
              </View>
            </View>
          </View>
        )}
        {resetDone && (
          <PixelText size={8} color={Space.cyan} center style={{ marginTop: Spacing.md }}>
            PROGRESS RESET
          </PixelText>
        )}
      </View>

      <View style={{ marginTop: Spacing.xl, alignItems: 'center' }}>
        <PixelText size={7} color={Hub.textDim}>
          NOVASMASH V{version}
        </PixelText>
      </View>
    </HubScreen>
  );
}
