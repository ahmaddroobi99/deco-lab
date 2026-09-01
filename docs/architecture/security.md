# Security

## Trust boundary

Photographs are decoded and rasterized in the browser. They are not
posted to `/api/*`. XSS risk is limited to how filenames and JSON
exports are handled (download via `Blob`, not innerHTML).

## Auth

Off. No cookies, no sessions, no user PII store.

## Secrets

No runtime API keys. `.env` is gitignored. `.env.example` is empty of
credentials.

## MPI materials

SMPL buffers in `public/assets/smpl/` are MPI-licensed research data.
Do not rehost them for commercial products. See `LICENSE` and
`LICENSES/DECO_LICENSE.md`.

## Headers / SSR

TanStack Start + Vercel provide TLS in production. The lab does not
implement a custom CSP (the App Builder PWA injector requires
`https://grok.com` when hosted on that platform).

## Threat model (honest)

This is a local visualization tool, not a multi-tenant SaaS. The main
risks are malicious image decoders in the browser and accidental
license violation if someone ships the mesh commercially.
