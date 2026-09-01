# Backend

There is no job queue, no object store, and no model server.

TanStack Start file routes expose two **read-only** JSON handlers:

- [`src/routes/api/health.ts`](../../src/routes/api/health.ts)
- [`src/routes/api/system.ts`](../../src/routes/api/system.ts)

SSR renders the document shell. Static files under `public/` (SMPL
binaries, examples, OG images) are served as-is.

Nitro is configured with the `vercel` preset **only on build/preview**
(`vite.config.ts`) so local `npm run dev` stays on a single port.

## What the server does not do

- Receive uploaded images
- Run PyTorch / CUDA
- Write the filesystem at request time
- Authenticate users
