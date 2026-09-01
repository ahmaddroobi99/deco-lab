# ML / contact pipeline

Official DECO-HRNet is **not executed** in this host. This document
describes (1) what the paper does and (2) what the lab actually runs.

## Official DECO (paper / `inference.py`)

```
RGB → resize 256×256 → DECO('hrnet') → sigmoid contact (6890,)
    → threshold 0.5 → color smpl_neutral_tpose.ply
```

Dual HRNet-w32 encoders (scene-semantic, body-part) → cross-attention →
`Linear(480→4096→6890)+Sigmoid`. Checkpoint `deco_best.pth` ≈ 1.56 GB,
CUDA, MPI license, not redistributed.

## Lab estimator (this repo)

```
RGB → 256×256 ImageData
    → ImageCues (skin, vertical mass, furniture/sky, luma fingerprint)
    → PoseMixture (sit/stand/lie/lean/crouch + support)
    → part-weighted per-vertex scores on official segmentation
    → 4-iteration Laplacian smooth on SMPL adjacency
    → sigmoid
    → Float32Array(6890)
```

Hardware: browser CPU. Latency: typically well under a second (measured
per run in the UI). Memory: one mesh + one probability vector.

Limitations: not HRNet logits; T-pose only; no metric reconstruction.

Tests in `src/lib/deco/deco.test.ts` lock topology, value ranges, and
the fact that sitting vs standing maps produce different fields.
