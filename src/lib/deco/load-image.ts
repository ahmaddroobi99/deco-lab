import { MAX_DIM, MIN_DIM } from "./samples";
import type { UploadedImage } from "./types";

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode the image. The file may be corrupted."));
    img.src = src;
  });
}

export async function uploadedFromFile(file: File): Promise<UploadedImage> {
  const url = URL.createObjectURL(file);
  try {
    const element = await loadImageElement(url);
    if (element.naturalWidth < MIN_DIM || element.naturalHeight < MIN_DIM) {
      URL.revokeObjectURL(url);
      throw new Error(`Image is too small. Minimum dimension is ${MIN_DIM}px.`);
    }
    if (element.naturalWidth > MAX_DIM || element.naturalHeight > MAX_DIM) {
      URL.revokeObjectURL(url);
      throw new Error(`Image is too large. Maximum dimension is ${MAX_DIM}px.`);
    }
    return {
      name: file.name,
      url,
      width: element.naturalWidth,
      height: element.naturalHeight,
      size: file.size,
      type: file.type || "image/*",
      element,
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

export async function uploadedFromUrl(src: string, name: string): Promise<UploadedImage> {
  const element = await loadImageElement(src);
  return {
    name,
    url: src,
    width: element.naturalWidth,
    height: element.naturalHeight,
    size: 0,
    type: "image/*",
    element,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
