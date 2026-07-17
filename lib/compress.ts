/**
 * Client-side downscaling, so oversized images still make it into the repo.
 *
 * Only images are handled. Video would need a full transcode (ffmpeg.wasm is
 * a ~30 MB payload that runs well below realtime), which isn't a trade worth
 * making here — oversized video is rejected with an explanation instead.
 */

/** GitHub's real ceiling is 100 MB per blob; leave room for the JSON envelope. */
export const MAX_BYTES = 95 * 1024 * 1024;

/** Animated GIFs would lose their frames on a canvas; SVG is text, not pixels. */
const RECODABLE = ["png", "jpg", "jpeg", "webp", "bmp", "avif"];

const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function canShrink(file: File) {
  return RECODABLE.includes(extOf(file.name));
}

export type ShrinkResult = {
  file: File;
  shrunk: boolean;
  from: number;
  to: number;
};

/**
 * Re-encodes an image until it fits under `max`, trading quality first and
 * resolution only when quality alone isn't enough.
 */
export async function shrinkToFit(
  file: File,
  max = MAX_BYTES,
): Promise<ShrinkResult> {
  if (file.size <= max)
    return { file, shrunk: false, from: file.size, to: file.size };

  if (!canShrink(file)) {
    const ext = extOf(file.name);
    throw new Error(
      ext === "gif"
        ? `"${file.name}" is over 95 MB. Animated GIFs can't be re-encoded in the browser without losing their frames.`
        : `"${file.name}" is over 95 MB and can't be compressed here. Video and archives need to be shrunk before upload.`,
    );
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`"${file.name}" is too large for the browser to decode.`);
  }

  // Keep alpha if the source had it; JPEG would flatten it to black.
  const alpha = ["png", "webp", "avif"].includes(extOf(file.name));
  const type = alpha ? "image/webp" : "image/jpeg";
  const newExt = alpha ? "webp" : "jpg";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");

  const encode = (q: number) =>
    new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));

  for (const scale of [1, 0.75, 0.55, 0.4, 0.28, 0.2]) {
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const q of [0.85, 0.7, 0.55, 0.4]) {
      const blob = await encode(q);
      if (!blob) continue;
      if (blob.size <= max) {
        bitmap.close();
        const renamed = file.name.replace(/\.[^.]+$/, "") + "." + newExt;
        return {
          file: new File([blob], renamed, { type }),
          shrunk: true,
          from: file.size,
          to: blob.size,
        };
      }
    }
  }

  bitmap.close();
  throw new Error(
    `"${file.name}" is still over 95 MB at the lowest quality setting.`,
  );
}
