import { create } from 'zustand';

import { UpgradeType } from '@/constants/gameConfig';
import * as dbApi from '@/services/localDb';
import { enqueueSync, syncApi } from '@/services/sync';
import { Player, UpgradeCostRow } from '@/types';

interface PlayerState {
  player: Player | null;
  costs: UpgradeCostRow[];
  hydrated: boolean;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  selectShip: (shipId: string) => Promise<void>;
  /** Returns null on success, or a user-facing failure reason. */
  purchase: (type: UpgradeType) => Promise<'max_level' | 'insufficient_coins' | null>;
  nextCost: (type: UpgradeType) => number | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  costs: [],
  hydrated: false,

  initialize: async () => {
    const [player, costs] = await Promise.all([dbApi.getPlayer(), dbApi.getUpgradeCosts()]);
    set({ player, costs, hydrated: true });
    // Silent idempotent registration; harmless when no backend is reachable.
    enqueueSync(() => syncApi.register());
  },

  refresh: async () => {
    set({ player: await dbApi.getPlayer() });
  },

  selectShip: async (shipId) => {
    await dbApi.setSelectedShip(shipId);
    set({ player: await dbApi.getPlayer() });
    enqueueSync(() => syncApi.putShip(shipId));
  },

  purchase: async (type) => {
    const result = await dbApi.purchaseUpgrade(type);
    if (!result.ok) return result.reason;
    set({ player: result.player });
    enqueueSync(() => syncApi.purchaseUpgrade(type));
    return null;
  },

  nextCost: (type) => {
    const { player, costs } = get();
    if (!player) return null;
    const current =
      type === 'fire_rate'
        ? player.fireRateLevel
        : type === 'turn_speed'
          ? player.turnSpeedLevel
          : player.damageLevel;
    const row = costs.find((c) => c.upgradeType === type && c.level === current + 1);
    return row ? row.coinCost : null; // null => max level
  },
}));
