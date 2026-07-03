"""NovaSmash FastAPI entry point.

Mirror API for the offline-first mobile app: players (keyed by anonymous
device UUID), run history, and the canonical upgrade-cost table. Tables are
created and seeded on startup. CORS is wide-open for local dev so the Expo
app can reach it over the LAN.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import player, runs, upgrades
from .seed import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="NovaSmash API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local dev only
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(player.router)
app.include_router(runs.router)
app.include_router(upgrades.router)


@app.get("/")
def root():
    return {"app": "NovaSmash", "tagline": "No asteroid can stop you"}
