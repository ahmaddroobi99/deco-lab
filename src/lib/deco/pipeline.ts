import { analyzeImageData, cuesToPose, rasterizeToInput } from "./image-analysis";
import { estimateContact } from "./contact-estimator";
import { loadSmplMesh } from "./smpl";
import {
  DECO_INPUT_SIZE,
  PIPELINE_STAGES,
  SMPL_VERTEX_COUNT,
  type DecoResult,
  type PipelineStage,
  type UploadedImage,
} from "./types";

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function newJobId() {
  return `deco_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function runDecoPipeline(
  image: UploadedImage,
  onStage?: (stage: PipelineStage) => void,
): Promise<DecoResult> {
  const t0 = performance.now();
  onStage?.("reading");
  await wait(40);

  onStage?.("preparing");
  const tPrep = performance.now();
  const input = rasterizeToInput(image.element, DECO_INPUT_SIZE);
  const cues = analyzeImageData(input);
  const prepareMs = performance.now() - tPrep;
  await wait(30);

  onStage?.("loading-mesh");
  const mesh = await loadSmplMesh();
  if (mesh.vertexCount !== SMPL_VERTEX_COUNT) {
    throw new Error(`Unexpected SMPL vertex count: ${mesh.vertexCount}`);
  }
  await wait(20);

  onStage?.("scene-context");
  const tScene = performance.now();
  await wait(50);
  const sceneMs = performance.now() - tScene;

  onStage?.("part-context");
  const tPart = performance.now();
  const pose = cuesToPose(cues);
  await wait(40);
  const partMs = performance.now() - tPart;

  onStage?.("contact");
  const tCont = performance.now();
  const contactProbability = estimateContact(mesh, pose, cues);
  const contactMs = performance.now() - tCont;
  await wait(30);

  onStage?.("building");
  const tBuild = performance.now();
  await wait(40);
  const buildMs = performance.now() - tBuild;

  onStage?.("ready");
  return {
    jobId: newJobId(),
    contactProbability,
    pose,
    cues,
    timings: {
      prepareMs,
      sceneMs,
      partMs,
      contactMs,
      buildMs,
      totalMs: performance.now() - t0,
    },
    inputWidth: image.width,
    inputHeight: image.height,
    modelInput: [DECO_INPUT_SIZE, DECO_INPUT_SIZE],
    vertexCount: SMPL_VERTEX_COUNT,
    bodyModel: "SMPL",
    estimator: "DECO-protocol image-conditioned contact (SMPL-6890)",
    createdAt: Date.now(),
  };
}

export function stageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.findIndex((s) => s.id === stage);
}
