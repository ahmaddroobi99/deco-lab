# Changelog

## 0.1.0 — 2026-09-01

- Interactive DECO Lab: upload RGB, run a DECO-protocol contact pass, inspect the SMPL T-pose in Three.js
- Vertex-level probabilities (6,890), live threshold, binary / probability / wireframe / points / combined
- Exports: PLY (vertex colors), OBJ, GLB, JSON, PNG
- Client-side estimator (no CUDA checkpoint on this host)
- Health and system JSON endpoints with a shared contract module
- Unit tests for SMPL topology, contact mapping, colormap, pose cues, API contract, and mesh exports
- Architecture, operations, and ML-pipeline documentation
- GitHub Actions CI (typecheck, test, lint, build)
