import type { SmplMesh } from "./types";
import { paintVertexColors } from "./colormap";

function rgbByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

export function buildPly(
  mesh: SmplMesh,
  probability: Float32Array,
  mode: "neutral" | "binary" | "probability" | "combined",
  threshold: number,
): Blob {
  const n = mesh.vertexCount;
  const colors = new Float32Array(n * 3);
  paintVertexColors(colors, probability, mode, threshold);
  const lines: string[] = [];
  lines.push("ply");
  lines.push("format ascii 1.0");
  lines.push("comment DECO Lab SMPL contact visualization");
  lines.push(`element vertex ${n}`);
  lines.push("property float x");
  lines.push("property float y");
  lines.push("property float z");
  lines.push("property uchar red");
  lines.push("property uchar green");
  lines.push("property uchar blue");
  lines.push(`element face ${mesh.faceCount}`);
  lines.push("property list uchar int vertex_indices");
  lines.push("end_header");
  const v = mesh.vertices;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    lines.push(
      `${v[o].toFixed(6)} ${v[o + 1].toFixed(6)} ${v[o + 2].toFixed(6)} ${rgbByte(colors[o])} ${rgbByte(colors[o + 1])} ${rgbByte(colors[o + 2])}`,
    );
  }
  const f = mesh.faces;
  for (let i = 0; i < f.length; i += 3) {
    lines.push(`3 ${f[i]} ${f[i + 1]} ${f[i + 2]}`);
  }
  return new Blob([lines.join("\n")], { type: "text/plain" });
}

export function buildObj(mesh: SmplMesh): Blob {
  const lines: string[] = ["# DECO Lab SMPL T-pose", "# vertex-level contact is in companion JSON / PLY"];
  const v = mesh.vertices;
  for (let i = 0; i < mesh.vertexCount; i++) {
    const o = i * 3;
    lines.push(`v ${v[o].toFixed(6)} ${v[o + 1].toFixed(6)} ${v[o + 2].toFixed(6)}`);
  }
  const f = mesh.faces;
  for (let i = 0; i < f.length; i += 3) {
    lines.push(`f ${f[i] + 1} ${f[i + 1] + 1} ${f[i + 2] + 1}`);
  }
  return new Blob([lines.join("\n")], { type: "text/plain" });
}

export function buildJson(
  mesh: SmplMesh,
  probability: Float32Array,
  threshold: number,
  extra: Record<string, unknown>,
): Blob {
  const contactBinary = Array.from(probability, (p) => p >= threshold);
  const payload = {
    model: extra.estimator ?? "DECO-protocol",
    body_model: "SMPL",
    pose: "neutral_tpose",
    vertex_count: mesh.vertexCount,
    face_count: mesh.faceCount,
    contact_threshold: threshold,
    contact_vertex_count: contactBinary.filter(Boolean).length,
    contact_probability: Array.from(probability),
    contact_binary: contactBinary,
    ...extra,
  };
  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
