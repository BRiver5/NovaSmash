"""Shared dependencies: resolve (or auto-create) the player from X-Device-ID.

Spec §6: every endpoint auto-registers unknown devices instead of erroring,
since there is no explicit registration flow the user interacts with.
"""
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from . import models
from .database import get_db


def get_or_create_player(
    db: Session,
    device_id: str,
) -> models.Player:
    player = (
        db.query(models.Player).filter(models.Player.device_id == device_id).first()
    )
    if player is None:
        player = models.Player(device_id=device_id)
        db.add(player)
        db.commit()
        db.refresh(player)
    return player


def current_player(
    x_device_id: str | None = Header(default=None, alias="X-Device-ID"),
    db: Session = Depends(get_db),
) -> models.Player:
    if not x_device_id:
        raise HTTPException(status_code=400, detail="X-Device-ID header required")
    return get_or_create_player(db, x_device_id)
