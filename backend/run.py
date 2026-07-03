"""Dev server entry: python run.py — binds 0.0.0.0:8000 so devices on the LAN
(Expo Go on a phone) can reach it."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
