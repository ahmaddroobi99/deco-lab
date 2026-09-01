# Operations — deployment

## Path

1. Push `main` to GitHub
2. GitHub Actions runs typecheck, test, lint, build
3. Vercel builds `npm run build` (Nitro vercel preset)
4. Production URL serves SSR + static assets

## Env

None required. Do not set `VITE_AUTH_ENABLED=true` unless you intend to
wire accounts (not used by the lab).

## Rollback

Vercel dashboard → previous production deployment → Promote.

## Blocker: Vercel billing (2026-09-01)

Project creation on the Pro team is suspended (`resource_creation_blocked`,
HTTP 402). Reactivate at
https://vercel.com/teams/ahmads-projects-76bdf265/settings/billing
then link this repository. Do not overwrite the existing `time7` project.

## Common failures

| Symptom | Cause |
| --- | --- |
| Blank page, JS MIME text/html | Asset 404 / wrong base path |
| Build OOM | Do not bundle `deco_best.pth` |
| 404 on `/assets/smpl/*` | Files missing from `public/` |
| 402 on project create | Team billing suspended |
