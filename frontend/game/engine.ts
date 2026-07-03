/**
 * NovaSmash game engine — pure TypeScript, no React Native imports.
 * All positions are normalized: x in [0..1] of screen width, y in [0..1] of
 * screen height (y=0 top). The renderer scales to pixels. All tuning comes
 * from constants/gameConfig.ts so balancing never touches this file.
 */
import { derivedStats, GAME } from '@/constants/gameConfig';

export interface Bullet {
  id: number;
  x: number;
  y: number;
}

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  radius: number; // fraction of screen width
  hp: number;
  maxHp: number;
  rotation: number; // degrees, decorative
  spin: number; // deg/s
  variant: number; // 0..2, picks a sprite shape
}

/** Short-lived shatter particle burst where an asteroid died. */
export interface Shatter {
  id: number;
  x: number;
  y: number;
  radius: number;
  age: number; // seconds since spawn
}

/** Floating "+N" coin pop-up where an asteroid was destroyed. */
export interface CoinPop {
  id: number;
  x: number;
  y: number;
  amount: number;
  age: number;
}

export interface EngineState {
  shipX: number; // center, fraction of width
  bullets: Bullet[];
  asteroids: Asteroid[];
  shatters: Shatter[];
  coinPops: CoinPop[];
  elapsedSeconds: number;
  coinsThisRun: number;
  asteroidsDestroyed: number;
  gameOver: boolean;
}

export type HorizontalInput = -1 | 0 | 1;

/**
 * Two control schemes (user-selectable in Settings):
 * - buttons: `dir` from press-and-hold left/right zones.
 * - follow:  `targetX` — the ship chases the finger's x at turn speed,
 *   so the Turn Speed upgrade matters in both schemes.
 * When targetX is non-null it wins over dir.
 */
export interface EngineInput {
  dir: HorizontalInput;
  targetX: number | null;
}

export interface EngineParams {
  fireRateLevel: number;
  turnSpeedLevel: number;
  damageLevel: number;
  /**
   * Screen aspect ratio as HEIGHT / WIDTH (portrait phone ≈ 2.16). Used to
   * convert y-distances (height fractions) into width-fraction units so
   * collision circles are truly round on screen: dyWidthFrac = dy * aspect.
   */
  aspect: number;
}

export class GameEngine {
  state: EngineState;

  private fireInterval: number;
  private turnSpeed: number;
  private damage: number;
  private aspect: number;

  private fireCooldown = 0;
  private spawnCooldown: number;
  private nextId = 1;
  private rand: () => number;

  constructor(params: EngineParams, rand: () => number = Math.random) {
    const stats = derivedStats(params.fireRateLevel, params.turnSpeedLevel, params.damageLevel);
    this.fireInterval = stats.fireInterval;
    this.turnSpeed = stats.turnSpeed;
    this.damage = stats.damage;
    this.aspect = params.aspect;
    this.rand = rand;
    this.spawnCooldown = GAME.baseSpawnInterval * 0.5; // first asteroid arrives quickly
    this.state = {
      shipX: 0.5,
      bullets: [],
      asteroids: [],
      shatters: [],
      coinPops: [],
      elapsedSeconds: 0,
      coinsThisRun: 0,
      asteroidsDestroyed: 0,
      gameOver: false,
    };
  }

  /** Difficulty ramp 0..1 based on discrete survival-time steps (spec §4). */
  private ramp(): number {
    const steps = Math.floor(this.state.elapsedSeconds / GAME.difficultyStepSeconds);
    return Math.min(1, steps / GAME.maxDifficultySteps);
  }

  private spawnAsteroid(): void {
    const t = this.ramp();
    const radiusScale = 1 + t * (GAME.maxRadiusScale - 1);
    const radius =
      (GAME.baseAsteroidRadiusMin +
        this.rand() * (GAME.baseAsteroidRadiusMax - GAME.baseAsteroidRadiusMin)) *
      radiusScale;
    // Bigger + later asteroids carry more HP.
    const sizeFrac =
      (radius - GAME.baseAsteroidRadiusMin) /
      (GAME.baseAsteroidRadiusMax * GAME.maxRadiusScale - GAME.baseAsteroidRadiusMin);
    const hp = GAME.baseAsteroidHp + Math.round(sizeFrac * t * GAME.maxBonusHp);
    this.state.asteroids.push({
      id: this.nextId++,
      x: radius + this.rand() * (1 - radius * 2),
      y: -radius / this.aspect, // just above the top edge (radius in height fractions)
      radius,
      hp,
      maxHp: hp,
      rotation: this.rand() * 360,
      spin: (this.rand() - 0.5) * 90,
      variant: Math.floor(this.rand() * 3),
    });
  }

  /**
   * Advance the simulation by dt seconds with the current held input.
   *
   * The frame dt is split into fixed substeps of at most MAX_SUBSTEP so a
   * janky render frame (large dt) can never let a bullet tunnel through an
   * asteroid between collision checks: at 1/90s a bullet travels ~0.016
   * screen-heights, well under the smallest asteroid's diameter (~0.042).
   */
  private static readonly MAX_SUBSTEP = 1 / 90;

  step(dt: number, input: EngineInput): EngineState {
    const s = this.state;
    if (s.gameOver) {
      // Keep death-burst particles animating on the frozen field.
      this.ageEffects(dt);
      return s;
    }
    let remaining = dt;
    while (remaining > 1e-9 && !s.gameOver) {
      const h = Math.min(remaining, GameEngine.MAX_SUBSTEP);
      this.substep(h, input);
      remaining -= h;
    }
    return s;
  }

  private ageEffects(dt: number): void {
    const s = this.state;
    if (s.shatters.length) {
      for (const sh of s.shatters) sh.age += dt;
      s.shatters = s.shatters.filter((sh) => sh.age < GAME.shatterDuration);
    }
    if (s.coinPops.length) {
      for (const cp of s.coinPops) cp.age += dt;
      s.coinPops = s.coinPops.filter((cp) => cp.age < 0.8);
    }
  }

  private substep(dt: number, input: EngineInput): void {
    const s = this.state;

    s.elapsedSeconds += dt;
    const t = this.ramp();

    // --- ship movement (buttons or finger-follow; clamped to screen) ---
    const halfShip = GAME.shipWidthFrac / 2;
    let dx: number;
    if (input.targetX !== null) {
      const diff = input.targetX - s.shipX;
      const maxMove = this.turnSpeed * dt;
      dx = Math.abs(diff) <= maxMove ? diff : Math.sign(diff) * maxMove;
    } else {
      dx = input.dir * this.turnSpeed * dt;
    }
    s.shipX = Math.min(1 - halfShip, Math.max(halfShip, s.shipX + dx));

    // --- auto-fire ---
    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.fireCooldown += this.fireInterval;
      s.bullets.push({ id: this.nextId++, x: s.shipX, y: this.shipY() - GAME.shipHeightFrac / 2 });
    }

    // --- bullets fly up (filter only when one actually left the screen) ---
    let bulletLeft = false;
    for (const b of s.bullets) {
      b.y -= GAME.bulletSpeedFrac * dt;
      if (b.y <= -0.05) bulletLeft = true;
    }
    if (bulletLeft) s.bullets = s.bullets.filter((b) => b.y > -0.05);

    // --- spawn + fall asteroids ---
    this.spawnCooldown -= dt;
    const spawnInterval =
      GAME.baseSpawnInterval - t * (GAME.baseSpawnInterval - GAME.minSpawnInterval);
    if (this.spawnCooldown <= 0) {
      this.spawnCooldown += spawnInterval;
      this.spawnAsteroid();
    }
    const fallSpeed = GAME.baseFallSpeed + t * (GAME.maxFallSpeed - GAME.baseFallSpeed);
    let asteroidLeft = false;
    for (const a of s.asteroids) {
      a.y += fallSpeed * dt;
      a.rotation += a.spin * dt;
      if (a.y >= 1 + a.radius / this.aspect) asteroidLeft = true;
    }
    if (asteroidLeft) s.asteroids = s.asteroids.filter((a) => a.y < 1 + a.radius / this.aspect);

    // --- bullet ↔ asteroid collisions (sets allocated lazily on first hit) ---
    if (s.bullets.length && s.asteroids.length) {
      let deadBullets: Set<number> | null = null;
      let deadAsteroids: Set<number> | null = null;
      for (const a of s.asteroids) {
        for (const b of s.bullets) {
          if (deadBullets?.has(b.id)) continue;
          if (this.hit(b.x, b.y, a)) {
            (deadBullets ??= new Set()).add(b.id);
            a.hp -= this.damage;
            if (a.hp <= 0) {
              (deadAsteroids ??= new Set()).add(a.id);
              const coins = Math.ceil(a.radius * GAME.coinRadiusMultiplier);
              s.coinsThisRun += coins;
              s.asteroidsDestroyed += 1;
              s.shatters.push({ id: this.nextId++, x: a.x, y: a.y, radius: a.radius, age: 0 });
              s.coinPops.push({ id: this.nextId++, x: a.x, y: a.y, amount: coins, age: 0 });
              break;
            }
          }
        }
      }
      if (deadBullets) s.bullets = s.bullets.filter((b) => !deadBullets.has(b.id));
      if (deadAsteroids) s.asteroids = s.asteroids.filter((a) => !deadAsteroids.has(a.id));
    }

    // --- effects age out ---
    this.ageEffects(dt);

    // --- ship ↔ asteroid collision: single life, run ends (spec §4) ---
    const shipY = this.shipY();
    const shipR = GAME.shipWidthFrac * 0.42; // forgiving hitbox, slightly inside the sprite
    for (const a of s.asteroids) {
      if (this.circlesOverlap(s.shipX, shipY, shipR, a.x, a.y, a.radius * GAME.asteroidShipHitboxScale)) {
        s.gameOver = true;
        s.shatters.push({ id: this.nextId++, x: s.shipX, y: shipY, radius: shipR * 1.5, age: 0 });
        break;
      }
    }
  }

  shipY(): number {
    return 1 - GAME.shipBottomOffsetFrac;
  }

  /**
   * Point-in-circle test in width-fraction space so the hitbox is exactly as
   * round and as big as the drawn sprite. y-distances are height fractions and
   * must be MULTIPLIED by aspect (height/width) to become width fractions —
   * dividing here once stretched the kill zone ~4.7× vertically.
   */
  private hit(px: number, py: number, a: Asteroid): boolean {
    const dx = px - a.x;
    const dy = (py - a.y) * this.aspect;
    const r = a.radius * GAME.asteroidBulletHitboxScale;
    return dx * dx + dy * dy <= r * r;
  }

  private circlesOverlap(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number,
  ): boolean {
    const dx = x1 - x2;
    const dy = (y1 - y2) * this.aspect;
    const rr = r1 + r2;
    return dx * dx + dy * dy <= rr * rr;
  }
}
