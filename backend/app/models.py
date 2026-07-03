"""SQLAlchemy ORM models for NovaSmash.

Mirrors the on-device schema (spec §6): the device's SQLite is the source of
truth and this API is its opportunistic mirror, keyed by anonymous device UUID.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Player(Base):
    __tablename__ = "players"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, unique=True, index=True, nullable=False)
    space_coins = Column(Integer, nullable=False, default=0)
    fire_rate_level = Column(Integer, nullable=False, default=1)
    turn_speed_level = Column(Integer, nullable=False, default=1)
    damage_level = Column(Integer, nullable=False, default=1)
    selected_ship = Column(String, nullable=False, default="sharkfin")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    runs = relationship("Run", back_populates="player", cascade="all, delete-orphan")


class Run(Base):
    __tablename__ = "runs"

    id = Column(Integer, primary_key=True)
    player_id = Column(String, ForeignKey("players.id"), nullable=False, index=True)
    survival_seconds = Column(Float, nullable=False)
    coins_earned = Column(Integer, nullable=False)
    asteroids_destroyed = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    player = relationship("Player", back_populates="runs")


class UpgradeCost(Base):
    """Static seeded cost table — the client mirrors this via GET /upgrades/costs."""

    __tablename__ = "upgrade_costs"

    id = Column(Integer, primary_key=True)
    upgrade_type = Column(String, nullable=False)  # fire_rate | turn_speed | damage
    level = Column(Integer, nullable=False)  # level being purchased (2..5)
    coin_cost = Column(Integer, nullable=False)
