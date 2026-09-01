# Monitoring

No APM is wired. Practical signals:

- Vercel deployment status and function logs for `/api/health`
- `GET /api/health` as a liveness probe (`status: "ok"`)
- Browser console on the production URL (WebGL / asset errors)

There is no job queue to monitor.
