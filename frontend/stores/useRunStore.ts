import { create } from 'zustand';

import * as dbApi from '@/services/localDb';
import { enqueueSync, syncApi } from '@/services/sync';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { LifetimeStats, RunRecord, RunResult } from '@/types';

interface RunState {
  /** Result of the most recently finished run (drives the Game Over screen). */
  lastRun: RunResult | null;
  lastRunIsNewBest: boolean;
  runs: RunRecord[];
  stats: LifetimeStats | null;
  /** Persist a finished run locally, credit coins, mirror to backend. */
  submitRun: (run: RunResult) => Promise<void>;
  loadHistory: () => Promise<void>;
}

export const useRunStore = create<RunState>((set) => ({
  lastRun: null,
  lastRunIsNewBest: false,
  runs: [],
  stats: null,

  submitRun: async (run) => {
    const { player, isNewBest } = await dbApi.recordRun(run);
    usePlayerStore.setState({ player });
    set({ lastRun: run, lastRunIsNewBest: isNewBest });
    enqueueSync(() => syncApi.postRun(run));
  },

  loadHistory: async () => {
    const [runs, stats] = await Promise.all([dbApi.getRecentRuns(50), dbApi.getLifetimeStats()]);
    set({ runs, stats });
  },
}));
