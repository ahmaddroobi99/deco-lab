# ADR 0001 — Client-side DECO-protocol estimator

## Decision

Run contact estimation in the browser on the official SMPL topology
instead of loading `deco_best.pth`.

## Reason

The official checkpoint is ~1.56 GB, CUDA-only, and MPI-licensed with
**no redistribution**. This host has no NVIDIA GPU and must not ship
the weights.

## Tradeoff

Probabilities follow DECO I/O and visualization, but they are not the
published network's logits. The UI states this explicitly.

## Alternative

A separate GPU inference service. Rejected for this deployment: license,
cost, and cold-start size.

## Why not a fake mesh

The 6,890-vertex T-pose and part segmentation **are** the official
assets. Geometry is real; the classifier is the substitute.
