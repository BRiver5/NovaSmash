"""Seed the static upgrade-cost table (spec §6).

Costs are the canonical copy; the client mirrors them into its local table via
GET /upgrades/costs (and ships the same values as fallback defaults in
constants/gameConfig.ts — keep the two in sync).
"""
from sqlalchemy.orm import Session

from . import models

UPGRADE_COSTS: dict[str, dict[int, int]] = {
    "fire_rate": {2: 100, 3: 250, 4: 500, 5: 900},
    "turn_speed": {2: 100, 3: 250, 4: 500, 5: 900},
    "damage": {2: 150, 3: 350, 4: 700, 5: 1500},
}

MAX_UPGRADE_LEVEL = 5


def seed_if_empty(db: Session) -> None:
    if db.query(models.UpgradeCost).count() > 0:
        return
    for upgrade_type, levels in UPGRADE_COSTS.items():
        for level, cost in levels.items():
            db.add(
                models.UpgradeCost(
                    upgrade_type=upgrade_type, level=level, coin_cost=cost
                )
            )
    db.commit()
