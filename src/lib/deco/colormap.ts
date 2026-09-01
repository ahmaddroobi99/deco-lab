export const BASE_MESH: [number, number, number] = [0.78, 0.82, 0.8];
export const CONTACT_GREEN: [number, number, number] = [0.18, 0.88, 0.54];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Scientific sequential ramp: slate → teal → mint. Data viz, not brand chrome. */
export function probabilityColor(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  const c0: [number, number, number] = [0.18, 0.22, 0.24];
  const c1: [number, number, number] = [0.22, 0.55, 0.52];
  const c2: [number, number, number] = [0.24, 0.88, 0.54];
  const c3: [number, number, number] = [0.78, 0.96, 0.72];
  if (x < 0.33) return lerp3(c0, c1, x / 0.33);
  if (x < 0.66) return lerp3(c1, c2, (x - 0.33) / 0.33);
  return lerp3(c2, c3, (x - 0.66) / 0.34);
}

export function paintVertexColors(
  target: Float32Array,
  probability: Float32Array,
  mode: "neutral" | "binary" | "probability" | "combined",
  threshold: number,
): void {
  const n = probability.length;
  for (let i = 0; i < n; i++) {
    const p = probability[i];
    let rgb: [number, number, number];
    if (mode === "neutral") {
      rgb = BASE_MESH;
    } else if (mode === "binary" || mode === "combined") {
      rgb = p >= threshold ? CONTACT_GREEN : BASE_MESH;
    } else {
      rgb = probabilityColor(p);
    }
    const o = i * 3;
    target[o] = rgb[0];
    target[o + 1] = rgb[1];
    target[o + 2] = rgb[2];
  }
}
