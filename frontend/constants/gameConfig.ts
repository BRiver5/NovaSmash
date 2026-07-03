/**
 * All gameplay tuning lives here (spec §8): the game loop code never needs to
 * change to rebalance difficulty. The upgrade cost table mirrors the backend's
 * seeded `upgrade_costs` table — keep the two in sync.
 */

export const GAME = {
  /** Logical playfield width; positions are normalized 0..1 then scaled. */
  shipWidthFrac: 0.09, // ship width as fraction of screen width
  shipHeightFrac: 0.06,
  shipBottomOffsetFrac: 0.16, // ship center distance from bottom

  /** Horizontal speed (screen-widths per second) at Turn Speed level 1. */
  baseTurnSpeed: 0.55,
  /** Additional speed per Turn Speed level above 1. */
  turnSpeedPerLevel: 0.12,

  /** Seconds between shots at Fire Rate level 1. */
  baseFireInterval: 0.6,
  /** Each Fire Rate level multiplies the interval by this factor. */
  fireIntervalFactorPerLevel: 0.82,

  /** Bullet damage at Damage level 1; +damagePerLevel per level above 1. */
  baseDamage: 1,
  damagePerLevel: 1,

  bulletSpeedFrac: 1.4, // screen-heights per second, upward
  bulletWidthFrac: 0.012,
  bulletHeightFrac: 0.03,

  /** Asteroid spawn interval (seconds) at t=0 and its floor. */
  baseSpawnInterval: 1.1,
  minSpawnInterval: 0.32,
  /** Asteroid fall speed (screen-heights/s) at t=0. */
  baseFallSpeed: 0.16,
  maxFallSpeed: 0.52,

  /** Asteroid radius range as fraction of screen width at t=0. */
  baseAsteroidRadiusMin: 0.045,
  baseAsteroidRadiusMax: 0.075,
  /** Radius growth cap multiplier at max difficulty. */
  maxRadiusScale: 1.6,

  /** Base HP of the smallest asteroid; HP scales with radius + difficulty. */
  baseAsteroidHp: 1,
  maxBonusHp: 4,

  /** Difficulty step: every N survival seconds, ramp scale increases. */
  difficultyStepSeconds: 12,
  /** Ramp progress at which spawn/speed reach their max (in steps). */
  maxDifficultySteps: 10,

  /** Coins awarded = ceil(radiusFrac * coinRadiusMultiplier). */
  coinRadiusMultiplier: 60,

  /** How long a shatter animation lives before the particle despawns (s). */
  shatterDuration: 0.4,

  /**
   * Collision hitbox scales relative to the drawn sprite radius. The pixel
   * asteroid's corners are empty, so the fair hitbox is well inside the
   * bounding circle — the ship one especially so death never feels cheap.
   */
  asteroidShipHitboxScale: 0.68,
  asteroidBulletHitboxScale: 0.92,
} as const;

export const MAX_UPGRADE_LEVEL = 5;

export type UpgradeType = 'fire_rate' | 'turn_speed' | 'damage';

/** Cost to buy the NEXT level (index by target level 2..5). Level 1 is free/default. */
export const UPGRADE_COSTS: Record<UpgradeType, Record<number, number>> = {
  fire_rate: { 2: 100, 3: 250, 4: 500, 5: 900 },
  turn_speed: { 2: 100, 3: 250, 4: 500, 5: 900 },
  damage: { 2: 150, 3: 350, 4: 700, 5: 1500 },
};

export const UPGRADE_LABELS: Record<UpgradeType, string> = {
  fire_rate: 'FIRE RATE',
  turn_speed: 'TURN SPEED',
  damage: 'DAMAGE',
};

/** Cosmetic ship skins (spec §5.3 — cosmetic only, no stat differences). */
export interface ShipSkin {
  id: string;
  name: string;
  body: string;
  stripe: string;
  fin: string;
}

export const SHIP_SKINS: ShipSkin[] = [
  { id: 'sharkfin', name: 'SHARKFIN', body: '#F0338B', stripe: '#3FE0E8', fin: '#FFE94A' },
  { id: 'nova', name: 'NOVA', body: '#3FE0E8', stripe: '#FFFFFF', fin: '#F0338B' },
  { id: 'ember', name: 'EMBER', body: '#FFE94A', stripe: '#F0338B', fin: '#3FE0E8' },
  { id: 'violet', name: 'VIOLET', body: '#8B2FD1', stripe: '#FFE94A', fin: '#FFFFFF' },
];

export function derivedStats(fireRateLevel: number, turnSpeedLevel: number, damageLevel: number) {
  return {
    fireInterval:
      GAME.baseFireInterval * Math.pow(GAME.fireIntervalFactorPerLevel, fireRateLevel - 1),
    turnSpeed: GAME.baseTurnSpeed + GAME.turnSpeedPerLevel * (turnSpeedLevel - 1),
    damage: GAME.baseDamage + GAME.damagePerLevel * (damageLevel - 1),
  };
}
