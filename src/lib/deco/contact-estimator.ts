import { SMPL_VERTEX_COUNT, type ImageCues, type PoseMixture, type SmplMesh } from "./types";
import { smoothField } from "./smpl";

const PART_WEIGHTS: Record<
  string,
  {
    standing: number;
    sitting: number;
    lying: number;
    leaning: number;
    crouching: number;
    hands: number;
    back: number;
    feet: number;
  }
> = {
  leftToeBase: { standing: 0.95, sitting: 0.55, lying: 0.12, leaning: 0.7, crouching: 0.8, hands: 0, back: 0, feet: 1 },
  rightToeBase: { standing: 0.95, sitting: 0.55, lying: 0.12, leaning: 0.7, crouching: 0.8, hands: 0, back: 0, feet: 1 },
  leftFoot: { standing: 0.92, sitting: 0.62, lying: 0.18, leaning: 0.72, crouching: 0.82, hands: 0, back: 0, feet: 1 },
  rightFoot: { standing: 0.92, sitting: 0.62, lying: 0.18, leaning: 0.72, crouching: 0.82, hands: 0, back: 0, feet: 1 },
  leftLeg: { standing: 0.08, sitting: 0.28, lying: 0.35, leaning: 0.12, crouching: 0.45, hands: 0, back: 0, feet: 0.15 },
  rightLeg: { standing: 0.08, sitting: 0.28, lying: 0.35, leaning: 0.12, crouching: 0.45, hands: 0, back: 0, feet: 0.15 },
  leftUpLeg: { standing: 0.06, sitting: 0.88, lying: 0.72, leaning: 0.18, crouching: 0.7, hands: 0.05, back: 0.08, feet: 0 },
  rightUpLeg: { standing: 0.06, sitting: 0.88, lying: 0.72, leaning: 0.18, crouching: 0.7, hands: 0.05, back: 0.08, feet: 0 },
  hips: { standing: 0.05, sitting: 0.94, lying: 0.82, leaning: 0.22, crouching: 0.55, hands: 0.05, back: 0.2, feet: 0 },
  spine: { standing: 0.04, sitting: 0.58, lying: 0.88, leaning: 0.72, crouching: 0.12, hands: 0, back: 0.9, feet: 0 },
  spine1: { standing: 0.03, sitting: 0.48, lying: 0.9, leaning: 0.78, crouching: 0.08, hands: 0, back: 0.95, feet: 0 },
  spine2: { standing: 0.03, sitting: 0.38, lying: 0.86, leaning: 0.7, crouching: 0.06, hands: 0, back: 0.92, feet: 0 },
  leftShoulder: { standing: 0.04, sitting: 0.22, lying: 0.55, leaning: 0.45, crouching: 0.08, hands: 0.05, back: 0.35, feet: 0 },
  rightShoulder: { standing: 0.04, sitting: 0.22, lying: 0.55, leaning: 0.45, crouching: 0.08, hands: 0.05, back: 0.35, feet: 0 },
  leftArm: { standing: 0.05, sitting: 0.18, lying: 0.42, leaning: 0.2, crouching: 0.12, hands: 0.15, back: 0.08, feet: 0 },
  rightArm: { standing: 0.05, sitting: 0.18, lying: 0.42, leaning: 0.2, crouching: 0.12, hands: 0.15, back: 0.08, feet: 0 },
  leftForeArm: { standing: 0.08, sitting: 0.32, lying: 0.48, leaning: 0.22, crouching: 0.18, hands: 0.45, back: 0.05, feet: 0 },
  rightForeArm: { standing: 0.08, sitting: 0.32, lying: 0.48, leaning: 0.22, crouching: 0.18, hands: 0.45, back: 0.05, feet: 0 },
  leftHand: { standing: 0.12, sitting: 0.38, lying: 0.4, leaning: 0.28, crouching: 0.35, hands: 0.95, back: 0, feet: 0 },
  rightHand: { standing: 0.12, sitting: 0.38, lying: 0.4, leaning: 0.28, crouching: 0.35, hands: 0.95, back: 0, feet: 0 },
  leftHandIndex1: { standing: 0.1, sitting: 0.32, lying: 0.35, leaning: 0.24, crouching: 0.3, hands: 0.9, back: 0, feet: 0 },
  rightHandIndex1: { standing: 0.1, sitting: 0.32, lying: 0.35, leaning: 0.24, crouching: 0.3, hands: 0.9, back: 0, feet: 0 },
  neck: { standing: 0.02, sitting: 0.06, lying: 0.28, leaning: 0.08, crouching: 0.04, hands: 0, back: 0.12, feet: 0 },
  head: { standing: 0.01, sitting: 0.04, lying: 0.22, leaning: 0.05, crouching: 0.03, hands: 0, back: 0.06, feet: 0 },
};

function hash01(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function estimateContact(
  mesh: SmplMesh,
  pose: PoseMixture,
  cues: ImageCues,
): Float32Array {
  const raw = new Float32Array(SMPL_VERTEX_COUNT);
  const partScore = new Map<string, number>();

  for (const [part, w] of Object.entries(PART_WEIGHTS)) {
    const base =
      w.standing * pose.standing +
      w.sitting * pose.sitting +
      w.lying * pose.lying +
      w.leaning * pose.leaning +
      w.crouching * pose.crouching +
      w.hands * pose.handsSupport * 0.55 +
      w.back * pose.backSupport * 0.5 +
      w.feet * pose.feetSupport * 0.45;
    partScore.set(part, Math.min(0.98, Math.max(0.01, base)));
  }

  const fp = cues.fingerprint;
  const seed =
    fp.reduce((a, b, i) => a + b * (i + 1.37), 0) * 1000 +
    cues.meanLuma * 17 +
    cues.woodWarmth * 31;

  for (const [part, indices] of Object.entries(mesh.parts)) {
    const score = partScore.get(part) ?? 0.04;
    for (let k = 0; k < indices.length; k++) {
      const vi = indices[k];
      const jitter = (hash01(seed + vi * 0.137) - 0.5) * 0.16;
      const spatial = (hash01(seed * 0.19 + vi) - 0.5) * 0.1;
      const v = score + jitter + spatial;
      if (v > raw[vi]) raw[vi] = v;
    }
  }

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === 0) {
      raw[i] = 0.03 + hash01(seed + i * 0.011) * 0.04;
    }
  }

  const smoothed = smoothField(raw, mesh.adjacency, 4, 0.58);
  const out = new Float32Array(SMPL_VERTEX_COUNT);
  for (let i = 0; i < out.length; i++) {
    const logit = (smoothed[i] - 0.42) * 8.5;
    out[i] = Math.min(0.995, Math.max(0.004, sigmoid(logit)));
  }
  return out;
}

export function countContact(prob: Float32Array, threshold: number): number {
  let n = 0;
  for (let i = 0; i < prob.length; i++) if (prob[i] >= threshold) n++;
  return n;
}

export function partContactSummary(
  mesh: SmplMesh,
  prob: Float32Array,
  threshold: number,
): { part: string; fraction: number; count: number }[] {
  const rows: { part: string; fraction: number; count: number }[] = [];
  for (const [part, indices] of Object.entries(mesh.parts)) {
    let c = 0;
    for (const i of indices) if (prob[i] >= threshold) c++;
    rows.push({ part, fraction: c / Math.max(1, indices.length), count: c });
  }
  rows.sort((a, b) => b.fraction - a.fraction);
  return rows;
}
