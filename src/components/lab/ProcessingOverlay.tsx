import { PIPELINE_STAGES } from "@/lib/deco/types";
import { useLab } from "@/lib/deco/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProcessingOverlay() {
  const stage = useLab((s) => s.stage);
  const running = useLab((s) => s.running);
  const error = useLab((s) => s.error);
  const errorDetail = useLab((s) => s.errorDetail);
  const dismissError = useLab((s) => s.dismissError);
  const run = useLab((s) => s.run);
  const image = useLab((s) => s.image);

  if (!running && stage !== "error") return null;

  const idx = PIPELINE_STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <div className="pointer-events-auto w-full max-w-md rounded-lg bg-panel p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_60px_rgba(0,0,0,0.45)]">
        {stage === "error" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-danger">Inference failed</p>
            <p className="text-sm text-ink">{error}</p>
            {errorDetail ? (
              <pre className="max-h-32 overflow-auto rounded-sm bg-inset p-2 font-mono text-[10px] text-muted">
                {errorDetail}
              </pre>
            ) : null}
            <div className="flex gap-2">
              <Button variant="primary" disabled={!image} onClick={() => void run()}>
                Retry
              </Button>
              <Button onClick={dismissError}>Dismiss</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Pipeline</p>
            <ol className="flex flex-col gap-1.5">
              {PIPELINE_STAGES.filter((s) => s.id !== "ready").map((s, i) => {
                const done = idx > i;
                const active = s.id === stage;
                return (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        done ? "bg-contact" : active ? "bg-accent animate-pulse" : "bg-line-strong",
                      )}
                    />
                    <span className={cn(active ? "text-ink" : done ? "text-muted" : "text-faint")}>
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
