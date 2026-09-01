# Operations — deployment

## Path

1. Push `main` to GitHub (CI: typecheck, test, lint, build)
2. Netlify production: `npm run build` with `NETLIFY=true` → Nitro `netlify` preset
3. URL: https://deco-lab.netlify.app

`netlify.toml` sets `publish = "dist"`, Node 22, `VITE_AUTH_ENABLED=false`.

## Env

| Key | Value |
| --- | --- |
| `VITE_AUTH_ENABLED` | `false` |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | `1` |

Do not set `VITE_AUTH_ENABLED=true`.

## Rollback

Netlify dashboard → Deploys → previous production deploy → Publish.

## Vercel (not live)

Project creation on the Pro team is suspended (`resource_creation_blocked`, HTTP 402). Reactivate at
https://vercel.com/teams/ahmads-projects-76bdf265/settings/billing
then link this repository as a **new** project. Do not overwrite `time7`.

## Common failures

| Symptom | Cause |
| --- | --- |
| Blank page, JS MIME text/html | Asset 404 / wrong publish dir (must be `dist`) |
| Build OOM | Do not bundle `deco_best.pth` |
| 404 on `/assets/smpl/*` | Files missing from `public/` |
| Slow Netlify upload | Deploying `node_modules` / `vendor` — use `.netlifyignore` |
| 402 on Vercel project create | Team billing suspended |
