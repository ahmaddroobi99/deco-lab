# Frontend

React 19 + TanStack Router file routes. The only product route is `/`.

## Shell

[`src/components/lab/LabShell.tsx`](../../src/components/lab/LabShell.tsx) is a three-column lab:

- Left: upload, examples, diagnostics
- Center: original image + WebGL canvas
- Right: render mode, threshold, camera, part bars, export

## 3D viewer

[`Viewer3D.tsx`](../../src/components/lab/Viewer3D.tsx) uses React Three Fiber.

- Geometry: official 6,890-vertex buffer, `Uint16` index
- Material: `MeshLambertMaterial` + vertex colors (data vis, not PBR glamour)
- `Canvas flat` / `NoToneMapping` so contact greens stay linear
- OrbitControls, gizmo, camera presets, optional auto-rotate
- PNG snapshot reads `preserveDrawingBuffer`

Camera distance is framed for a T-pose arm span in a narrow split pane.

## State

Zustand (`store.ts`): one uploaded image, one `DecoResult`, threshold,
render mode, view mode, camera. Changing the threshold **does not** rerun
inference.

## Styling

Dark scientific tokens in `src/styles.css` (`@theme`). IBM Plex Sans/Mono.
