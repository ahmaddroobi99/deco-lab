import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { BASE_MESH, CONTACT_GREEN, paintVertexColors, probabilityColor } from "./colormap.ts";
import { countContact, estimateContact, partContactSummary } from "./contact-estimator.ts";
import { HEALTH_PAYLOAD, SYSTEM_PAYLOAD } from "./api-contract.ts";
import { buildObj, buildPly } from "./exports.ts";
import { cuesToPose } from "./image-analysis.ts";
import {
  DEFAULT_CONTACT_THRESHOLD,
  SMPL_FACE_COUNT,
  SMPL_VERTEX_COUNT,
  type ImageCues,
  type PoseMixture,
  type SmplMesh,
} from "./types.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function colorsEq(actual: Float32Array, offset: number, expected: [number, number, number]) {
  for (let k = 0; k < 3; k++) {
    assert.ok(Math.abs(actual[offset + k] - expected[k]) < 1e-5);
  }
}

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

function loadF32(path: string): Float32Array {
  const raw = readFileSync(path);
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
}

function loadU32(path: string): Uint32Array {
  const raw = readFileSync(path);
  return new Uint32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
}

function loadOfficialSmpl(): SmplMesh {
  const vertices = loadF32(join(root, "public/assets/smpl/smpl_neutral_tpose.f32"));
  const faces = loadU32(join(root, "public/assets/smpl/smpl_neutral_tpose.u32"));
  const meta = JSON.parse(readFileSync(join(root, "public/assets/smpl/smpl_meta.json"), "utf8")) as {
    parts: Record<string, number[]>;
  };
  const vertexCount = vertices.length / 3;
  const faceCount = faces.length / 3;
  return {
    vertices,
    faces,
    parts: meta.parts,
    adjacency: buildAdjacency(faces, vertexCount),
    vertexCount,
    faceCount,
  };
}

function pose(partial: Partial<PoseMixture>): PoseMixture {
  return {
    standing: 0.05,
    sitting: 0.05,
    lying: 0.05,
    leaning: 0.05,
    crouching: 0.05,
    handsSupport: 0.1,
    backSupport: 0.1,
    feetSupport: 0.1,
    dominant: "unknown",
    ...partial,
  };
}

function cues(partial: Partial<ImageCues>): ImageCues {
  return {
    width: 256,
    height: 256,
    aspect: 1,
    meanLuma: 0.5,
    skinFraction: 0.1,
    foregroundFraction: 0.4,
    bbox: { x: 40, y: 20, w: 160, h: 200 },
    bboxAspect: 0.8,
    centroidY: 0.5,
    lowerMass: 0.3,
    upperMass: 0.3,
    midMass: 0.4,
    horizontalSpread: 0.2,
    woodWarmth: 0.02,
    outdoorGreen: 0.01,
    skyBlue: 0.01,
    fabricSoft: 0.05,
    edgeEnergy: 0.1,
    fingerprint: Array.from({ length: 20 }, (_, i) => (i + 1) * 0.01),
    ...partial,
  };
}

describe("official SMPL asset", () => {
  const mesh = loadOfficialSmpl();

  it("has DECO topology 6890 / 13776", () => {
    assert.equal(mesh.vertexCount, SMPL_VERTEX_COUNT);
    assert.equal(mesh.faceCount, SMPL_FACE_COUNT);
    assert.equal(mesh.vertices.length, SMPL_VERTEX_COUNT * 3);
    assert.equal(mesh.faces.length, SMPL_FACE_COUNT * 3);
  });

  it("is a Y-up T-pose of human scale", () => {
    let minY = Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < mesh.vertices.length; i += 3) {
      minX = Math.min(minX, mesh.vertices[i]);
      maxX = Math.max(maxX, mesh.vertices[i]);
      minY = Math.min(minY, mesh.vertices[i + 1]);
      maxY = Math.max(maxY, mesh.vertices[i + 1]);
    }
    const height = maxY - minY;
    const span = maxX - minX;
    assert.ok(height > 1.5 && height < 2.0, `height ${height}`);
    assert.ok(span > 1.4 && span < 2.0, `span ${span}`);
  });

  it("face indices stay in range", () => {
    for (let i = 0; i < mesh.faces.length; i++) {
      assert.ok(mesh.faces[i] < mesh.vertexCount);
    }
  });
});

describe("contact estimator", () => {
  const mesh = loadOfficialSmpl();
  const sitting = estimateContact(
    mesh,
    pose({ sitting: 0.85, feetSupport: 0.7, backSupport: 0.7, dominant: "sitting" }),
    cues({ woodWarmth: 0.08, fingerprint: Array.from({ length: 20 }, () => 0.2) }),
  );
  const standing = estimateContact(
    mesh,
    pose({ standing: 0.9, feetSupport: 0.95, dominant: "standing" }),
    cues({ fingerprint: Array.from({ length: 20 }, () => 0.8) }),
  );

  it("emits one probability per SMPL vertex in (0, 1)", () => {
    assert.equal(sitting.length, SMPL_VERTEX_COUNT);
    for (let i = 0; i < sitting.length; i++) {
      assert.ok(sitting[i] > 0 && sitting[i] < 1);
    }
  });

  it("is image-conditioned: sitting ≠ standing", () => {
    let diff = 0;
    for (let i = 0; i < sitting.length; i++) diff += Math.abs(sitting[i] - standing[i]);
    assert.ok(diff > 50, `L1 ${diff}`);
  });

  it("paints more hip contact when sitting than standing", () => {
    const hips = mesh.parts.hips;
    const mean = (prob: Float32Array) => {
      let s = 0;
      for (const i of hips) s += prob[i];
      return s / hips.length;
    };
    assert.ok(mean(sitting) > mean(standing));
  });

  it("threshold only changes visualization counts", () => {
    const lo = countContact(sitting, 0.3);
    const hi = countContact(sitting, 0.7);
    assert.ok(lo > hi);
    assert.equal(sitting.length, SMPL_VERTEX_COUNT);
  });
});

describe("colormap", () => {
  it("binary mode uses contact green at threshold", () => {
    const p = new Float32Array([0.1, 0.5, 0.9]);
    const out = new Float32Array(9);
    paintVertexColors(out, p, "binary", 0.5);
    colorsEq(out, 0, BASE_MESH);
    colorsEq(out, 3, CONTACT_GREEN);
    colorsEq(out, 6, CONTACT_GREEN);
  });

  it("neutral ignores probability", () => {
    const p = new Float32Array([0, 1]);
    const out = new Float32Array(6);
    paintVertexColors(out, p, "neutral", 0.5);
    colorsEq(out, 0, BASE_MESH);
    colorsEq(out, 3, BASE_MESH);
  });

  it("probability ramp is in range and increases", () => {
    const a = probabilityColor(0.1);
    const b = probabilityColor(0.9);
    assert.ok(b[1] > a[1]);
    for (const c of [...a, ...b]) {
      assert.ok(c >= 0 && c <= 1);
    }
  });

  it("default official threshold is 0.5", () => {
    assert.equal(DEFAULT_CONTACT_THRESHOLD, 0.5);
  });
});

describe("pose cues", () => {
  it("maps furniture-heavy wide-low mass toward sitting", () => {
    const p = cuesToPose(
      cues({
        woodWarmth: 0.12,
        bbox: { x: 60, y: 40, w: 120, h: 140 },
        bboxAspect: 0.85,
        centroidY: 0.62,
        midMass: 0.5,
        lowerMass: 0.25,
      }),
    );
    assert.equal(p.dominant, "sitting");
  });

  it("maps tall bbox toward standing", () => {
    const p = cuesToPose(
      cues({
        bbox: { x: 90, y: 8, w: 70, h: 230 },
        bboxAspect: 0.3,
        centroidY: 0.42,
        lowerMass: 0.45,
        woodWarmth: 0.0,
      }),
    );
    assert.equal(p.dominant, "standing");
  });
});

describe("part summary", () => {
  it("returns fractions in [0, 1] sorted descending", () => {
    const mesh = loadOfficialSmpl();
    const prob = new Float32Array(SMPL_VERTEX_COUNT);
    prob.fill(0.2);
    for (const i of mesh.parts.leftFoot) prob[i] = 0.9;
    const rows = partContactSummary(mesh, prob, 0.5);
    assert.ok(rows.length > 5);
    assert.ok(rows[0].fraction >= rows[1].fraction);
    const foot = rows.find((r) => r.part === "leftFoot");
    assert.ok(foot && foot.fraction > 0.8);
  });
});

describe("API contract", () => {
  it("health reports 6890 vertices and no CUDA", () => {
    assert.equal(HEALTH_PAYLOAD.status, "ok");
    assert.equal(HEALTH_PAYLOAD.vertexCount, SMPL_VERTEX_COUNT);
    assert.equal(HEALTH_PAYLOAD.cuda, false);
    assert.equal(HEALTH_PAYLOAD.torch, false);
  });

  it("system reports official DECO I/O", () => {
    assert.equal(SYSTEM_PAYLOAD.vertices, SMPL_VERTEX_COUNT);
    assert.equal(SYSTEM_PAYLOAD.faces, SMPL_FACE_COUNT);
    assert.deepEqual(SYSTEM_PAYLOAD.inputResolution, [256, 256]);
    assert.equal(SYSTEM_PAYLOAD.defaultThreshold, 0.5);
    assert.equal(SYSTEM_PAYLOAD.device, "browser");
    assert.equal(SYSTEM_PAYLOAD.cuda, false);
  });
});

describe("mesh exports", () => {
  it("PLY header matches official topology and includes vertex colors", async () => {
    const mesh = loadOfficialSmpl();
    const prob = new Float32Array(SMPL_VERTEX_COUNT);
    prob.fill(0.2);
    const blob = buildPly(mesh, prob, "binary", 0.5);
    const text = await blob.text();
    assert.match(text, /^ply\n/);
    assert.match(text, /element vertex 6890/);
    assert.match(text, /element face 13776/);
    assert.match(text, /property uchar red/);
  });

  it("OBJ lists every vertex", async () => {
    const mesh = loadOfficialSmpl();
    const text = await buildObj(mesh).text();
    const verts = text.split("\n").filter((l) => l.startsWith("v ")).length;
    assert.equal(verts, SMPL_VERTEX_COUNT);
  });
});
