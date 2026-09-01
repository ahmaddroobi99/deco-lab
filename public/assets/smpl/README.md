# SMPL assets (MPI-licensed)

These files are the official DECO canonical SMPL **neutral T-pose**:

| File | Role |
| --- | --- |
| `smpl_neutral_tpose.f32` | 6,890 × 3 float32 vertices (Y-up, metres) |
| `smpl_neutral_tpose.u32` | 13,776 × 3 uint32 triangle indices |
| `smpl_neutral_tpose.ply` | same mesh as ASCII/binary PLY |
| `smpl_vert_segmentation.json` | per-part vertex lists |
| `smpl_meta.json` | topology metadata used by the lab |

They originate from the DECO data release (`data/smpl/smpl_neutral_tpose.ply`)
and remain copyright Max-Planck-Gesellschaft / MPI-IS.

**Not OSI open source.** Research / non-commercial use only.
See [`LICENSE`](../../../LICENSE) and [`LICENSES/DECO_LICENSE.md`](../../../LICENSES/DECO_LICENSE.md).

Official DECO-HRNet weights (`deco_best.pth`) are **not** in this directory
and must not be added.
