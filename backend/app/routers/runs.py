from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import current_player, get_or_create_player

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("", response_model=schemas.RunSubmitOut)
def submit_run(
    body: schemas.RunIn,
    player: models.Player = Depends(current_player),
    db: Session = Depends(get_db),
):
    """Persist a finished run, credit its coins, report whether it's a new best."""
    prev_best = (
        db.query(func.coalesce(func.max(models.Run.survival_seconds), 0.0))
        .filter(models.Run.player_id == player.id)
        .scalar()
    )
    is_new_best = body.survival_seconds > (prev_best or 0.0)

    run = models.Run(
        player_id=player.id,
        survival_seconds=body.survival_seconds,
        coins_earned=body.coins_earned,
        asteroids_destroyed=body.asteroids_destroyed,
    )
    player.space_coins += body.coins_earned
    db.add(run)
    db.commit()
    db.refresh(run)
    db.refresh(player)
    return schemas.RunSubmitOut(
        run=schemas.RunOut.model_validate(run),
        player=schemas.PlayerOut.model_validate(player),
        is_new_best=is_new_best,
    )


@router.get("/{device_id}", response_model=list[schemas.RunOut])
def run_history(
    device_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Run history for Insights charts — chronological, most recent `limit`."""
    player = get_or_create_player(db, device_id)
    rows = (
        db.query(models.Run)
        .filter(models.Run.player_id == player.id)
        .order_by(models.Run.created_at.desc(), models.Run.id.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(rows))
