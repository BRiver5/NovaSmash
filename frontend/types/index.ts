import { UpgradeType } from '@/constants/gameConfig';

export interface Player {
  spaceCoins: number;
  fireRateLevel: number;
  turnSpeedLevel: number;
  damageLevel: number;
  selectedShip: string;
}

export interface RunRecord {
  id: number;
  survivalSeconds: number;
  coinsEarned: number;
  asteroidsDestroyed: number;
  createdAt: string; // ISO
}

export interface RunResult {
  survivalSeconds: number;
  coinsEarned: number;
  asteroidsDestroyed: number;
}

export interface LifetimeStats {
  bestSurvivalSeconds: number;
  totalRuns: number;
  totalAsteroidsDestroyed: number;
  lifetimeCoinsEarned: number;
}

export interface UpgradeCostRow {
  upgradeType: UpgradeType;
  level: number; // the level being purchased (2..5)
  coinCost: number;
}
