"""Database engine + session factory.

SQLite engine for local-first simplicity. Structured so the connection URL
can later point at Postgres/MySQL without touching call sites: only change
DATABASE_URL (and drop the SQLite-specific connect_args).
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.environ.get(
    "NOVASMASH_DATABASE_URL",
    f"sqlite:///{os.path.join(BASE_DIR, '..', 'novasmash.db')}",
)

# check_same_thread is SQLite-only; harmless to remove when swapping engines.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
