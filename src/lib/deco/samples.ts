export interface SampleImage {
  id: string;
  src: string;
  title: string;
  caption: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "chair",
    src: "/examples/pexels-photo-15732209.jpeg",
    title: "Seated, wooden chair",
    caption: "Thighs, hips, back, feet",
  },
  {
    id: "hammock",
    src: "/examples/pexels-photo-207569.webp",
    title: "Reclining, hammock",
    caption: "Back, hips, arms",
  },
  {
    id: "office",
    src: "/examples/pexels-photo-3622517.webp",
    title: "Seated, crossed leg",
    caption: "Hips, thighs, feet",
  },
];

export const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_EXT = ".jpg,.jpeg,.png,.webp";
export const MAX_BYTES = 12 * 1024 * 1024;
export const MAX_DIM = 8192;
export const MIN_DIM = 64;

export function validateImageFile(file: File): string | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const okType =
    ACCEPT_TYPES.includes(type) ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp");
  if (!okType) return "Unsupported image format. Please upload JPG, PNG, or WEBP.";
  if (file.size > MAX_BYTES) return "Image is too large. Maximum size is 12 MB.";
  if (file.size < 32) return "File is empty or corrupted.";
  return null;
}
