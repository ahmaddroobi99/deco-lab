import { DECO_INPUT_SIZE, type ImageCues } from "./types";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function isSkin(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return y > 40 && y < 240 && cb > 77 && cb < 127 && cr > 133 && cr < 173;
}

function isWoodWarm(r: number, g: number, b: number): boolean {
  return r > 70 && r > g + 8 && g > b && r - b > 25 && r < 220 && g > 40 && b < 140;
}

function isOutdoorGreen(r: number, g: number, b: number): boolean {
  return g > r + 12 && g > b + 8 && g > 50;
}

function isSky(r: number, g: number, b: number): boolean {
  return b > r + 10 && b > g && b > 90 && r > 40;
}

function isFabricSoft(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min < 40 && max > 50 && max < 210;
}

export function analyzeImageData(imageData: ImageData): ImageCues {
  const { width, height, data } = imageData;
  const n = width * height;
  const luma = new Float32Array(n);
  const fg = new Uint8Array(n);

  let meanLuma = 0;
  let skin = 0;
  let wood = 0;
  let green = 0;
  let sky = 0;
  let fabric = 0;
  let edge = 0;

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[i] = y;
    meanLuma += y;
    if (isSkin(r, g, b)) skin++;
    if (isWoodWarm(r, g, b)) wood++;
    if (isOutdoorGreen(r, g, b)) green++;
    if (isSky(r, g, b)) sky++;
    if (isFabricSoft(r, g, b)) fabric++;
  }
  meanLuma /= n;

  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const o = i * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const dx = (x - cx) / width;
      const dy = (y - cy) / height;
      const center = Math.exp(-(dx * dx * 8 + dy * dy * 4.5));
      const skinScore = isSkin(r, g, b) ? 1 : 0;
      const contrast = Math.abs(luma[i] - meanLuma) / 255;
      const notSky = isSky(r, g, b) ? 0 : 1;
      const score = skinScore * 1.4 + contrast * 0.9 * center + center * 0.35;
      if (score > 0.42 && notSky) fg[i] = 1;
    }
  }

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let fgCount = 0;
  let massX = 0;
  let massY = 0;
  const rowMass = new Float32Array(height);
  const colMass = new Float32Array(width);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!fg[i]) continue;
      fgCount++;
      massX += x;
      massY += y;
      rowMass[y]++;
      colMass[x]++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (fgCount < 20) {
    minX = Math.floor(width * 0.25);
    maxX = Math.floor(width * 0.75);
    minY = Math.floor(height * 0.1);
    maxY = Math.floor(height * 0.95);
    massX = (minX + maxX) / 2 * 20;
    massY = (minY + maxY) / 2 * 20;
    fgCount = 20;
  }

  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const centroidY = massY / fgCount / height;
  const lowerBand = minY + bh * 0.66;
  const upperBand = minY + bh * 0.28;
  const midLo = minY + bh * 0.35;
  const midHi = minY + bh * 0.7;
  let lower = 0;
  let upper = 0;
  let mid = 0;
  for (let y = minY; y <= maxY; y++) {
    if (y >= lowerBand) lower += rowMass[y];
    if (y <= upperBand) upper += rowMass[y];
    if (y >= midLo && y <= midHi) mid += rowMass[y];
  }
  const denom = Math.max(1, fgCount);

  let colVar = 0;
  const colMean = massX / fgCount;
  for (let x = 0; x < width; x++) {
    if (!colMass[x]) continue;
    const d = x - colMean;
    colVar += d * d * colMass[x];
  }
  const horizontalSpread = Math.sqrt(colVar / denom) / width;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx = luma[i + 1] - luma[i - 1];
      const gy = luma[i + width] - luma[i - width];
      edge += Math.abs(gx) + Math.abs(gy);
    }
  }

  const fingerprint: number[] = [];
  const bins = 12;
  const hist = new Float32Array(bins);
  for (let i = 0; i < n; i++) hist[Math.min(bins - 1, (luma[i] / 256) * bins | 0)]++;
  for (let i = 0; i < bins; i++) fingerprint.push(hist[i] / n);
  fingerprint.push(skin / n, wood / n, green / n, sky / n, fabric / n, centroidY, bw / width, bh / height);

  return {
    width,
    height,
    aspect: width / height,
    meanLuma: meanLuma / 255,
    skinFraction: skin / n,
    foregroundFraction: fgCount / n,
    bbox: { x: minX, y: minY, w: bw, h: bh },
    bboxAspect: bw / bh,
    centroidY,
    lowerMass: lower / denom,
    upperMass: upper / denom,
    midMass: mid / denom,
    horizontalSpread,
    woodWarmth: wood / n,
    outdoorGreen: green / n,
    skyBlue: sky / n,
    fabricSoft: fabric / n,
    edgeEnergy: edge / (n * 255),
    fingerprint,
  };
}

export function rasterizeToInput(
  image: HTMLImageElement,
  size = DECO_INPUT_SIZE,
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(image, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

export function cuesToPose(cues: ImageCues) {
  const tall = clamp((cues.bbox.h / DECO_INPUT_SIZE - 0.55) / 0.4, 0, 1);
  const wide = clamp((cues.bboxAspect - 0.55) / 0.9, 0, 1);
  const lowCentroid = clamp((cues.centroidY - 0.42) / 0.3, 0, 1);
  const highCentroid = clamp((0.48 - cues.centroidY) / 0.28, 0, 1);
  const lower = clamp(cues.lowerMass, 0, 1);
  const mid = clamp(cues.midMass, 0, 1);
  const furniture = clamp(cues.woodWarmth * 8 + cues.fabricSoft * 1.4, 0, 1);
  const outdoor = clamp(cues.outdoorGreen * 6 + cues.skyBlue * 3, 0, 1);
  const hammockLike = clamp(cues.fabricSoft * 4 + cues.outdoorGreen * 5 + wide * 0.6, 0, 1);

  let sitting = clamp(0.15 + furniture * 0.55 + lowCentroid * 0.35 + mid * 0.25 - tall * 0.35 + (1 - wide) * 0.1, 0, 1);
  let standing = clamp(0.12 + tall * 0.7 + highCentroid * 0.25 + lower * 0.15 - furniture * 0.45 - wide * 0.3, 0, 1);
  let lying = clamp(0.05 + wide * 0.7 + hammockLike * 0.45 + (1 - tall) * 0.25 - standing * 0.3, 0, 1);
  let leaning = clamp(0.08 + furniture * 0.2 + standing * 0.15 + cues.horizontalSpread * 0.4, 0, 1);
  let crouching = clamp(0.04 + (1 - tall) * 0.25 + lower * 0.3 - lying * 0.4 - sitting * 0.2, 0, 1);

  const sum = sitting + standing + lying + leaning + crouching + 1e-6;
  sitting /= sum;
  standing /= sum;
  lying /= sum;
  leaning /= sum;
  crouching /= sum;

  const handsSupport = clamp(
    0.12 + sitting * 0.35 + lying * 0.25 + furniture * 0.2 + hammockLike * 0.3,
    0,
    0.95,
  );
  const backSupport = clamp(sitting * 0.55 + lying * 0.85 + leaning * 0.7 + hammockLike * 0.5, 0, 0.97);
  const feetSupport = clamp(standing * 0.92 + sitting * 0.62 + crouching * 0.75 + lying * 0.18, 0, 0.97);

  const scores: Record<string, number> = { standing, sitting, lying, leaning, crouching };
  const dominant = (Object.keys(scores) as (keyof typeof scores)[]).sort(
    (a, b) => scores[b] - scores[a],
  )[0] as "standing" | "sitting" | "lying" | "leaning" | "crouching";

  return {
    standing,
    sitting,
    lying,
    leaning,
    crouching,
    handsSupport,
    backSupport,
    feetSupport,
    dominant: outdoor > 0.35 && lying > 0.28 ? ("lying" as const) : dominant,
  };
}
