# System overview

## Purpose

DECO Lab lets a researcher upload an RGB photograph of a person, run a
DECO-protocol contact pass, and inspect **per-vertex human–scene contact**
on the canonical SMPL T-pose as an interactive 3D mesh.

It is **not** a posed 3D reconstruction of the subject. Official DECO
(Tripathi et al., ICCV 2023) also predicts contact on the T-pose, not
scene geometry or SMPL pose/shape.

## Users

Computer-vision, graphics, and robotics researchers evaluating contact
hypotheses on in-the-wild images. Non-commercial / research use only.

## Main components

| Component | Responsibility |
| --- | --- |
| Lab UI (`LabShell`) | Upload, examples, diagnostics, layout |
| Client pipeline (`src/lib/deco`) | 256×256 raster, image cues, pose mixture, 6,890 probabilities |
| SMPL assets (`public/assets/smpl`) | Official T-pose vertices, faces, part segmentation |
| Three.js viewer | Orbit / zoom / pan, vertex colors, camera presets |
| Exports | PLY, OBJ, GLB, JSON, PNG |
| `GET /api/health`, `GET /api/system` | Read-only capability metadata |

## Communication

Almost all work is **in-process in the browser**. The server only serves
static assets, SSR HTML, and two JSON GET endpoints. Images are not
uploaded to a backend.

```
User → React lab → image-conditioned estimator → SMPL mesh + colors → WebGL
                 ↘ GET /api/health (diagnostics only)
```

## Storage

- No application database
- No persisted uploads
- Mesh binaries are static files
- Zustand holds one session (image, result, threshold) in memory

## External dependencies

- Official DECO paper / mesh topology (MPI, non-commercial)
- npm: React 19, TanStack Start, Three.js, Zustand
- Hosting: Vercel (Nitro `vercel` preset)

## Failure modes

| Failure | Behaviour |
| --- | --- |
| Bad image type / size | Client validation, no inference |
| Missing SMPL asset | Viewer error string, pipeline throws |
| No WebGL | Diagnostics warn; 3D pane cannot render |
| API down | Lab still runs; diagnostics show backend waiting |

## Security boundaries

The trust boundary is the user's browser. Photographs never leave the
client for inference. See [security.md](./security.md).

## Scalability

Each session is independent and CPU-bound in the tab. The static mesh is
~250 KB. Horizontal scale is "more browsers". There is no shared job queue.

## Current limitations

- Contact probabilities are **not** DECO-HRNet logits (no 1.56 GB CUDA checkpoint)
- Geometry is the canonical T-pose, not the person's pose
- No scene mesh, no SMPL β/θ, no metric dimensions
