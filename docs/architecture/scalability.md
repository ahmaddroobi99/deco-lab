# Scalability

Each user runs inference on their own CPU. There is no shared GPU
queue.

| Resource | Notes |
| --- | --- |
| Static SMPL | ~250 KB, cached by CDN |
| JS bundle | Three.js + drei dominate (~hundreds of KB gzipped) |
| Inference | O(vertices + faces); 6,890 verts, milliseconds on desktop |
| Vercel | SSR document + static assets; endpoints are tiny JSON |

To run official DECO-HRNet you need a GPU box (CUDA, ~1.6 GB weights,
PyTorch). That is a different deployment unit and is not this app.
