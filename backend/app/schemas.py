"""Pydantic schemas — request/response contracts for the NovaSmash API."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

UpgradeType = Literal["fire_rate", "turn_speed", "damage"]


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device_id: str
    space_coins: int
    fire_rate_level: int
    turn_speed_level: int
    damage_level: int
    selected_ship: str


class RunIn(BaseModel):
    survival_seconds: float = Field(ge=0)
    coins_earned: int = Field(ge=0)
    asteroids_destroyed: int = Field(ge=0)


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    survival_seconds: float
    coins_earned: int
    asteroids_destroyed: int
    created_at: datetime


class RunSubmitOut(BaseModel):
    run: RunOut
    player: PlayerOut
    is_new_best: bool


class StatsOut(BaseModel):
    best_survival_seconds: float
    total_runs: int
    total_asteroids_destroyed: int
    lifetime_coins_earned: int


class PurchaseIn(BaseModel):
    upgrade_type: UpgradeType


class ShipIn(BaseModel):
    ship_id: str = Field(min_length=1, max_length=40)


class UpgradeCostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    upgrade_type: str
    level: int
    coin_cost: int
