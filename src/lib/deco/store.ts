import { create } from "zustand";
import {
  DEFAULT_CONTACT_THRESHOLD,
  type CameraPreset,
  type DecoResult,
  type PipelineStage,
  type RenderMode,
  type UploadedImage,
  type ViewMode,
} from "./types";
import { runDecoPipeline } from "./pipeline";

interface LabState {
  image: UploadedImage | null;
  result: DecoResult | null;
  stage: PipelineStage;
  error: string | null;
  errorDetail: string | null;
  threshold: number;
  renderMode: RenderMode;
  viewMode: ViewMode;
  autoRotate: boolean;
  cameraPreset: CameraPreset;
  cameraNonce: number;
  running: boolean;
  setImage: (image: UploadedImage | null) => void;
  setThreshold: (v: number) => void;
  setRenderMode: (m: RenderMode) => void;
  setViewMode: (m: ViewMode) => void;
  setAutoRotate: (v: boolean) => void;
  setCamera: (p: CameraPreset) => void;
  run: () => Promise<void>;
  clear: () => void;
  dismissError: () => void;
}

export const useLab = create<LabState>((set, get) => ({
  image: null,
  result: null,
  stage: "idle",
  error: null,
  errorDetail: null,
  threshold: DEFAULT_CONTACT_THRESHOLD,
  renderMode: "binary",
  viewMode: "split",
  autoRotate: false,
  cameraPreset: "front",
  cameraNonce: 0,
  running: false,
  setImage: (image) =>
    set({
      image,
      result: null,
      stage: image ? "idle" : "idle",
      error: null,
      errorDetail: null,
    }),
  setThreshold: (threshold) => set({ threshold }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setViewMode: (viewMode) => set({ viewMode }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setCamera: (cameraPreset) =>
    set((s) => ({ cameraPreset, cameraNonce: s.cameraNonce + 1 })),
  clear: () =>
    set({
      image: null,
      result: null,
      stage: "idle",
      error: null,
      errorDetail: null,
      running: false,
    }),
  dismissError: () => set({ error: null, errorDetail: null, stage: get().result ? "ready" : "idle" }),
  run: async () => {
    const { image, running } = get();
    if (!image || running) return;
    set({ running: true, error: null, errorDetail: null, result: null, stage: "reading" });
    try {
      const result = await runDecoPipeline(image, (stage) => set({ stage }));
      set({ result, stage: "ready", running: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Inference failed";
      const detail = err instanceof Error ? err.stack ?? err.message : String(err);
      set({
        running: false,
        stage: "error",
        error: message,
        errorDetail: detail,
      });
    }
  },
}));
