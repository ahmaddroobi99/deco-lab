import {
  DEFAULT_CONTACT_THRESHOLD,
  DECO_INPUT_SIZE,
  SMPL_FACE_COUNT,
  SMPL_VERTEX_COUNT,
} from "./types";

export const HEALTH_PAYLOAD = {
  status: "ok" as const,
  deco: true,
  smpl: true,
  torch: false,
  cuda: false,
  vertexCount: SMPL_VERTEX_COUNT,
  bodyModel: "SMPL",
  note: "Official DECO-HRNet checkpoint is not loaded in this hosted environment.",
};

export const SYSTEM_PAYLOAD = {
  app: "DECO Lab",
  paper: "Tripathi et al., ICCV 2023",
  project: "https://deco.is.tue.mpg.de/",
  code: "https://github.com/sha2nkt/deco",
  bodyModel: "SMPL neutral T-pose",
  vertices: SMPL_VERTEX_COUNT,
  faces: SMPL_FACE_COUNT,
  inputResolution: [DECO_INPUT_SIZE, DECO_INPUT_SIZE] as const,
  defaultThreshold: DEFAULT_CONTACT_THRESHOLD,
  device: "browser",
  cuda: false,
  torch: false,
  license: "MPI non-commercial scientific research",
};
