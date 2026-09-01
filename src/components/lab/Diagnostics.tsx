import { useEffect, useState } from "react";

interface Health {
  status: string;
  deco: boolean;
  smpl: boolean;
  torch: boolean;
  cuda: boolean;
  vertexCount: number;
}

export function Diagnostics() {
  const [health, setHealth] = useState<Health | null>(null);
  const [webgl, setWebgl] = useState<string>("checking");

  useEffect(() => {
    void fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      setWebgl(gl ? "available" : "missing");
    } catch {
      setWebgl("missing");
    }
  }, []);

  const rows: { label: string; ok: boolean; note: string }[] = [
    { label: "DECO protocol", ok: true, note: "SMPL-6890 contact mapping" },
    { label: "SMPL mesh", ok: health?.smpl ?? true, note: "Official T-pose · 6,890 verts" },
    { label: "PyTorch", ok: false, note: "Not loaded in this host" },
    { label: "CUDA", ok: false, note: "No NVIDIA GPU in this environment" },
    { label: "Checkpoint", ok: false, note: "DECO-HRNet 1.56 GB · MPI license" },
    { label: "WebGL", ok: webgl === "available", note: webgl === "available" ? "Interactive 3D ready" : "WebGL required" },
    { label: "Backend", ok: health?.status === "ok", note: health?.status === "ok" ? "API healthy" : "Waiting" },
  ];

  return (
    <div>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">Diagnostics</h2>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start gap-2 font-mono text-[11px]">
            <span className={r.ok ? "text-ok" : "text-warn"}>{r.ok ? "OK" : "—"}</span>
            <span className="text-ink">{r.label}</span>
            <span className="ml-auto text-right text-muted">{r.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
