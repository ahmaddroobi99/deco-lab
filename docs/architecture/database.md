# Database

DECO Lab does **not** use a database.

Session state lives in Zustand in the tab. Uploaded images are
`blob:` URLs. Results are typed arrays in memory.

`src/lib/db.ts` and `migrations/auth/` exist because the App Builder
template ships PGLite/Postgres helpers. They are unused: auth is off,
and no lab code imports `@/lib/db`.
