# Contributing

This is a **research / non-commercial** workstation. Please read `LICENSE`
and `LICENSES/DECO_LICENSE.md` before sending changes.

## Scope

Welcome:

- Bug fixes in the viewer, exports, or image-conditioned estimator
- Documentation and test coverage
- Accessibility and performance improvements that do not change scientific meaning

Not in scope:

- Redistributing `deco_best.pth` or other MPI checkpoints
- Claiming this estimator is official DECO-HRNet
- Commercial, military, or surveillance applications
- Posed 3D reconstruction (DECO does not do that)

## Setup

```bash
git clone https://github.com/ahmaddroobi99/deco-lab.git
cd deco-lab
npm install
npm run dev
```

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Citation

Any publication that uses DECO Lab or DECO must cite Tripathi et al., ICCV 2023.
See `CITATION.cff` and the README.

## Pull requests

Keep PRs small. Describe the scientific or engineering change, not just the diff.
Do not commit `.env`, checkpoints, or `node_modules`.
