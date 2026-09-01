# Reliability

- Pipeline stages are try/caught in the Zustand `run()` action; errors
  surface in `ProcessingOverlay` with retry.
- SMPL load is memoized; a missing asset fails closed.
- Image validation rejects empty, huge, or unknown types before decode.
- No retries against a model server because there isn't one.
- Rollback is "redeploy the previous Vercel deployment".
