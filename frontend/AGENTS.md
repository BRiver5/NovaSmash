# NovaSmash frontend — Expo SDK 54.0.8 (pinned)

This app is pinned to **Expo SDK 54.0.8** per the project spec — do **not** upgrade/downgrade.
Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before changing dependencies.

When adding any native package, always use `npx expo install <pkg>` so the version
resolves against SDK 54's React Native (0.81.4). Never `npm install` a native module directly.

Key versions: react 19.1.0, react-native 0.81.4, expo-router 6, reanimated 4 (worklets
babel plugin in `babel.config.js`), react-native-svg 15.12.1. Charts are hand-built with
`react-native-svg` (no Skia/victory dependency).

Architecture: offline-first. `services/localDb.ts` (expo-sqlite) is the source of truth;
the FastAPI backend in `../backend` is an optional mirror synced via `services/sync.ts`.
All gameplay tuning lives in `constants/gameConfig.ts` — never hardcode balance values
in the game loop (`game/engine.ts` is pure TS with no RN imports).
