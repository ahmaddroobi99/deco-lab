# Security

## Model

DECO Lab processes images **in the browser**. Uploaded photographs never
leave the client for inference. There is no user account store and no
application database.

## Reporting

Please open a GitHub issue titled `security: …` for:

- XSS via uploaded images or export filenames
- Path traversal or unexpected static-file exposure
- Supply-chain issues in dependencies

Do not file reports that require redistributing MPI checkpoints.

## What this project does not do

- No authentication
- No server-side image storage
- No secret API keys required at runtime
- No CUDA / PyTorch service to attack

If you find a credential in git history, rotate it and open an issue.
None are expected in this repository.
