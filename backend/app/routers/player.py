from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import current_player, get_or_create_player

router = APIRouter(prefix="/player", tags=["player"])


@router.post("/register", response_model=schemas.PlayerOut)
def register(player: models.Player = Depends(current_player)):
    """Idempotent upsert by device_id; creates the player on first contact."""
    return player


@router.put("/ship", response_model=schemas.PlayerOut)
def set_ship(
    body: schemas.ShipIn,
    player: models.Player = Depends(current_player),
    db: Session = Depends(get_db),
):
    player.selected_ship = body.ship_id
    db.commit()
    db.refresh(player)
    return player


@router.get("/{device_id}", response_model=schemas.PlayerOut)
def get_player(device_id: str, db: Session = Depends(get_db)):
    return get_or_create_player(db, device_id)


@router.get("/{device_id}/stats", response_model=schemas.StatsOut)
def get_stats(device_id: str, db: Session = Depends(get_db)):
    player = get_or_create_player(db, device_id)
    row = (
        db.query(
            func.coalesce(func.max(models.Run.survival_seconds), 0.0),
            func.count(models.Run.id),
            func.coalesce(func.sum(models.Run.asteroids_destroyed), 0),
            func.coalesce(func.sum(models.Run.coins_earned), 0),
        )
        .filter(models.Run.player_id == player.id)
        .one()
    )
    return schemas.StatsOut(
        best_survival_seconds=row[0],
        total_runs=row[1],
        total_asteroids_destroyed=row[2],
        lifetime_coins_earned=row[3],
    )
