# Debugging

- **Blank 3D pane:** WebGL missing, or SMPL fetch 404. Check diagnostics
  and `/assets/smpl/smpl_neutral_tpose.f32`.
- **Dark / cropped body:** camera too close for T-pose arm span; presets
  live in `Viewer3D.tsx`.
- **Same contact on every image:** estimator should be image-conditioned
  (`deco.test.ts` asserts sitting ≠ standing).
- **Export empty:** run inference first; buttons disable without a result.
- **SSR crash:** Canvas is client-only; keep Three.js inside `Viewer3D`.
