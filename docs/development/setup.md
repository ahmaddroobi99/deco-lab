# Setup

Requires Node.js 22+.

```bash
git clone https://github.com/ahmaddroobi99/deco-lab.git
cd deco-lab
npm install
cp .env.example .env   # optional; empty of secrets
npm run dev
```

Open the printed local URL. The lab loads the SMPL T-pose from
`/assets/smpl/`.

No CUDA, no Python, no MPI login is required for this estimator.
Official weights are a separate research setup (`vendor` is not shipped).
