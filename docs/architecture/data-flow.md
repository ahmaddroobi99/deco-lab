# Data flow

```mermaid
flowchart TD
  A[RGB file or example URL] --> B[HTMLImageElement]
  B --> C[Canvas raster 256×256]
  C --> D[ImageCues: skin, mass, furniture, fingerprint]
  D --> E[PoseMixture: sit / stand / lie / lean / crouch]
  F[SMPL verts + faces + parts] --> G[Per-vertex scores]
  E --> G
  D --> G
  G --> H[Laplacian smooth on mesh adjacency]
  H --> I["contactProbability Float32Array 6890"]
  I --> J[Threshold visualization]
  J --> K[Vertex colors on T-pose]
  I --> L[JSON / PLY export]
```

Shapes (enforced in tests):

| Stage | Shape |
| --- | --- |
| Model input | `256 × 256 × RGB` |
| Contact | `(6890,)` in `(0, 1)` |
| Vertices | `(6890, 3)` float32 |
| Faces | `(13776, 3)` uint32 |
| Default threshold | `0.5` |

Thresholding is visualization only. The stored probability vector is
unchanged when the slider moves.
