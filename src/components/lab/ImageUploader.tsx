import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadedFromFile, uploadedFromUrl, formatBytes } from "@/lib/deco/load-image";
import { SAMPLE_IMAGES, validateImageFile } from "@/lib/deco/samples";
import { useLab } from "@/lib/deco/store";
import { cn } from "@/lib/utils";

export function ImageUploader() {
  const image = useLab((s) => s.image);
  const setImage = useLab((s) => s.setImage);
  const running = useLab((s) => s.running);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const applyFile = useCallback(
    async (file: File) => {
      const msg = validateImageFile(file);
      if (msg) {
        setLocalError(msg);
        return;
      }
      setLocalError(null);
      try {
        const uploaded = await uploadedFromFile(file);
        setImage(uploaded);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Could not read image.");
      }
    },
    [setImage],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Input</h2>
        {image ? (
          <button
            className="text-xs text-muted hover:text-ink"
            onClick={() => {
              if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url);
              setImage(null);
            }}
            disabled={running}
          >
            Remove
          </button>
        ) : null}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const file = e.dataTransfer.files[0];
          if (file) void applyFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg bg-inset p-3 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-[box-shadow] duration-150",
          drag && "shadow-[0_0_0_1px_rgba(110,196,168,0.7)]",
        )}
      >
        {image ? (
          <>
            <img
              src={image.url}
              alt={image.name}
              className="max-h-52 w-full object-contain outline outline-1 -outline-offset-1 outline-ink/10"
            />
            <button
              className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-sm bg-panel/80 text-ink"
              onClick={(e) => {
                e.stopPropagation();
                if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url);
                setImage(null);
              }}
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6">
            <span className="flex size-10 items-center justify-center rounded-md bg-panel-2 text-accent">
              <ImagePlus className="size-5" />
            </span>
            <p className="text-sm text-ink">Drop an RGB image</p>
            <p className="text-xs text-muted">JPG, PNG, or WEBP · person in scene</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void applyFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {image ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
          <dt>File</dt>
          <dd className="truncate text-ink">{image.name}</dd>
          <dt>Size</dt>
          <dd className="text-ink">
            {image.width} × {image.height}
            {image.size ? ` · ${formatBytes(image.size)}` : ""}
          </dd>
        </dl>
      ) : null}

      {localError ? <p className="text-xs text-danger">{localError}</p> : null}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">Examples</p>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_IMAGES.map((s) => (
            <button
              key={s.id}
              className="overflow-hidden rounded-sm bg-inset text-left shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-[box-shadow] hover:shadow-[0_0_0_1px_rgba(110,196,168,0.45)]"
              onClick={async () => {
                setLocalError(null);
                try {
                  const uploaded = await uploadedFromUrl(s.src, `${s.id}.jpg`);
                  setImage(uploaded);
                } catch (err) {
                  setLocalError(err instanceof Error ? err.message : "Could not load example.");
                }
              }}
              disabled={running}
            >
              <img src={s.src} alt="" className="h-16 w-full object-cover" />
              <span className="block px-1.5 py-1 text-[10px] leading-tight text-muted">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!image || running}
        onClick={() => void useLab.getState().run()}
      >
        {running ? "Running…" : "Run DECO"}
      </Button>
    </div>
  );
}
