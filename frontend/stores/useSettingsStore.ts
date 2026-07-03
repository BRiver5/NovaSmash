import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import * as dbApi from '@/services/localDb';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useRunStore } from '@/stores/useRunStore';

const SOUND_KEY = 'novasmash.sound_enabled';
const MUSIC_KEY = 'novasmash.music_enabled';
const CONTROLS_KEY = 'novasmash.control_scheme';

/** buttons = hold left/right zones; follow = ship chases the finger. */
export type ControlScheme = 'buttons' | 'follow';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  controlScheme: ControlScheme;
  hydrated: boolean;
  initialize: () => Promise<void>;
  setSound: (on: boolean) => Promise<void>;
  setMusic: (on: boolean) => Promise<void>;
  setControlScheme: (scheme: ControlScheme) => Promise<void>;
  /** Wipe local progress and rehydrate all stores. */
  resetProgress: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  musicEnabled: true,
  controlScheme: 'buttons',
  hydrated: false,

  initialize: async () => {
    const [sound, music, controls] = await Promise.all([
      AsyncStorage.getItem(SOUND_KEY),
      AsyncStorage.getItem(MUSIC_KEY),
      AsyncStorage.getItem(CONTROLS_KEY),
    ]);
    set({
      soundEnabled: sound !== 'false',
      musicEnabled: music !== 'false',
      controlScheme: controls === 'follow' ? 'follow' : 'buttons',
      hydrated: true,
    });
  },

  setSound: async (on) => {
    set({ soundEnabled: on });
    await AsyncStorage.setItem(SOUND_KEY, String(on));
  },

  setMusic: async (on) => {
    set({ musicEnabled: on });
    await AsyncStorage.setItem(MUSIC_KEY, String(on));
  },

  setControlScheme: async (scheme) => {
    set({ controlScheme: scheme });
    await AsyncStorage.setItem(CONTROLS_KEY, scheme);
  },

  resetProgress: async () => {
    await dbApi.resetAllData();
    await usePlayerStore.getState().initialize();
    await useRunStore.getState().loadHistory();
    useRunStore.setState({ lastRun: null, lastRunIsNewBest: false });
  },
}));
