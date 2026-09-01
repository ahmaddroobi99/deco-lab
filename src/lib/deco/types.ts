export const SMPL_VERTEX_COUNT = 6890;
export const SMPL_FACE_COUNT = 13776;
export const DECO_INPUT_SIZE = 256;
export const DEFAULT_CONTACT_THRESHOLD = 0.5;

export type RenderMode =
  | "neutral"
  | "binary"
  | "probability"
  | "wireframe"
  | "points"
  | "combined";

export type ViewMode = "image" | "split" | "mesh";

export type CameraPreset =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "reset";

export type PipelineStage =
  | "idle"
  | "reading"
  | "preparing"
  | "loading-mesh"
  | "scene-context"
  | "part-context"
  | "contact"
  | "building"
  | "ready"
  | "error";

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: "reading", label: "Reading image" },
  { id: "preparing", label: "Preparing 256×256 input" },
  { id: "loading-mesh", label: "Loading SMPL T-pose" },
  { id: "scene-context", label: "Scene-context branch" },
  { id: "part-context", label: "Part-context branch" },
  { id: "contact", label: "Vertex contact classification" },
  { id: "building", label: "Building 3D representation" },
  { id: "ready", label: "Ready" },
];

export type PoseClass =
  | "standing"
  | "sitting"
  | "lying"
  | "leaning"
  | "crouching"
  | "unknown";

export interface ImageCues {
  width: number;
  height: number;
  aspect: number;
  meanLuma: number;
  skinFraction: number;
  foregroundFraction: number;
  bbox: { x: number; y: number; w: number; h: number };
  bboxAspect: number;
  centroidY: number;
  lowerMass: number;
  upperMass: number;
  midMass: number;
  horizontalSpread: number;
  woodWarmth: number;
  outdoorGreen: number;
  skyBlue: number;
  fabricSoft: number;
  edgeEnergy: number;
  fingerprint: number[];
}

export interface PoseMixture {
  standing: number;
  sitting: number;
  lying: number;
  leaning: number;
  crouching: number;
  handsSupport: number;
  backSupport: number;
  feetSupport: number;
  dominant: PoseClass;
}

export interface SmplMesh {
  vertices: Float32Array;
  faces: Uint32Array;
  parts: Record<string, number[]>;
  adjacency: number[][];
  vertexCount: number;
  faceCount: number;
}

export interface DecoTimings {
  prepareMs: number;
  sceneMs: number;
  partMs: number;
  contactMs: number;
  buildMs: number;
  totalMs: number;
}

export interface DecoResult {
  jobId: string;
  contactProbability: Float32Array;
  pose: PoseMixture;
  cues: ImageCues;
  timings: DecoTimings;
  inputWidth: number;
  inputHeight: number;
  modelInput: [number, number];
  vertexCount: number;
  bodyModel: "SMPL";
  estimator: string;
  createdAt: number;
}

export interface UploadedImage {
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;
  element: HTMLImageElement;
}
