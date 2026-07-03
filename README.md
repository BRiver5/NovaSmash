# NovaSmash

*"No asteroid can stop you."*

Retro pixel-art vertical space shooter for Android (Google Play MVP). The ship
auto-flies up through an endless asteroid field; steer with press-and-hold
left/right touch zones, shooting is automatic. Earn Space Coins, buy permanent
upgrades (Fire Rate / Turn Speed / Damage), track your history on the Insights
charts. No accounts — identity is a silent anonymous device UUID.

## Structure

- `frontend/` — Expo SDK 54 + expo-router + TypeScript + zustand + reanimated.
  Offline-first: `expo-sqlite` on the device is the source of truth.
- `backend/` — FastAPI + SQLAlchemy + SQLite mirror keyed by `X-Device-ID`.
  Optional: the app is fully functional without it.

## Run

Backend (optional, LAN mirror):

```powershell
cd backend
python -m venv venv
./venv/Scripts/pip install -r requirements.txt
./venv/Scripts/python run.py   # http://0.0.0.0:8000
```

Frontend:

```powershell
cd frontend
npm install
npx expo start
```

The app derives the backend URL from the Expo dev host (`<host>:8000`);
override with `EXPO_PUBLIC_API_URL`.

## Tuning

All gameplay balance lives in `frontend/constants/gameConfig.ts` (spawn curve,
difficulty steps, base stats, upgrade cost table). The backend's canonical cost
table is seeded in `backend/app/seed.py` — keep the two in sync.
