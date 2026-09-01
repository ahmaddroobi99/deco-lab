import { useEffect, useState } from "react";
import { Box, Download, Focus, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countContact, partContactSummary } from "@/lib/deco/contact-estimator";
import { buildJson, buildObj, buildPly, downloadBlob } from "@/lib/deco/exports";
import { loadSmplMesh } from "@/lib/deco/smpl";
import { useLab } from "@/lib/deco/store";
import type { CameraPreset, RenderMode, ViewMode } from "@/lib/deco/types";
import { cn } from "@/lib/utils";
import { captureViewerPng } from "./Viewer3D";

const RENDER_MODES: { id: RenderMode; label: string }[] = [
  { id: "neutral", label: "Neutral" },
  { id: "binary", label: "Binary" },
  { id: "probability", label: "Probability" },
  { id: "wireframe", label: "Wireframe" },
  { id: "points", label: "Points" },
  { id: "combined", label: "Combined" },
];

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "image", label: "Image" },
  { id: "split", label: "Split" },
  { id: "mesh", label: "3D" },
];

const CAMERAS: { id: CameraPreset; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "reset", label: "Reset" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

async function exportGlb() {
  const result = useLab.getState().result;
  if (!result) return;
  const mesh = await loadSmplMesh();
  const THREE = await import("three");
  const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");
  const { paintVertexColors } = await import("@/lib/deco/colormap");
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(mesh.vertices.slice(), 3));
  geom.setIndex(new THREE.BufferAttribute(mesh.faces, 1));
  const colors = new Float32Array(mesh.vertexCount * 3);
  const mode = useLab.getState().renderMode;
  paintVertexColors(
    colors,
    result.contactProbability,
    mode === "probability" ? "probability" : "binary",
    useLab.getState().threshold,
  );
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.08 });
  const obj = new THREE.Mesh(geom, mat);
  const scene = new THREE.Scene();
  scene.add(obj);
  const exporter = new GLTFExporter();
  const data = await exporter.parseAsync(scene, { binary: true });
  const blob = new Blob([data as ArrayBuffer], { type: "model/gltf-binary" });
  downloadBlob(blob, `${result.jobId}.glb`);
}

function PartBars() {
  const result = useLab((s) => s.result);
  const threshold = useLab((s) => s.threshold);
  const [rows, setRows] = useState<{ part: string; fraction: number; count: number }[] | null>(null);

  useEffect(() => {
    if (!result) {
      setRows(null);
      return;
    }
    let cancel = false;
    void loadSmplMesh().then((mesh) => {
      if (cancel) return;
      setRows(partContactSummary(mesh, result.contactProbability, threshold));
    });
    return () => {
      cancel = true;
    };
  }, [result, threshold]);

  if (!result) return null;
  if (!rows) return <p className="text-xs text-muted">Loading parts…</p>;

  return (
    <ul className="flex flex-col gap-1.5">
      {rows.slice(0, 8).map((r) => (
        <li key={r.part} className="flex items-center gap-2">
          <span className="w-24 truncate font-mono text-[10px] text-muted">{r.part}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
            <span className="block h-full rounded-full bg-contact" style={{ width: `${Math.round(r.fraction * 100)}%` }} />
          </span>
          <span className="w-8 text-right font-mono text-[10px] text-ink tabular-nums">
            {Math.round(r.fraction * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function RightPanel() {
  const result = useLab((s) => s.result);
  const threshold = useLab((s) => s.threshold);
  const setThreshold = useLab((s) => s.setThreshold);
  const renderMode = useLab((s) => s.renderMode);
  const setRenderMode = useLab((s) => s.setRenderMode);
  const viewMode = useLab((s) => s.viewMode);
  const setViewMode = useLab((s) => s.setViewMode);
  const autoRotate = useLab((s) => s.autoRotate);
  const setAutoRotate = useLab((s) => s.setAutoRotate);
  const setCamera = useLab((s) => s.setCamera);
  const image = useLab((s) => s.image);
  const contactCount = result ? countContact(result.contactProbability, threshold) : 0;

  async function exportFile(kind: "ply" | "obj" | "json" | "png") {
    if (!result) return;
    const mesh = await loadSmplMesh();
    const id = result.jobId;
    if (kind === "ply") {
      const colorMode = renderMode === "probability" ? "probability" : "binary";
      downloadBlob(buildPly(mesh, result.contactProbability, colorMode, threshold), `${id}.ply`);
    } else if (kind === "obj") {
      downloadBlob(buildObj(mesh), `${id}.obj`);
    } else if (kind === "json") {
      downloadBlob(
        buildJson(mesh, result.contactProbability, threshold, {
          job_id: result.jobId,
          estimator: result.estimator,
          pose: result.pose,
          input_resolution: [result.inputWidth, result.inputHeight],
          model_input_resolution: result.modelInput,
          device: "browser",
          inference_time_ms: Math.round(result.timings.totalMs),
        }),
        `${id}.json`,
      );
    } else {
      const blob = await captureViewerPng();
      if (blob) downloadBlob(blob, `${id}.png`);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Section title="Layout">
        <div className="grid grid-cols-3 gap-1 rounded-md bg-inset p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={cn(
                "h-9 rounded-sm text-xs font-medium",
                viewMode === v.id ? "bg-panel-2 text-ink" : "text-muted hover:text-ink",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Rendering">
        <div className="grid grid-cols-2 gap-1">
          {RENDER_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setRenderMode(m.id)}
              className={cn(
                "h-9 rounded-sm text-xs font-medium shadow-[0_0_0_1px_rgba(255,255,255,0.06)]",
                renderMode === m.id ? "bg-accent text-accent-fg" : "bg-panel-2 text-muted hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Contact threshold">
        <div className="flex items-center justify-between font-mono text-xs text-muted">
          <span>0.00</span>
          <span className="text-ink tabular-nums">{threshold.toFixed(2)}</span>
          <span>1.00</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="h-9 w-full accent-accent"
          aria-label="Contact threshold"
        />
        <p className="text-xs text-muted">
          Visualization only — does not rerun inference. Official DECO default is 0.50.
        </p>
      </Section>

      <Section title="Camera">
        <div className="grid grid-cols-4 gap-1">
          {CAMERAS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCamera(c.id)}
              className="h-9 rounded-sm bg-panel-2 text-[11px] font-medium text-muted shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:text-ink"
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            className="flex-1"
            variant={autoRotate ? "primary" : "secondary"}
            onClick={() => setAutoRotate(!autoRotate)}
          >
            <RotateCw className="size-3.5" />
            Auto rotate
          </Button>
          <Button size="icon" onClick={() => setCamera("reset")} aria-label="Reset camera">
            <RotateCcw className="size-4" />
          </Button>
        </div>
        <p className="text-xs text-muted">Drag to orbit · scroll to zoom · right-drag to pan</p>
      </Section>

      <Section title="Legend">
        <div className="rounded-md bg-inset p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <div className="mb-2 h-2 w-full rounded-full bg-[linear-gradient(90deg,#2e383c_0%,#387d76_50%,#3ee08a_100%)]" />
          <div className="flex justify-between font-mono text-[10px] text-muted">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Contact intensity on 6,890 SMPL vertices. Green marks vertices ≥ threshold.
          </p>
        </div>
      </Section>

      {result ? (
        <Section title="Prediction">
          <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <dt className="text-muted">Pose class</dt>
            <dd className="text-ink capitalize">{result.pose.dominant}</dd>
            <dt className="text-muted">Contact verts</dt>
            <dd className="text-ink tabular-nums">{contactCount.toLocaleString()}</dd>
            <dt className="text-muted">Vertices</dt>
            <dd className="text-ink tabular-nums">6,890</dd>
            <dt className="text-muted">Faces</dt>
            <dd className="text-ink tabular-nums">13,776</dd>
            <dt className="text-muted">Body</dt>
            <dd className="text-ink">SMPL T-pose</dd>
            <dt className="text-muted">Device</dt>
            <dd className="text-ink">Browser / CPU</dd>
            <dt className="text-muted">Time</dt>
            <dd className="text-ink tabular-nums">{(result.timings.totalMs / 1000).toFixed(2)} s</dd>
            <dt className="text-muted">Input</dt>
            <dd className="text-ink">
              {image ? `${image.width}×${image.height}` : "—"} → 256×256
            </dd>
          </dl>
        </Section>
      ) : null}

      {result ? (
        <Section title="Part contact">
          <PartBars />
        </Section>
      ) : null}

      <Section title="Export">
        <div className="grid grid-cols-2 gap-1">
          <Button size="sm" disabled={!result} onClick={() => void exportFile("ply")}>
            <Download className="size-3.5" /> PLY
          </Button>
          <Button size="sm" disabled={!result} onClick={() => void exportFile("obj")}>
            <Box className="size-3.5" /> OBJ
          </Button>
          <Button size="sm" disabled={!result} onClick={() => void exportGlb()}>
            <Focus className="size-3.5" /> GLB
          </Button>
          <Button size="sm" disabled={!result} onClick={() => void exportFile("json")}>
            JSON
          </Button>
          <Button size="sm" disabled={!result} onClick={() => void exportFile("png")} className="col-span-2">
            PNG snapshot
          </Button>
        </div>
        <p className="text-xs text-muted">
          PLY includes vertex colors. OBJ is topology only. JSON stores raw 6,890 probabilities.
        </p>
      </Section>
    </div>
  );
}
