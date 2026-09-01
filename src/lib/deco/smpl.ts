import { SMPL_FACE_COUNT, SMPL_VERTEX_COUNT, type SmplMesh } from "./types";

interface SmplMeta {
  bodyModel: string;
  pose: string;
  vertexCount: number;
  faceCount: number;
  parts: Record<string, number[]>;
}

let cached: Promise<SmplMesh> | null = null;

function buildAdjacency(faces: Uint32Array, vertexCount: number): number[][] {
  const adj: Set<number>[] = Array.from({ length: vertexCount }, () => new Set());
  for (let i = 0; i < faces.length; i += 3) {
    const a = faces[i];
    const b = faces[i + 1];
    const c = faces[i + 2];
    adj[a].add(b);
    adj[a].add(c);
    adj[b].add(a);
    adj[b].add(c);
    adj[c].add(a);
    adj[c].add(b);
  }
  return adj.map((s) => Array.from(s));
}

export async function loadSmplMesh(): Promise<SmplMesh> {
  if (cached) return cached;
  cached = (async () => {
    const [vertBuf, faceBuf, metaRes] = await Promise.all([
      fetch("/assets/smpl/smpl_neutral_tpose.f32").then((r) => {
        if (!r.ok) throw new Error("Failed to load SMPL vertices");
        return r.arrayBuffer();
      }),
      fetch("/assets/smpl/smpl_neutral_tpose.u32").then((r) => {
        if (!r.ok) throw new Error("Failed to load SMPL faces");
        return r.arrayBuffer();
      }),
      fetch("/assets/smpl/smpl_meta.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load SMPL metadata");
        return r.json() as Promise<SmplMeta>;
      }),
    ]);

    const vertices = new Float32Array(vertBuf);
    const faces = new Uint32Array(faceBuf);
    const vertexCount = vertices.length / 3;
    const faceCount = faces.length / 3;

    if (vertexCount !== SMPL_VERTEX_COUNT) {
      throw new Error(`Unexpected SMPL vertex count: ${vertexCount}`);
    }
    if (faceCount !== SMPL_FACE_COUNT) {
      throw new Error(`Unexpected SMPL face count: ${faceCount}`);
    }

    return {
      vertices,
      faces,
      parts: metaRes.parts,
      adjacency: buildAdjacency(faces, vertexCount),
      vertexCount,
      faceCount,
    };
  })();
  return cached;
}

export function smoothField(
  values: Float32Array,
  adjacency: number[][],
  iterations = 3,
  retain = 0.62,
): Float32Array {
  let current = values;
  for (let n = 0; n < iterations; n++) {
    const next = new Float32Array(current.length);
    for (let i = 0; i < current.length; i++) {
      const nbrs = adjacency[i];
      if (!nbrs.length) {
        next[i] = current[i];
        continue;
      }
      let sum = 0;
      for (const j of nbrs) sum += current[j];
      next[i] = retain * current[i] + (1 - retain) * (sum / nbrs.length);
    }
    current = next;
  }
  return current;
}
