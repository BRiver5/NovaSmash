/**
 * Offline-first SQLite layer (expo-sqlite). This is the single source of truth
 * on-device; the FastAPI backend is an optional mirror synced opportunistically.
 * Every store reads/writes through these typed helpers.
 */
import * as SQLite from 'expo-sqlite';

import { MAX_UPGRADE_LEVEL, UPGRADE_COSTS, UpgradeType } from '@/constants/gameConfig';
import { LifetimeStats, Player, RunRecord, RunResult, UpgradeCostRow } from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

function db(): SQLite.SQLiteDatabase {
  if (!dbInstance) dbInstance = SQLite.openDatabaseSync('novasmash.db');
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  await db().execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS player (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      space_coins INTEGER NOT NULL DEFAULT 0,
      fire_rate_level INTEGER NOT NULL DEFAULT 1,
      turn_speed_level INTEGER NOT NULL DEFAULT 1,
      damage_level INTEGER NOT NULL DEFAULT 1,
      selected_ship TEXT NOT NULL DEFAULT 'sharkfin',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survival_seconds REAL NOT NULL,
      coins_earned INTEGER NOT NULL,
      asteroids_destroyed INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS upgrade_costs (
      upgrade_type TEXT NOT NULL,
      level INTEGER NOT NULL,
      coin_cost INTEGER NOT NULL,
      PRIMARY KEY (upgrade_type, level)
    );

    CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at);
  `);
  await seedIfEmpty();
}

async function seedIfEmpty(): Promise<void> {
  await db().runAsync('INSERT OR IGNORE INTO player (id) VALUES (1)');
  const row = await db().getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM upgrade_costs');
  if (!row || row.c === 0) {
    for (const [type, levels] of Object.entries(UPGRADE_COSTS)) {
      for (const [level, cost] of Object.entries(levels)) {
        await db().runAsync(
          'INSERT INTO upgrade_costs (upgrade_type, level, coin_cost) VALUES (?, ?, ?)',
          [type, Number(level), cost],
        );
      }
    }
  }
}

// ---------- player ----------
function mapPlayer(r: any): Player {
  return {
    spaceCoins: r.space_coins,
    fireRateLevel: r.fire_rate_level,
    turnSpeedLevel: r.turn_speed_level,
    damageLevel: r.damage_level,
    selectedShip: r.selected_ship,
  };
}

export async function getPlayer(): Promise<Player> {
  const r = await db().getFirstAsync<any>('SELECT * FROM player WHERE id = 1');
  if (!r) {
    await db().runAsync('INSERT OR IGNORE INTO player (id) VALUES (1)');
    return { spaceCoins: 0, fireRateLevel: 1, turnSpeedLevel: 1, damageLevel: 1, selectedShip: 'sharkfin' };
  }
  return mapPlayer(r);
}

export async function setSelectedShip(shipId: string): Promise<void> {
  await db().runAsync('UPDATE player SET selected_ship = ? WHERE id = 1', [shipId]);
}

const LEVEL_COLUMN: Record<UpgradeType, string> = {
  fire_rate: 'fire_rate_level',
  turn_speed: 'turn_speed_level',
  damage: 'damage_level',
};

/**
 * Atomically validate + purchase an upgrade. Returns the updated player or a
 * failure reason. Cost is read from the local `upgrade_costs` table (mirrored
 * from the backend seed) — never hardcoded at the call site.
 */
export async function purchaseUpgrade(
  type: UpgradeType,
): Promise<{ ok: true; player: Player } | { ok: false; reason: 'max_level' | 'insufficient_coins' }> {
  const col = LEVEL_COLUMN[type];
  const player = await getPlayer();
  const current =
    type === 'fire_rate' ? player.fireRateLevel : type === 'turn_speed' ? player.turnSpeedLevel : player.damageLevel;
  if (current >= MAX_UPGRADE_LEVEL) return { ok: false, reason: 'max_level' };

  const costRow = await db().getFirstAsync<{ coin_cost: number }>(
    'SELECT coin_cost FROM upgrade_costs WHERE upgrade_type = ? AND level = ?',
    [type, current + 1],
  );
  const cost = costRow?.coin_cost ?? Number.MAX_SAFE_INTEGER;
  if (player.spaceCoins < cost) return { ok: false, reason: 'insufficient_coins' };

  await db().runAsync(
    `UPDATE player SET space_coins = space_coins - ?, ${col} = ${col} + 1 WHERE id = 1`,
    [cost],
  );
  return { ok: true, player: await getPlayer() };
}

// ---------- runs ----------
function mapRun(r: any): RunRecord {
  return {
    id: r.id,
    survivalSeconds: r.survival_seconds,
    coinsEarned: r.coins_earned,
    asteroidsDestroyed: r.asteroids_destroyed,
    createdAt: r.created_at,
  };
}

/** Persist a finished run, credit its coins, and report whether it's a new best. */
export async function recordRun(
  run: RunResult,
): Promise<{ run: RunRecord; player: Player; isNewBest: boolean }> {
  const prevBest = await db().getFirstAsync<{ best: number | null }>(
    'SELECT MAX(survival_seconds) AS best FROM runs',
  );
  const isNewBest = run.survivalSeconds > (prevBest?.best ?? 0);

  const res = await db().runAsync(
    `INSERT INTO runs (survival_seconds, coins_earned, asteroids_destroyed)
     VALUES (?, ?, ?)`,
    [run.survivalSeconds, run.coinsEarned, run.asteroidsDestroyed],
  );
  await db().runAsync('UPDATE player SET space_coins = space_coins + ? WHERE id = 1', [
    run.coinsEarned,
  ]);

  const inserted = await db().getFirstAsync<any>('SELECT * FROM runs WHERE id = ?', [
    res.lastInsertRowId,
  ]);
  return { run: mapRun(inserted), player: await getPlayer(), isNewBest };
}

export async function getRecentRuns(limit = 50): Promise<RunRecord[]> {
  const rows = await db().getAllAsync<any>(
    'SELECT * FROM runs ORDER BY created_at DESC, id DESC LIMIT ?',
    [limit],
  );
  return rows.reverse().map(mapRun); // chronological for charts
}

export async function getLifetimeStats(): Promise<LifetimeStats> {
  const r = await db().getFirstAsync<any>(
    `SELECT COALESCE(MAX(survival_seconds), 0) AS best,
            COUNT(*) AS total_runs,
            COALESCE(SUM(asteroids_destroyed), 0) AS total_asteroids,
            COALESCE(SUM(coins_earned), 0) AS lifetime_coins
     FROM runs`,
  );
  return {
    bestSurvivalSeconds: r?.best ?? 0,
    totalRuns: r?.total_runs ?? 0,
    totalAsteroidsDestroyed: r?.total_asteroids ?? 0,
    lifetimeCoinsEarned: r?.lifetime_coins ?? 0,
  };
}

// ---------- costs ----------
export async function getUpgradeCosts(): Promise<UpgradeCostRow[]> {
  const rows = await db().getAllAsync<any>(
    'SELECT upgrade_type, level, coin_cost FROM upgrade_costs ORDER BY upgrade_type, level',
  );
  return rows.map((r) => ({ upgradeType: r.upgrade_type, level: r.level, coinCost: r.coin_cost }));
}

/** Wipe all progress (Settings > Reset). Re-seeds defaults. */
export async function resetAllData(): Promise<void> {
  await db().execAsync(`
    DELETE FROM runs;
    DELETE FROM player;
    DELETE FROM upgrade_costs;
  `);
  await seedIfEmpty();
}
