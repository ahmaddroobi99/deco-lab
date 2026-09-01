import { useEffect, useState } from "react";
import { loadSmplMesh } from "@/lib/deco/smpl";
import { useLab } from "@/lib/deco/store";
import type { SmplMesh } from "@/lib/deco/types";
import { cn } from "@/lib/utils";
import { Diagnostics } from "./Diagnostics";
import { ImageUploader } from "./ImageUploader";
import { ProcessingOverlay } from "./ProcessingOverlay";
import { RightPanel } from "./RightPanel";
import { Viewer3D } from "./Viewer3D";

export function LabShell() {
  const image = useLab((s) => s.image);
  const result = useLab((s) => s.result);
  const viewMode = useLab((s) => s.viewMode);
  const [mesh, setMesh] = useState<SmplMesh | null>(null);
  const [meshError, setMeshError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSmplMesh()
      .then((m) => {
        if (!cancelled) setMesh(m);
      })
      .catch((err) => {
        if (!cancelled) setMeshError(err instanceof Error ? err.message : "Mesh load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showImage = viewMode === "image" || viewMode === "split";
  const showMesh = viewMode === "mesh" || viewMode === "split";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink lg:h-dvh lg:overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-4 sm:px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="text-sm font-semibold tracking-[0.18em] text-ink">DECO LAB</h1>
          <p className="hidden truncate text-xs text-muted sm:block">
            SMPL contact visualization
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="hidden text-muted md:inline">Non-commercial research</span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="size-1.5 rounded-full bg-warn" />
            CPU · BROWSER
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto lg:grid-cols-[280px_minmax(0,1fr)_300px] lg:overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="flex flex-col gap-6 overflow-y-auto border-b border-line p-4 lg:border-b-0 lg:border-r">
          <ImageUploader />
          <Diagnostics />
          <p className="text-[11px] leading-relaxed text-faint">
            Geometry is the canonical SMPL neutral T-pose used by DECO (6,890 vertices).
            This is a contact visualization, not a posed 3D reconstruction.
            Official DECO-HRNet weights require CUDA, ~1.6 GB, and an MPI
            non-commercial license and are not loaded here.
          </p>
        </aside>

        <main className="relative min-h-[420px] bg-inset lg:min-h-0">
          <div
            className={cn(
              "grid h-full min-h-[420px]",
              showImage && showMesh ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
            )}
          >
            {showImage ? (
              <div className="relative flex min-h-[280px] items-center justify-center border-b border-line p-4 md:border-b-0 md:border-r">
                {image ? (
                  <img
                    src={image.url}
                    alt="Input"
                    className="max-h-full max-w-full object-contain outline outline-1 -outline-offset-1 outline-ink/10"
                  />
                ) : (
                  <p className="max-w-xs text-center text-sm text-muted">
                    Upload a person-in-scene photograph to estimate vertex-level contact on the SMPL body.
                  </p>
                )}
                <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Original
                </span>
              </div>
            ) : null}

            {showMesh ? (
              <div className="relative min-h-[360px] lg:min-h-0">
                {meshError ? (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-danger">{meshError}</div>
                ) : (
                  <Viewer3D mesh={mesh} />
                )}
                <span className="pointer-events-none absolute left-3 top-3 z-[1] font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  SMPL contact
                </span>
                {!result && image ? (
                  <p className="pointer-events-none absolute bottom-4 left-1/2 z-[1] w-[min(280px,90%)] -translate-x-1/2 text-center text-xs text-muted">
                    Neutral T-pose loaded. Run DECO to paint contact.
                  </p>
                ) : null}
                <ProcessingOverlay />
              </div>
            ) : null}
          </div>
        </main>

        <aside className="overflow-y-auto border-t border-line p-4 lg:border-l lg:border-t-0">
          <RightPanel />
        </aside>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 font-mono text-[10px] text-faint sm:px-6">
        <span>DECO · Tripathi et al., ICCV 2023 · MPI-IS</span>
        <span>Research / non-commercial use only</span>
      </footer>
    </div>
  );
}
