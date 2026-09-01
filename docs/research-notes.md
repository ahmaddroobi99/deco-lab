# DECO research notes

## What DECO does

DECO (Dense Estimation of 3D Human-Scene COntact) takes a **single RGB image**
and predicts a **per-vertex contact probability** on the **canonical SMPL**
body (6,890 vertices). It is **not** a monocular 3D human reconstruction
model. It does not output pose, shape, scene meshes, or camera parameters.

Official pipeline (`inference.py`):

1. Read RGB image
2. Resize to 256×256
3. Run DECO-HRNet (`DECO('hrnet', True, device)`)
4. Receive `cont` with shape `(6890,)` after squeeze, values in `[0, 1]` (sigmoid)
5. Threshold at **0.5** for binary contact
6. Color the official `smpl_neutral_tpose.ply`
7. Export a colored mesh (`pred.obj`) and a multi-view render

## Architecture (official)

Dual HRNet-w32 encoders (scene-semantic and body-part) → optional mask
decoders (133 scene classes, 26 parts) → global pool to 480-D descriptors →
cross-attention → classifier `Linear(480→4096→6890) + Sigmoid`.

## What this workstation does

- Loads the **official SMPL T-pose mesh** (validated 6,890 verts / 13,776 faces)
- Uses official **vertex-part segmentation**
- Follows DECO I/O: 256×256 RGB in, 6,890 probabilities out, 0.5 threshold
- Visualizes contact on the T-pose in an interactive Three.js viewer
- Does **not** load `deco_best.pth` (1.56 GB, CUDA, MPI license, exceeds this host)

Contact probabilities here are produced by an **image-conditioned estimator**
that mirrors DECO's three-branch idea (scene cues, part/pose cues, per-vertex
classification + mesh smoothing). They are **not** DECO-HRNet logits.

## Limitations

- Canonical T-pose geometry, not a posed reconstruction of the person
- No metric body dimensions
- No scene mesh
- No official HRNet weights in this hosted environment
- CUDA was unavailable at build time (4 GB RAM, no NVIDIA GPU)

## Citation

```
@InProceedings{Tripathi_2023_ICCV,
    author    = {Tripathi, Shashank and Chatterjee, Agniv and Passy, Jean-Claude and Yi, Hongwei and Tzionas, Dimitrios and Black, Michael J.},
    title     = {DECO: Dense Estimation of {3D} Human-Scene Contact In The Wild},
    booktitle = {Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV)},
    month     = {October},
    year      = {2023},
    pages     = {8001-8013}
}
```
