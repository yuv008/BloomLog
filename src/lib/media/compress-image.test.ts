import { describe, it, expect } from "vitest";
import { canvasToMealBlob } from "@/lib/media/compress-image";

function mockCanvas(
  handler: (cb: (b: Blob | null) => void, type?: string) => void
): HTMLCanvasElement {
  return { toBlob: handler } as unknown as HTMLCanvasElement;
}

describe("canvasToMealBlob", () => {
  const jpegBlob = new Blob(["jpeg"], { type: "image/jpeg" });
  const webpBlob = new Blob(["webp"], { type: "image/webp" });

  it("falls back to jpeg when webp encode returns null", async () => {
    const canvas = mockCanvas((cb, type) => {
      if (type === "image/webp") cb(null);
      else if (type === "image/jpeg") cb(jpegBlob);
      else cb(null);
    });
    const blob = await canvasToMealBlob(canvas, 0.8);
    expect(blob.type).toBe("image/jpeg");
  });

  it("uses webp when available", async () => {
    const canvas = mockCanvas((cb, type) => {
      if (type === "image/webp") cb(webpBlob);
      else cb(null);
    });
    const blob = await canvasToMealBlob(canvas, 0.8);
    expect(blob.type).toBe("image/webp");
  });
});
