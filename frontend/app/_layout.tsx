import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Hub } from '@/constants/theme';
import { initDatabase } from '@/services/localDb';
import { flushSyncQueue } from '@/services/sync';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useRunStore } from '@/stores/useRunStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PressStart2P: require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await initDatabase();
      await Promise.all([
        usePlayerStore.getState().initialize(),
        useSettingsStore.getState().initialize(),
        useRunStore.getState().loadHistory(),
      ]);
      if (!cancelled) setDbReady(true);
    })();
    // Opportunistic backend sync every 30s; harmless if no backend is reachable.
    const interval = setInterval(() => void flushSyncQueue(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const ready = dbReady && fontsLoaded;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {ready ? (
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="menu" />
            <Stack.Screen name="ships" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="upgrades" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="insights" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="play" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="gameover" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
        ) : (
          // Native splash color holds until fonts+db are ready; nothing to render.
          <View style={{ flex: 1, backgroundColor: Hub.background }} />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
