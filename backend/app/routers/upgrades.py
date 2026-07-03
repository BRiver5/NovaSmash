from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import current_player
from ..seed import MAX_UPGRADE_LEVEL

router = APIRouter(prefix="/upgrades", tags=["upgrades"])

LEVEL_ATTR = {
    "fire_rate": "fire_rate_level",
    "turn_speed": "turn_speed_level",
    "damage": "damage_level",
}


@router.get("/costs", response_model=list[schemas.UpgradeCostOut])
def costs(db: Session = Depends(get_db)):
    """Full cost table so clients never hardcode prices (spec §6)."""
    return (
        db.query(models.UpgradeCost)
        .order_by(models.UpgradeCost.upgrade_type, models.UpgradeCost.level)
        .all()
    )


@router.post("/purchase", response_model=schemas.PlayerOut)
def purchase(
    body: schemas.PurchaseIn,
    player: models.Player = Depends(current_player),
    db: Session = Depends(get_db),
):
    """Validate balance against UpgradeCost, deduct, increment level.

    Rejects with a clear error when already max level or insufficient funds.
    """
    attr = LEVEL_ATTR[body.upgrade_type]
    current_level: int = getattr(player, attr)
    if current_level >= MAX_UPGRADE_LEVEL:
        raise HTTPException(status_code=409, detail="Upgrade already at max level")

    cost_row = (
        db.query(models.UpgradeCost)
        .filter(
            models.UpgradeCost.upgrade_type == body.upgrade_type,
            models.UpgradeCost.level == current_level + 1,
        )
        .first()
    )
    if cost_row is None:
        raise HTTPException(status_code=409, detail="No cost defined for next level")
    if player.space_coins < cost_row.coin_cost:
        raise HTTPException(status_code=409, detail="Insufficient Space Coins")

    player.space_coins -= cost_row.coin_cost
    setattr(player, attr, current_level + 1)
    db.commit()
    db.refresh(player)
    return player
