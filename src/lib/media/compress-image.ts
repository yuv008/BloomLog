export type CompressedMealPhoto = {
  thumbBlob: Blob;
  fullBlob: Blob;
  previewUrl: string;
  thumbBytes: number;
  fullBytes: number;
};

const MAX_FULL_EDGE = 1200;
const MAX_THUMB_EDGE = 320;
const FULL_QUALITY = 0.82;
const THUMB_QUALITY = 0.75;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not load image"));
    };
    img.src = url;
  });
}

function resizeToCanvas(
  img: HTMLImageElement,
  maxEdge: number,
  squareCover = false
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (squareCover) {
    const size = Math.min(w, h);
    const sx = (w - size) / 2;
    const sy = (h - size) / 2;
    const edge = Math.min(maxEdge, size);
    canvas.width = edge;
    canvas.height = edge;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, edge, edge);
    return canvas;
  }

  const scale = maxEdge / Math.max(w, h);
  if (scale < 1) {
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("webp encode failed"));
      },
      "image/webp",
      quality
    );
  });
}

export async function compressMealPhoto(file: File): Promise<CompressedMealPhoto> {
  const img = await loadImage(file);
  const fullCanvas = resizeToCanvas(img, MAX_FULL_EDGE);
  const thumbCanvas = resizeToCanvas(img, MAX_THUMB_EDGE, true);
  const fullBlob = await canvasToBlob(fullCanvas, FULL_QUALITY);
  const thumbBlob = await canvasToBlob(thumbCanvas, THUMB_QUALITY);

  if (fullBlob.size > MAX_OUTPUT_BYTES) {
    throw new Error("Photo is still too large — try a smaller image.");
  }

  const previewUrl = URL.createObjectURL(thumbBlob);
  return {
    thumbBlob,
    fullBlob,
    previewUrl,
    thumbBytes: thumbBlob.size,
    fullBytes: fullBlob.size,
  };
}

export function revokeMealPreview(url: string | null | undefined) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}
