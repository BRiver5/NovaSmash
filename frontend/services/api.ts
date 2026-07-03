/**
 * Optional FastAPI client. The app is fully usable offline; this is a
 * progressive enhancement. Base URL is derived from the Expo dev host so a
 * physical device hitting the LAN dev machine works without hardcoding an IP.
 * Set EXPO_PUBLIC_API_URL to override. Device UUID is injected automatically.
 */
import Constants from 'expo-constants';

import { UpgradeType } from '@/constants/gameConfig';
import { RunResult } from '@/types';
import { getDeviceId } from './identity';

function resolveBaseUrl(): string | null {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  // hostUri looks like "192.168.1.20:8081" in dev; reuse the host on port 8000.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8000`;
  }
  return null;
}

export const API_BASE_URL = resolveBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('No API base URL');
  const deviceId = await getDeviceId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  register: () => request('/player/register', { method: 'POST' }),
  postRun: (run: RunResult) =>
    request('/runs', {
      method: 'POST',
      body: JSON.stringify({
        survival_seconds: run.survivalSeconds,
        coins_earned: run.coinsEarned,
        asteroids_destroyed: run.asteroidsDestroyed,
      }),
    }),
  purchaseUpgrade: (type: UpgradeType) =>
    request('/upgrades/purchase', {
      method: 'POST',
      body: JSON.stringify({ upgrade_type: type }),
    }),
  putShip: (shipId: string) =>
    request('/player/ship', { method: 'PUT', body: JSON.stringify({ ship_id: shipId }) }),
};
