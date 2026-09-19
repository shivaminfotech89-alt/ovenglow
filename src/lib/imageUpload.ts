/**
 * Turning a picked photo into something this app can actually store.
 *
 * There is no file server, so an uploaded photo has to live in the same
 * localStorage as everything else, as a data URL. A phone camera JPEG is
 * 3-8 MB and the whole origin gets roughly 5 MB, so a raw photo would blow the
 * budget on its own. Every upload is therefore resized and re-encoded before it
 * is stored, and the caller is told how big the result is.
 *
 * This is a stop-gap for a shop with no backend. Once one exists, upload the
 * original to object storage and keep a URL here instead.
 */

export const MAX_EDGE_PX = 900;
export const JPEG_QUALITY = 0.72;

/** Roughly how many bytes a data URL occupies (base64 is ~4/3 of the payload). */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface CompressedImage {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not an image we can read.'));
    img.src = src;
  });
}

/**
 * Resize to fit within MAX_EDGE_PX and re-encode.
 *
 * PNGs with transparency (a logo, typically) are kept as PNG so the background
 * does not turn black; everything else becomes JPEG, which is far smaller for
 * photographs.
 */
export async function compressImageFile(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file.');
  }

  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot process images.');
  ctx.drawImage(img, 0, 0, width, height);

  const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
  const dataUrl = keepAlpha
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  // A large PNG can come out bigger than the original; fall back to JPEG then.
  const asJpeg = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const best = keepAlpha && dataUrlBytes(dataUrl) > dataUrlBytes(asJpeg) * 2 ? asJpeg : dataUrl;

  return { dataUrl: best, bytes: dataUrlBytes(best), width, height };
}

/** How much of the origin's storage budget is currently used, best-effort. */
export function localStorageBytesUsed(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      total += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
    return total * 2; // UTF-16 code units
  } catch {
    return 0;
  }
}

/** Most browsers give an origin about 5 MB of localStorage. */
export const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024;

/**
 * The most a single photo may be, now that photos live in Firestore.
 *
 * Firestore caps one document at 1,048,576 bytes, and a photo is stored inline
 * on the product alongside its name, description and everything else. 700KB
 * leaves comfortable room for the rest; a 900px JPEG at the quality used here
 * lands around 60-150KB, so this is a backstop for an unusual image rather than
 * a limit anyone should meet.
 *
 * Without it an oversized photo fails at save time, with Firestore's own
 * message about document size -- long after the upload appeared to work.
 */
export const MAX_PHOTO_BYTES = 700 * 1024;
